// Migration real v2: re-fetch Blip API pra cada ticket, paginar, baixar mídia das URIs FRESH.
// Env:
//   DATABASE_URL, STORAGE_*, BLIP_DESK_API_KEY (obrigatórios)
//   CONCURRENCY_TICKETS (default 5)  — quantos tickets em paralelo
//   LIMIT_TICKETS                    — opcional, processa só os primeiros N (pra teste)

import { Client } from "pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const DATABASE_URL = process.env.DATABASE_URL!;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET!;
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY!;
const STORAGE_SECRET_KEY = process.env.STORAGE_SECRET_KEY!;
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT!;
const STORAGE_INTERNAL_ENDPOINT = process.env.STORAGE_INTERNAL_ENDPOINT ?? "http://minio:9000";
const BLIP_DESK_API_KEY = process.env.BLIP_DESK_API_KEY!;
const CONCURRENCY = Number(process.env.CONCURRENCY_TICKETS ?? "5");
const LIMIT_TICKETS = process.env.LIMIT_TICKETS ? Number(process.env.LIMIT_TICKETS) : undefined;
const MAX_PAGES_PER_TICKET = 100; // = max 10k msgs por ticket

if (!DATABASE_URL || !STORAGE_BUCKET || !STORAGE_ACCESS_KEY || !STORAGE_SECRET_KEY || !STORAGE_ENDPOINT || !BLIP_DESK_API_KEY) {
  console.error("Envs obrigatórias faltando");
  process.exit(1);
}

const MEDIA_REGEX = "^(image|audio|video)/|^application/(pdf|zip|x-rar|x-7z|gzip|msword|vnd\\.ms-|vnd\\.openxml|vnd\\.oasis)";

const FOLDER_MAP: Record<string, string> = {
  "image/jpeg": "images", "image/png": "images", "image/gif": "images", "image/webp": "images",
  "image/svg+xml": "images", "image/heic": "images",
  "audio/ogg": "audios", "audio/mpeg": "audios", "audio/mp4": "audios",
  "audio/aac": "audios", "audio/wav": "audios",
  "video/mp4": "videos", "video/ogg": "videos", "video/webm": "videos",
  "application/pdf": "documents", "application/msword": "documents",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "documents",
  "application/vnd.ms-excel": "documents",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "documents",
  "application/vnd.ms-powerpoint": "documents",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "documents",
  "application/zip": "archives", "application/x-zip-compressed": "archives",
  "application/x-rar-compressed": "archives",
  "application/x-7z-compressed": "archives", "application/gzip": "archives",
};

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp",
  "image/svg+xml": "svg", "image/heic": "heic",
  "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/aac": "aac", "audio/wav": "wav",
  "video/mp4": "mp4", "video/ogg": "ogv", "video/webm": "webm",
  "application/pdf": "pdf", "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/zip": "zip", "application/x-zip-compressed": "zip",
  "application/x-rar-compressed": "rar", "application/x-7z-compressed": "7z",
  "application/gzip": "gz",
};

function generateKey(contactId: string | null, type: string, msgId: string) {
  const folder = FOLDER_MAP[type] ?? "others";
  const ext = EXT_MAP[type] ?? "bin";
  const cid = (contactId ?? "unknown").replace(/[^a-zA-Z0-9-]/g, "");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${folder}/${cid}_${ts}_${msgId.slice(0, 8)}.${ext}`;
}

const pg = new Client({ connectionString: DATABASE_URL });
const s3 = new S3Client({
  endpoint: STORAGE_INTERNAL_ENDPOINT,
  region: "auto",
  credentials: { accessKeyId: STORAGE_ACCESS_KEY, secretAccessKey: STORAGE_SECRET_KEY },
  forcePathStyle: true,
});

await pg.connect();

// Tickets com mídia pendente
const ticketsRes = await pg.query<{ ticket_id: string; blip_ticket_id: string; pending_count: string }>(
  `SELECT t.id::text AS ticket_id, t.blip_id AS blip_ticket_id, COUNT(*)::text AS pending_count
   FROM tickets t
   JOIN messages m ON m.ticket_id = t.id
   WHERE m.content->>'type' ~ $1
     AND m.content->>'uri' IS NOT NULL
     AND m.content->>'uri' NOT LIKE $2
   GROUP BY t.id, t.blip_id
   ORDER BY COUNT(*) DESC`,
  [MEDIA_REGEX, `${STORAGE_ENDPOINT}/%`],
);
const totalTickets = ticketsRes.rows.length;
const tickets = LIMIT_TICKETS ? ticketsRes.rows.slice(0, LIMIT_TICKETS) : ticketsRes.rows;
const totalPending = ticketsRes.rows.reduce((sum, t) => sum + Number(t.pending_count), 0);
const limitedPending = tickets.reduce((sum, t) => sum + Number(t.pending_count), 0);

console.log("=== MIGRATE MEDIA v2 ===");
console.log(`Tickets c/ mídia pendente:  ${totalTickets}`);
console.log(`Mídias pendentes:           ${totalPending}`);
console.log(`Vai processar:              ${tickets.length} tickets / ~${limitedPending} mídias${LIMIT_TICKETS ? ` (LIMIT_TICKETS=${LIMIT_TICKETS})` : ""}`);
console.log(`Concorrência tickets:       ${CONCURRENCY}\n`);

type PendingMsg = { id: string; blip_id: string; type: string; uri: string; contact_id: string | null };

const startTime = Date.now();
let ticketsProcessed = 0;
let totalOk = 0;
let totalFail = 0;
let totalOrphan = 0; // pendentes que sumiram da API Blip
const errorStats: Record<string, number> = {};

async function processTicket(ticket: { ticket_id: string; blip_ticket_id: string }): Promise<void> {
  const pendingRes = await pg.query<PendingMsg>(
    `SELECT id::text, blip_id, content->>'type' AS type, content->>'uri' AS uri, contact_id::text
     FROM messages
     WHERE ticket_id = $1
       AND content->>'type' ~ $2
       AND content->>'uri' IS NOT NULL
       AND content->>'uri' NOT LIKE $3`,
    [ticket.ticket_id, MEDIA_REGEX, `${STORAGE_ENDPOINT}/%`],
  );
  const pendingByBlipId = new Map(pendingRes.rows.map((r) => [r.blip_id, r]));
  let ticketOk = 0;
  let ticketFail = 0;

  // Paginar Blip API
  for (let page = 0; page < MAX_PAGES_PER_TICKET && pendingByBlipId.size > 0; page++) {
    const skip = page * 100;
    let blipResp: Response;
    try {
      blipResp = await fetch("https://chabra.http.msging.net/commands", {
        method: "POST",
        headers: { Authorization: `Key ${BLIP_DESK_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          id: randomUUID(),
          to: "postmaster@desk.msging.net",
          method: "get",
          uri: `/tickets/${ticket.blip_ticket_id}/messages?$take=100&$skip=${skip}&$ascending=true&getFromOwnerIfTunnel=true`,
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (e) {
      errorStats["blip-fetch-error"] = (errorStats["blip-fetch-error"] ?? 0) + 1;
      break;
    }
    if (!blipResp.ok) {
      errorStats[`blip-${blipResp.status}`] = (errorStats[`blip-${blipResp.status}`] ?? 0) + 1;
      break;
    }
    const data: any = await blipResp.json();
    if (data.status !== "success" || !data.resource?.items) break;
    const items: any[] = data.resource.items;
    if (items.length === 0) break;

    // Match e processar
    for (const m of items) {
      const pending = pendingByBlipId.get(m.id);
      if (!pending) continue;
      const freshUri = m.content?.uri;
      const freshType = m.content?.type;
      if (!freshUri || typeof freshUri !== "string" || freshType !== pending.type) {
        pendingByBlipId.delete(m.id);
        ticketFail++;
        errorStats["no-fresh-uri-or-type-mismatch"] = (errorStats["no-fresh-uri-or-type-mismatch"] ?? 0) + 1;
        continue;
      }
      try {
        const dl = await fetch(freshUri, {
          headers: { "User-Agent": "chabra-media-migration/2.0" },
          redirect: "follow",
          signal: AbortSignal.timeout(45_000),
        });
        if (!dl.ok) {
          errorStats[`dl-${dl.status}`] = (errorStats[`dl-${dl.status}`] ?? 0) + 1;
          ticketFail++;
          continue;
        }
        const buf = Buffer.from(await dl.arrayBuffer());
        if (buf.length === 0) {
          errorStats["dl-empty"] = (errorStats["dl-empty"] ?? 0) + 1;
          ticketFail++;
          continue;
        }
        const key = generateKey(pending.contact_id, pending.type, pending.id);
        await s3.send(
          new PutObjectCommand({
            Bucket: STORAGE_BUCKET,
            Key: key,
            Body: buf,
            ContentType: pending.type,
            CacheControl: "public, max-age=31536000",
          }),
        );
        const newUri = `${STORAGE_ENDPOINT}/${STORAGE_BUCKET}/${key}`;
        await pg.query(
          `UPDATE messages SET content = jsonb_set(content, '{uri}', to_jsonb($1::text)) WHERE id = $2`,
          [newUri, pending.id],
        );
        pendingByBlipId.delete(m.id);
        ticketOk++;
      } catch (e) {
        const msg = e instanceof Error ? e.message.slice(0, 50) : "?";
        errorStats[`exception:${msg}`] = (errorStats[`exception:${msg}`] ?? 0) + 1;
        ticketFail++;
      }
    }

    if (items.length < 100) break;
  }

  const orphan = pendingByBlipId.size;
  totalOk += ticketOk;
  totalFail += ticketFail;
  totalOrphan += orphan;
  ticketsProcessed++;

  const elapsed = (Date.now() - startTime) / 1000;
  const rate = ticketsProcessed / Math.max(elapsed, 0.001);
  console.log(
    `  [${ticketsProcessed}/${tickets.length}] ticket=${ticket.blip_ticket_id.slice(0, 8)} ` +
    `pending=${pendingRes.rows.length} ok=${ticketOk} fail=${ticketFail} orphan=${orphan} ` +
    `| total ok=${totalOk} fail=${totalFail} orphan=${totalOrphan} ${rate.toFixed(1)}t/s`,
  );
}

// Concorrência: sliding window
let idx = 0;
async function worker() {
  while (idx < tickets.length) {
    const i = idx++;
    await processTicket(tickets[i]);
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tickets.length) }, () => worker()));

const elapsed = (Date.now() - startTime) / 1000;
console.log("\n=== DONE ===");
console.log(`Tickets processed:  ${ticketsProcessed}`);
console.log(`Migrated OK:        ${totalOk}`);
console.log(`Failed:             ${totalFail}`);
console.log(`Orphan (no match):  ${totalOrphan}`);
console.log(`Elapsed:            ${elapsed.toFixed(1)}s (avg ${(ticketsProcessed / Math.max(elapsed, 0.001)).toFixed(2)} tickets/s)`);

if (Object.keys(errorStats).length > 0) {
  console.log("\n=== Distribuição de erros ===");
  for (const [k, v] of Object.entries(errorStats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(6)}  ${k}`);
  }
}

await pg.end();
process.exit(0);

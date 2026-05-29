// import-all-tickets-with-media.ts — standalone na .107.
// Replica a lógica de src/actions/tickets/import-ticket-messages.ts mas:
//   - Postgres direto via pg (TCP local, sem WS tunnel)
//   - MinIO direto via S3 (loopback, sem CF tunnel)
//   - Sem timeout Vercel — roda até terminar
//   - Concorrência alta (default 10 tickets em paralelo)
//   - Mídia inline: pra cada msg nova com mídia, baixa do Blip + upload MinIO + persist URL local
//
// Env:
//   DATABASE_URL, STORAGE_*, BLIP_DESK_API_KEY (obrigatórios)
//   CONCURRENCY_TICKETS (default 10)
//   LIMIT_TICKETS (opcional, teste)

import { Client, Pool } from "pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const DATABASE_URL = process.env.DATABASE_URL!;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET!;
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY!;
const STORAGE_SECRET_KEY = process.env.STORAGE_SECRET_KEY!;
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT!;
const STORAGE_INTERNAL_ENDPOINT = process.env.STORAGE_INTERNAL_ENDPOINT ?? "http://minio:9000";
// STORAGE_PUBLIC_URL: URL base usada nos links gravados em messages.content.uri
// (browser-facing, ex: https://storage.chabra.com.br). Sem ela cai pra STORAGE_ENDPOINT
// — caso de bug pré-Fase 2 em que URIs entravam com host interno minio:9000 e não
// carregavam no browser. Ver wiki/db-messages/bug-media-uri-host-interno.md.
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL ?? STORAGE_ENDPOINT;
const BLIP_DESK_API_KEY = process.env.BLIP_DESK_API_KEY!;
const CONCURRENCY = Number(process.env.CONCURRENCY_TICKETS ?? "10");
const LIMIT_TICKETS = process.env.LIMIT_TICKETS ? Number(process.env.LIMIT_TICKETS) : undefined;
const MODE = (process.env.IMPORT_MODE ?? "delta") as "delta" | "full" | "since-days";
const SINCE_DAYS = process.env.SINCE_DAYS ? Number(process.env.SINCE_DAYS) : undefined;

const MAX_SKIP = 10_000;
const BATCH_SIZE = 100;

if (!DATABASE_URL || !BLIP_DESK_API_KEY || !STORAGE_BUCKET || !STORAGE_ACCESS_KEY || !STORAGE_SECRET_KEY || !STORAGE_ENDPOINT) {
  console.error("Envs obrigatórias faltando");
  process.exit(1);
}

const STORAGE_BASE = STORAGE_PUBLIC_URL.replace(/\/+$/, "");
const STORAGE_PREFIX = `${STORAGE_BASE}/${STORAGE_BUCKET}/`;

const MEDIA_TYPE_PATTERN = /^(image|audio|video)\/|^application\/(pdf|zip|x-rar|x-7z|gzip|msword|vnd\.ms-|vnd\.openxml|vnd\.oasis)/;

const FOLDER_MAP: Record<string, string> = {
  "image/jpeg": "images", "image/png": "images", "image/gif": "images", "image/webp": "images",
  "image/svg+xml": "images", "image/heic": "images",
  "audio/ogg": "audios", "audio/mpeg": "audios", "audio/mp4": "audios", "audio/aac": "audios", "audio/wav": "audios",
  "video/mp4": "videos", "video/ogg": "videos", "video/webm": "videos",
  "application/pdf": "documents", "application/msword": "documents",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "documents",
  "application/vnd.ms-excel": "documents",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "documents",
  "application/vnd.ms-powerpoint": "documents",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "documents",
  "application/zip": "archives", "application/x-zip-compressed": "archives",
  "application/x-rar-compressed": "archives", "application/x-7z-compressed": "archives", "application/gzip": "archives",
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
  "application/x-rar-compressed": "rar", "application/x-7z-compressed": "7z", "application/gzip": "gz",
};

function isBlipMediaType(t: unknown): t is string {
  return typeof t === "string" && MEDIA_TYPE_PATTERN.test(t);
}

function generateKey(contactId: string | null, type: string, msgId: string): string {
  const folder = FOLDER_MAP[type] ?? "others";
  const ext = EXT_MAP[type] ?? "bin";
  const cid = (contactId ?? "unknown").replace(/[^a-zA-Z0-9-]/g, "");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${folder}/${cid}_${ts}_${msgId.slice(0, 8)}.${ext}`;
}

const s3 = new S3Client({
  endpoint: STORAGE_INTERNAL_ENDPOINT,
  region: "auto",
  credentials: { accessKeyId: STORAGE_ACCESS_KEY, secretAccessKey: STORAGE_SECRET_KEY },
  forcePathStyle: true,
});

async function downloadAndStoreMedia(originalUri: string, contactId: string | null, type: string, msgId: string): Promise<string> {
  if (originalUri.startsWith(STORAGE_PREFIX)) return originalUri;
  const dl = await fetch(originalUri, {
    headers: { "User-Agent": "chabra-import/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });
  if (!dl.ok) throw new Error(`HTTP ${dl.status}`);
  const buf = Buffer.from(await dl.arrayBuffer());
  if (buf.length === 0) throw new Error("empty body");
  const key = generateKey(contactId, type, msgId);
  await s3.send(new PutObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
    Body: buf,
    ContentType: type,
    CacheControl: "public, max-age=31536000",
  }));
  return `${STORAGE_PREFIX}${key}`;
}

async function fetchTicketMessages(blipTicketId: string, skip: number): Promise<any[]> {
  const resp = await fetch("https://chabra.http.msging.net/commands", {
    method: "POST",
    headers: { Authorization: `Key ${BLIP_DESK_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      id: randomUUID(),
      to: "postmaster@desk.msging.net",
      method: "get",
      uri: `/tickets/${blipTicketId}/messages?$take=${BATCH_SIZE}&$skip=${skip}&$ascending=true&getFromOwnerIfTunnel=true`,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) throw new Error(`blip-${resp.status}`);
  const data: any = await resp.json();
  if (data.status !== "success") throw new Error("blip-non-success");
  return data.resource?.items ?? [];
}

const pool = new Pool({ connectionString: DATABASE_URL, max: 20 });

type Stats = { processed: number; created: number; linked: number; mediaOk: number; mediaFail: number; errors: Record<string, number> };
const globalStats: Stats = { processed: 0, created: 0, linked: 0, mediaOk: 0, mediaFail: 0, errors: {} };

function err(k: string) { globalStats.errors[k] = (globalStats.errors[k] ?? 0) + 1; }

// Job tracking — cria registro em import_jobs e atualiza periodicamente
// pra que a UI /imports possa mostrar progresso em andamento.
let JOB_ID: string | null = null;

async function createImportJob(total: number): Promise<string> {
  const c = await pool.connect();
  try {
    const r = await c.query<{ id: string }>(
      `INSERT INTO import_jobs (
         id, total, processed, succeeded, failed_count, failed,
         status, started_at, created_at, updated_at, metadata
       )
       VALUES (
         gen_random_uuid()::text, $1, 0, 0, 0, '{}'::jsonb[],
         'running'::import_job_status, NOW(), NOW(), NOW(), $2::jsonb
       )
       RETURNING id`,
      [total, createImportJobMetadata(MODE)],
    );
    return r.rows[0].id;
  } finally {
    c.release();
  }
}

function createImportJobMetadata(mode: string): string {
  return JSON.stringify({
    type: "import-all-standalone-107",
    mode,
    description: `Import standalone (mode=${mode}, mídia inline, rodando na .107)`,
    container: process.env.HOSTNAME ?? "import-all-bg",
  });
}

async function updateImportJob(): Promise<void> {
  if (!JOB_ID) return;
  const c = await pool.connect();
  try {
    const totalErrors = Object.values(globalStats.errors).reduce((a, b) => a + b, 0);
    await c.query(
      `UPDATE import_jobs SET
         processed = $1,
         succeeded = $2,
         failed_count = $3,
         updated_at = NOW(),
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
           'created', $4::int,
           'linked', $5::int,
           'mediaOk', $6::int,
           'mediaFail', $7::int,
           'lastUpdate', NOW()::text
         )
       WHERE id = $8`,
      [
        globalStats.processed,
        Math.max(0, globalStats.processed - totalErrors),
        totalErrors,
        globalStats.created,
        globalStats.linked,
        globalStats.mediaOk,
        globalStats.mediaFail,
        JOB_ID,
      ],
    );
  } finally {
    c.release();
  }
}

async function completeImportJob(status: "completed" | "failed"): Promise<void> {
  if (!JOB_ID) return;
  const c = await pool.connect();
  try {
    const totalErrors = Object.values(globalStats.errors).reduce((a, b) => a + b, 0);
    await c.query(
      `UPDATE import_jobs SET
         processed = $1, succeeded = $2, failed_count = $3,
         status = $4::import_job_status, completed_at = NOW(), updated_at = NOW(),
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
           'created', $5::int, 'linked', $6::int,
           'mediaOk', $7::int, 'mediaFail', $8::int
         )
       WHERE id = $9`,
      [
        globalStats.processed,
        Math.max(0, globalStats.processed - totalErrors),
        totalErrors,
        status,
        globalStats.created, globalStats.linked,
        globalStats.mediaOk, globalStats.mediaFail,
        JOB_ID,
      ],
    );
  } finally {
    c.release();
  }
}

async function processTicket(ticket: { id: string; blip_id: string; customer_identity: string | null }): Promise<void> {
  const client = await pool.connect();
  try {
    let contactId: string | null = null;

    const r1 = await client.query<{ contact_id: string | null }>(
      `SELECT contact_id::text FROM messages WHERE ticket_id = $1 LIMIT 1`,
      [ticket.id],
    );
    contactId = r1.rows[0]?.contact_id ?? null;

    if (!contactId && ticket.customer_identity) {
      const r2 = await client.query<{ id: string }>(
        `SELECT id::text FROM contacts WHERE identity = $1 LIMIT 1`,
        [ticket.customer_identity],
      );
      contactId = r2.rows[0]?.id ?? null;
    }

    let skip = 0;
    while (skip < MAX_SKIP) {
      let messages: any[];
      try {
        messages = await fetchTicketMessages(ticket.blip_id, skip);
      } catch (e) {
        err(`fetch:${e instanceof Error ? e.message.slice(0, 20) : "?"}`);
        break;
      }
      if (messages.length === 0) break;

      const blipIds = messages.map((m) => m.id).filter(Boolean);
      const existingRes = await client.query<{ blip_id: string; ticket_id: string | null; contact_id: string | null }>(
        `SELECT blip_id, ticket_id::text, contact_id::text FROM messages WHERE blip_id = ANY($1::text[])`,
        [blipIds],
      );
      const existingMap = new Map(existingRes.rows.map((r) => [r.blip_id, r]));

      if (!contactId) {
        const e = existingRes.rows.find((r) => r.contact_id);
        if (e?.contact_id) contactId = e.contact_id;
      }

      const toCreate = messages.filter((m) => !existingMap.has(m.id));
      const toLink = existingRes.rows.filter((r) => r.ticket_id !== ticket.id);

      if (toCreate.length > 0 && contactId) {
        // Media inline pra cada msg de mídia
        for (const m of toCreate) {
          const c = m.content;
          if (c && typeof c === "object" && isBlipMediaType(c.type) && typeof c.uri === "string") {
            try {
              const newUri = await downloadAndStoreMedia(c.uri, contactId, c.type, m.id);
              m.content = { ...c, uri: newUri };
              globalStats.mediaOk++;
            } catch (e) {
              globalStats.mediaFail++;
              err(`media:${e instanceof Error ? e.message.slice(0, 20) : "?"}`);
            }
          }
        }

        // INSERT batch via UNNEST pra performance
        const blipIdsP: string[] = [];
        const directionsP: string[] = [];
        const typesP: string[] = [];
        const contentsP: string[] = [];
        const statusesP: string[] = [];
        const metadatasP: (string | null)[] = [];
        const sentAtsP: Date[] = [];

        for (const m of toCreate) {
          blipIdsP.push(m.id);
          directionsP.push(m.direction === "sent" ? "sent" : "received");
          typesP.push(m.type ?? "unknown");
          contentsP.push(JSON.stringify(m.content));
          statusesP.push(m.status === "consumed" ? "consumed" : "dispatched");
          metadatasP.push(m.metadata ? JSON.stringify(m.metadata) : null);
          sentAtsP.push(new Date(m.date));
        }

        try {
          const r = await client.query<{ id: string }>(
            `INSERT INTO messages (id, blip_id, direction, type, content, status, metadata, sent_at, contact_id, ticket_id, created_at)
             SELECT gen_random_uuid(), bid, dir::message_directions, typ, ctn::jsonb, st::message_status, mt::jsonb, sat, $8, $9, NOW()
             FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::timestamptz[])
                  AS t(bid, dir, typ, ctn, st, mt, sat)
             ON CONFLICT (blip_id) DO NOTHING
             RETURNING id`,
            [blipIdsP, directionsP, typesP, contentsP, statusesP, metadatasP, sentAtsP, contactId, ticket.id],
          );
          globalStats.created += r.rowCount ?? 0;
        } catch (e) {
          err(`insert:${e instanceof Error ? e.message.slice(0, 30) : "?"}`);
        }
      }

      if (toLink.length > 0 && contactId) {
        try {
          await client.query(
            `UPDATE messages SET ticket_id = $1, contact_id = COALESCE(contact_id, $2)
             WHERE blip_id = ANY($3::text[])`,
            [ticket.id, contactId, toLink.map((r) => r.blip_id)],
          );
          globalStats.linked += toLink.length;
        } catch (e) {
          err(`link:${e instanceof Error ? e.message.slice(0, 20) : "?"}`);
        }
      }

      skip += BATCH_SIZE;
      if (messages.length < BATCH_SIZE) break;
    }

    // Update messageCount + contact_id + last_message_date no ticket. O delta
    // filter depende de message_count > 0 pra pular tickets já processados;
    // last_message_date é usado pela UI /contacts pra ordenação.
    try {
      await client.query(
        `UPDATE tickets SET
           message_count     = (SELECT COUNT(*) FROM messages WHERE ticket_id = $1),
           last_message_date = (SELECT MAX(sent_at) FROM messages WHERE ticket_id = $1),
           contact_id        = COALESCE(contact_id, $2)
         WHERE id = $1`,
        [ticket.id, contactId],
      );
    } catch {}

    globalStats.processed++;
  } finally {
    client.release();
  }
}

// ============== MAIN ==============
const start = Date.now();
const pgInit = new Client({ connectionString: DATABASE_URL });
await pgInit.connect();

let where = "";
let orderDir = "DESC";

if (MODE === "full") {
  // Sweep completo (semanal). ASC pra processar mais antigos primeiro = estabilidade
  // em caso de retomada parcial.
  orderDir = "ASC";
} else if (MODE === "since-days" && SINCE_DAYS) {
  where = `WHERE last_message_date > NOW() - INTERVAL '${SINCE_DAYS} days'`;
} else {
  // delta (default): tickets abertos OR criados após última run OR backlog não processado.
  // `last_message_date` é populado pelo processTicket abaixo — quando faltar é porque
  // o ticket nunca foi tocado, mas `message_count = 0` já cobre esse caso.
  // Reduz pool de ~23k tickets pra ~7.6k na primeira run (drena backlog) → ~2k/run depois.
  where = `
    WHERE closed = false
       OR storage_date > COALESCE(
            (SELECT MAX(completed_at) - INTERVAL '12 hours'
               FROM import_jobs
              WHERE metadata->>'type' = 'import-all-standalone-107'
                AND status = 'completed'),
            NOW() - INTERVAL '90 days'
          )
       OR message_count = 0
  `;
}

const ticketsRes = await pgInit.query<{ id: string; blip_id: string; customer_identity: string | null }>(
  `SELECT id::text, blip_id, customer_identity FROM tickets ${where} ORDER BY storage_date ${orderDir}`,
);
await pgInit.end();
console.log(`Modo: ${MODE} | Tickets selecionados: ${ticketsRes.rowCount} (de 23k+ totais)`);

const tickets = LIMIT_TICKETS ? ticketsRes.rows.slice(0, LIMIT_TICKETS) : ticketsRes.rows;
console.log(`\n=== IMPORT ALL TICKETS w/ MEDIA ===`);
console.log(`Tickets: ${tickets.length}  | Concorrência: ${CONCURRENCY}`);

// Cria job no DB pra UI /imports poder acompanhar
JOB_ID = await createImportJob(tickets.length);
console.log(`Import job id: ${JOB_ID}\n`);

let idx = 0;
async function worker() {
  while (idx < tickets.length) {
    const i = idx++;
    const t = tickets[i];
    try {
      await processTicket(t);
    } catch (e) {
      err(`ticket:${e instanceof Error ? e.message.slice(0, 20) : "?"}`);
    }
    if ((globalStats.processed) % 25 === 0 || globalStats.processed === tickets.length) {
      const el = (Date.now() - start) / 1000;
      const rate = globalStats.processed / Math.max(el, 0.001);
      const eta = (tickets.length - globalStats.processed) / Math.max(rate, 0.001);
      console.log(
        `  [${globalStats.processed}/${tickets.length}] ` +
        `created=${globalStats.created} linked=${globalStats.linked} ` +
        `media_ok=${globalStats.mediaOk} media_fail=${globalStats.mediaFail} ` +
        `| ${rate.toFixed(2)}t/s ETA=${Math.round(eta)}s`,
      );
      // Sync DB (fire-and-forget pra não bloquear)
      updateImportJob().catch(() => {});
    }
  }
}
try {
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tickets.length) }, () => worker()));
  await completeImportJob("completed");
} catch (e) {
  await completeImportJob("failed");
  throw e;
}

const elapsed = (Date.now() - start) / 1000;
console.log(`\n=== DONE ===`);
console.log(`Processed: ${globalStats.processed}/${tickets.length}`);
console.log(`Messages created: ${globalStats.created}`);
console.log(`Messages relinked: ${globalStats.linked}`);
console.log(`Media uploaded: ${globalStats.mediaOk}`);
console.log(`Media failed:   ${globalStats.mediaFail}`);
console.log(`Elapsed: ${elapsed.toFixed(0)}s (${(elapsed / 60).toFixed(1)}min)`);
if (Object.keys(globalStats.errors).length > 0) {
  console.log(`\n=== Erros (top 20) ===`);
  for (const [k, v] of Object.entries(globalStats.errors).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${String(v).padStart(6)}  ${k}`);
  }
}
await pool.end();
process.exit(0);

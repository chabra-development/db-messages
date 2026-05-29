// migrate-media-v3.ts — re-fetch Blip API e migrar mídia pro MinIO.
// Cobre 2 caminhos:
//   Fase A: mensagens COM ticket_id  → /tickets/{blip}/messages (DESK key)
//   Fase B: mensagens SEM ticket_id  → /threads/{identity}      (ROUTER key)
//
// Env:
//   DATABASE_URL, STORAGE_*, BLIP_DESK_API_KEY, ROUTER_API_KEY
//   CONCURRENCY (default 5)
//   LIMIT_TICKETS / LIMIT_CONTACTS — opcionais

import { Client } from "pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const DATABASE_URL = process.env.DATABASE_URL!;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET!;
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY!;
const STORAGE_SECRET_KEY = process.env.STORAGE_SECRET_KEY!;
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT!;
const STORAGE_INTERNAL_ENDPOINT = process.env.STORAGE_INTERNAL_ENDPOINT ?? "http://minio:9000";
// STORAGE_PUBLIC_URL: URL base usada para os links gravados em messages.content.uri.
// Sem ela cai pra STORAGE_ENDPOINT — caso de bug pré-Fase 2. Ver wiki bug-media-uri-host-interno.
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL ?? STORAGE_ENDPOINT;
const BLIP_DESK_API_KEY = process.env.BLIP_DESK_API_KEY!;
const ROUTER_API_KEY = process.env.ROUTER_API_KEY!;
const CONCURRENCY = Number(process.env.CONCURRENCY ?? "5");
const LIMIT_TICKETS = process.env.LIMIT_TICKETS ? Number(process.env.LIMIT_TICKETS) : undefined;
const LIMIT_CONTACTS = process.env.LIMIT_CONTACTS ? Number(process.env.LIMIT_CONTACTS) : undefined;
const SKIP_TICKETS = process.env.SKIP_TICKETS === "1";
const SKIP_CONTACTS = process.env.SKIP_CONTACTS === "1";
const MAX_PAGES = Number(process.env.MAX_PAGES ?? "100"); // até 10k msgs por escopo

if (!DATABASE_URL || !STORAGE_BUCKET || !STORAGE_ACCESS_KEY || !STORAGE_SECRET_KEY || !STORAGE_ENDPOINT || !BLIP_DESK_API_KEY || !ROUTER_API_KEY) {
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

const s3 = new S3Client({
  endpoint: STORAGE_INTERNAL_ENDPOINT,
  region: "auto",
  credentials: { accessKeyId: STORAGE_ACCESS_KEY, secretAccessKey: STORAGE_SECRET_KEY },
  forcePathStyle: true,
});

// Pools de connection separados pra não conflict
const pgRead = new Client({ connectionString: DATABASE_URL });
const pgWrite = new Client({ connectionString: DATABASE_URL });
await Promise.all([pgRead.connect(), pgWrite.connect()]);

type PendingMsg = { id: string; blip_id: string; type: string; uri: string; contact_id: string | null };
type Stats = { ok: number; fail: number; orphan: number; errs: Record<string, number> };
const globalStats: Stats = { ok: 0, fail: 0, orphan: 0, errs: {} };
const writeLock: Promise<unknown>[] = [];

function addError(key: string, stats: Stats) {
  stats.errs[key] = (stats.errs[key] ?? 0) + 1;
  globalStats.errs[key] = (globalStats.errs[key] ?? 0) + 1;
}

async function downloadAndStore(pending: PendingMsg, freshUri: string, freshType: string, stats: Stats): Promise<boolean> {
  if (freshType !== pending.type) {
    addError("type-mismatch", stats);
    return false;
  }
  try {
    const dl = await fetch(freshUri, {
      headers: { "User-Agent": "chabra-media-migration/3.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(45_000),
    });
    if (!dl.ok) {
      addError(`dl-${dl.status}`, stats);
      return false;
    }
    const buf = Buffer.from(await dl.arrayBuffer());
    if (buf.length === 0) { addError("dl-empty", stats); return false; }
    const key = generateKey(pending.contact_id, pending.type, pending.id);
    await s3.send(new PutObjectCommand({
      Bucket: STORAGE_BUCKET, Key: key, Body: buf,
      ContentType: pending.type, CacheControl: "public, max-age=31536000",
    }));
    const newUri = `${STORAGE_PUBLIC_URL}/${STORAGE_BUCKET}/${key}`;
    const w = pgWrite.query(
      `UPDATE messages SET content = jsonb_set(content, '{uri}', to_jsonb($1::text)) WHERE id = $2`,
      [newUri, pending.id],
    );
    writeLock.push(w);
    if (writeLock.length > 20) { await Promise.all(writeLock); writeLock.length = 0; }
    return true;
  } catch (e) {
    const m = e instanceof Error ? e.message.slice(0, 40) : "?";
    addError(`exception:${m}`, stats);
    return false;
  }
}

async function fetchBlipItems(to: string, uri: string, key: string): Promise<any[] | null> {
  try {
    const resp = await fetch("https://chabra.http.msging.net/commands", {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: randomUUID(), to, method: "get", uri }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!resp.ok) return null;
    const data: any = await resp.json();
    if (data.status !== "success") return null;
    return data.resource?.items ?? [];
  } catch { return null; }
}

async function processScope(label: string, items: PendingMsg[], fetchPage: (skip: number) => Promise<any[] | null>): Promise<Stats> {
  const stats: Stats = { ok: 0, fail: 0, orphan: 0, errs: {} };
  const pending = new Map(items.map(i => [i.blip_id, i]));
  for (let page = 0; page < MAX_PAGES && pending.size > 0; page++) {
    const blipItems = await fetchPage(page * 100);
    if (!blipItems) { addError("blip-fetch-fail", stats); break; }
    if (blipItems.length === 0) break;
    for (const m of blipItems) {
      const p = pending.get(m.id);
      if (!p) continue;
      const freshUri = m.content?.uri;
      const freshType = m.content?.type;
      if (typeof freshUri !== "string" || typeof freshType !== "string") {
        pending.delete(m.id);
        stats.fail++; globalStats.fail++; addError("no-fresh-uri", stats);
        continue;
      }
      const ok = await downloadAndStore(p, freshUri, freshType, stats);
      pending.delete(m.id);
      if (ok) { stats.ok++; globalStats.ok++; }
      else { stats.fail++; globalStats.fail++; }
    }
    if (blipItems.length < 100) break;
  }
  const orphan = pending.size;
  stats.orphan = orphan;
  globalStats.orphan += orphan;
  return stats;
}

const startTime = Date.now();

// ============ FASE A — tickets ============
if (!SKIP_TICKETS) {
  console.log("\n========== FASE A — TICKETS ==========");
  const ticketsRes = await pgRead.query<{ ticket_id: string; blip_ticket_id: string; pending_count: string }>(
    `SELECT t.id::text AS ticket_id, t.blip_id AS blip_ticket_id, COUNT(*)::text AS pending_count
     FROM tickets t JOIN messages m ON m.ticket_id = t.id
     WHERE m.content->>'type' ~ $1 AND m.content->>'uri' LIKE 'https://blipmediastore%'
     GROUP BY t.id, t.blip_id ORDER BY COUNT(*) DESC`,
    [MEDIA_REGEX],
  );
  const allTickets = ticketsRes.rows;
  const tickets = LIMIT_TICKETS ? allTickets.slice(0, LIMIT_TICKETS) : allTickets;
  const totalMediasA = tickets.reduce((s, t) => s + Number(t.pending_count), 0);
  console.log(`Tickets: ${allTickets.length}  | processando: ${tickets.length}  | mídias: ${totalMediasA}`);

  let idxA = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tickets.length) }, async () => {
    while (idxA < tickets.length) {
      const i = idxA++;
      const t = tickets[i];
      const itemsRes = await pgRead.query<PendingMsg>(
        `SELECT id::text, blip_id, content->>'type' AS type, content->>'uri' AS uri, contact_id::text
         FROM messages WHERE ticket_id = $1 AND content->>'type' ~ $2
           AND content->>'uri' LIKE 'https://blipmediastore%'`,
        [t.ticket_id, MEDIA_REGEX],
      );
      const s = await processScope(`ticket ${t.blip_ticket_id.slice(0,8)}`, itemsRes.rows,
        (skip) => fetchBlipItems("postmaster@desk.msging.net",
          `/tickets/${t.blip_ticket_id}/messages?$take=100&$skip=${skip}&$ascending=true&getFromOwnerIfTunnel=true`,
          BLIP_DESK_API_KEY,
        ),
      );
      if ((i + 1) % 10 === 0 || i === tickets.length - 1) {
        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`  [A ${i+1}/${tickets.length}] ok=${globalStats.ok} fail=${globalStats.fail} orphan=${globalStats.orphan} | ${elapsed.toFixed(0)}s`);
      }
    }
  }));
  await Promise.all(writeLock); writeLock.length = 0;
  console.log(`Fase A: ok=${globalStats.ok} fail=${globalStats.fail} orphan=${globalStats.orphan}`);
}

// ============ FASE B — threads/contacts ============
const savedAOk = globalStats.ok;
const savedAFail = globalStats.fail;
const savedAOrphan = globalStats.orphan;

if (!SKIP_CONTACTS) {
  console.log("\n========== FASE B — THREADS POR CONTATO ==========");
  const contactsRes = await pgRead.query<{ contact_id: string; identity: string; pending_count: string }>(
    `SELECT c.id::text AS contact_id, c.identity, COUNT(*)::text AS pending_count
     FROM contacts c JOIN messages m ON m.contact_id = c.id
     WHERE m.content->>'type' ~ $1 AND m.content->>'uri' LIKE 'https://blipmediastore%'
       AND m.ticket_id IS NULL
     GROUP BY c.id, c.identity ORDER BY COUNT(*) DESC`,
    [MEDIA_REGEX],
  );
  const allContacts = contactsRes.rows;
  const contacts = LIMIT_CONTACTS ? allContacts.slice(0, LIMIT_CONTACTS) : allContacts;
  const totalMediasB = contacts.reduce((s, t) => s + Number(t.pending_count), 0);
  console.log(`Contatos: ${allContacts.length}  | processando: ${contacts.length}  | mídias: ${totalMediasB}`);

  let idxB = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, contacts.length) }, async () => {
    while (idxB < contacts.length) {
      const i = idxB++;
      const c = contacts[i];
      const itemsRes = await pgRead.query<PendingMsg>(
        `SELECT id::text, blip_id, content->>'type' AS type, content->>'uri' AS uri, contact_id::text
         FROM messages WHERE contact_id = $1 AND ticket_id IS NULL
           AND content->>'type' ~ $2 AND content->>'uri' LIKE 'https://blipmediastore%'`,
        [c.contact_id, MEDIA_REGEX],
      );
      const encId = encodeURIComponent(c.identity);
      await processScope(`contact ${c.identity.slice(0,15)}`, itemsRes.rows,
        (skip) => fetchBlipItems("postmaster@msging.net",
          `/threads/${encId}?$take=100&$skip=${skip}`,
          ROUTER_API_KEY,
        ),
      );
      if ((i + 1) % 10 === 0 || i === contacts.length - 1) {
        const elapsed = (Date.now() - startTime) / 1000;
        const phaseB = globalStats.ok - savedAOk;
        console.log(`  [B ${i+1}/${contacts.length}] phase-ok=${phaseB} fail=${globalStats.fail - savedAFail} orphan=${globalStats.orphan - savedAOrphan} | ${elapsed.toFixed(0)}s total`);
      }
    }
  }));
  await Promise.all(writeLock); writeLock.length = 0;
}

const elapsed = (Date.now() - startTime) / 1000;
console.log("\n========== DONE ==========");
console.log(`Total OK:           ${globalStats.ok}`);
console.log(`Total Failed:       ${globalStats.fail}`);
console.log(`Total Orphan:       ${globalStats.orphan}`);
console.log(`Elapsed:            ${elapsed.toFixed(0)}s (${(elapsed/60).toFixed(1)}min)`);

if (Object.keys(globalStats.errs).length > 0) {
  console.log("\n=== Erros ===");
  for (const [k, v] of Object.entries(globalStats.errs).sort((a, b) => b[1] - a[1]).slice(0, 25)) {
    console.log(`  ${String(v).padStart(6)}  ${k}`);
  }
}

await pgRead.end(); await pgWrite.end();
process.exit(0);

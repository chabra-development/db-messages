// import-new-tickets-standalone.ts
// Standalone (sem Prisma, sem Next): pega tickets criados no Blip após MAX(storage_date) do DB.
// Insere em `tickets` (idempotente via ON CONFLICT blip_id).
// Roda em container oven/bun, disparado pelo wrapper run-import-daily.ps1.

import { Pool } from "pg";
import { randomUUID } from "node:crypto";

const DATABASE_URL = process.env.DATABASE_URL;
const BLIP_DESK_API_KEY = process.env.BLIP_DESK_API_KEY;
const SINCE_DAYS_FALLBACK = process.env.SINCE_TICKETS_DAYS ? Number(process.env.SINCE_TICKETS_DAYS) : 30;

if (!DATABASE_URL || !BLIP_DESK_API_KEY) {
  console.error("Envs obrigatórias faltando: DATABASE_URL, BLIP_DESK_API_KEY");
  process.exit(1);
}

const STATUS_MAP: Record<string, string> = {
  waiting: "waiting",
  assigned: "waiting",
  open: "in_attendance",
  inattendance: "in_attendance",
  closedattendant: "closed_attendant",
  closedclient: "closed_client",
  closedsystem: "closed_system",
  transferred: "transferred",
};

function mapStatus(s: string): string {
  return STATUS_MAP[s.toLowerCase().replace(/\s+/g, "")] || "waiting";
}

interface BlipTicket {
  id: string;
  sequentialId: number;
  parentSequentialId?: number | null;
  externalId?: string | null;
  ownerIdentity: string;
  customerIdentity: string;
  customerDomain: string;
  agentIdentity?: string | null;
  provider: string;
  status: string;
  closed: boolean;
  closedBy?: string | null;
  team: string;
  rating?: number;
  priority?: number;
  isAutomaticDistribution?: boolean | null;
  distributionType?: string | null;
  storageDate: string;
  statusDate?: string;
  openDate?: string | null;
  closeDate?: string | null;
  firstResponseDate?: string | null;
}

async function fetchBatch(skip: number, take: number): Promise<BlipTicket[]> {
  const res = await fetch("https://chabra.http.msging.net/commands", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${BLIP_DESK_API_KEY}`,
    },
    body: JSON.stringify({
      id: randomUUID(),
      method: "get",
      to: "postmaster@desk.msging.net",
      uri: `/tickets?$skip=${skip}&$take=${take}`,
    }),
  });
  if (!res.ok) throw new Error(`Blip API ${res.status}`);
  const data = await res.json() as { status: string; resource: { items: BlipTicket[] } };
  if (data.status !== "success") throw new Error("Blip status != success");
  return data.resource.items;
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function upsertJob(id: string, fields: Record<string, unknown>) {
  const meta = JSON.stringify({
    type: "tickets-standalone-107",
    description: "Import de novos tickets via Blip API",
    source: "blip-api",
    ...fields,
  });
  return meta;
}

async function main() {
  // Cutoff: pegar tickets cujo storage_date > MAX existente no DB.
  // Se DB vazio, fallback pra (NOW - SINCE_DAYS_FALLBACK days).
  const cutoffRes = await pool.query<{ cutoff: Date }>(
    `SELECT COALESCE(MAX(storage_date), NOW() - INTERVAL '${SINCE_DAYS_FALLBACK} days') AS cutoff FROM tickets`,
  );
  const cutoff = new Date(cutoffRes.rows[0].cutoff);
  console.log(`Cutoff: tickets com storage_date > ${cutoff.toISOString()}`);

  const jobId = randomUUID();
  await pool.query(
    `INSERT INTO import_jobs (id, status, total, processed, succeeded, failed_count, failed, started_at, created_at, updated_at, metadata)
     VALUES ($1, 'running'::import_job_status, 0, 0, 0, 0, '{}'::jsonb[], NOW(), NOW(), NOW(), $2::jsonb)`,
    [jobId, await upsertJob(jobId, { cutoff: cutoff.toISOString() })],
  );
  console.log(`Import job id: ${jobId}\n`);

  const BATCH_SIZE = 100;
  let skip = 0;
  let processed = 0;
  let created = 0;
  let skipped = 0;
  let total = 0;
  const failed: Array<{ blipId: string; reason: string }> = [];
  let reachedCutoff = false;

  try {
    while (!reachedCutoff) {
      const tickets = await fetchBatch(skip, BATCH_SIZE);
      if (tickets.length === 0) break;
      total = skip + tickets.length;

      for (const t of tickets) {
        const storageDate = new Date(t.storageDate);
        if (storageDate <= cutoff) {
          reachedCutoff = true;
          break;
        }
        try {
          const ins = await pool.query(
            `INSERT INTO tickets (
              id, blip_id, sequential_id, parent_sequential_id, external_id,
              owner_identity, customer_identity, customer_domain, agent_identity, provider,
              status, closed, closed_by, team, rating, priority, is_automatic_distribution, distribution_type,
              storage_date, status_date, open_date, close_date, first_response_date,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid()::text, $1, $2, $3, $4,
              $5, $6, $7, $8, $9,
              $10::ticket_status, $11, $12, $13, $14, $15, $16, $17,
              $18, $19, $20, $21, $22,
              NOW(), NOW()
            ) ON CONFLICT (blip_id) DO NOTHING
            RETURNING id`,
            [
              t.id, t.sequentialId, t.parentSequentialId ?? null, t.externalId ?? null,
              t.ownerIdentity, t.customerIdentity, t.customerDomain, t.agentIdentity ?? null, t.provider,
              mapStatus(t.status), t.closed, t.closedBy ?? null, t.team, t.rating ?? 0, t.priority ?? 0,
              t.isAutomaticDistribution ?? null, t.distributionType ?? null,
              storageDate.toISOString(),
              new Date(t.statusDate ?? t.storageDate).toISOString(),
              t.openDate ? new Date(t.openDate).toISOString() : null,
              t.closeDate ? new Date(t.closeDate).toISOString() : null,
              t.firstResponseDate ? new Date(t.firstResponseDate).toISOString() : null,
            ],
          );
          if (ins.rowCount && ins.rowCount > 0) created++; else skipped++;
        } catch (err) {
          failed.push({ blipId: t.id, reason: err instanceof Error ? err.message : "Erro" });
        }
        processed++;
        if (processed % 25 === 0) {
          await pool.query(
            `UPDATE import_jobs SET processed=$2, succeeded=$3, failed_count=$4, total=$5, metadata=$6::jsonb, updated_at=NOW() WHERE id=$1`,
            [jobId, processed, created, failed.length, total, await upsertJob(jobId, { created, skipped, cutoff: cutoff.toISOString() })],
          );
          console.log(`[${processed}/${total}] created=${created} skipped=${skipped} failed=${failed.length}`);
        }
      }

      if (reachedCutoff || tickets.length < BATCH_SIZE) break;
      skip += BATCH_SIZE;
      await new Promise((r) => setTimeout(r, 300));
    }

    await pool.query(
      `UPDATE import_jobs SET status='completed'::import_job_status, processed=$2, succeeded=$3, failed_count=$4, total=$5, metadata=$6::jsonb, completed_at=NOW(), updated_at=NOW() WHERE id=$1`,
      [jobId, processed, created, failed.length, processed, await upsertJob(jobId, { created, skipped, totalFailed: failed.length, cutoff: cutoff.toISOString() })],
    );
    console.log(`\n=== DONE === Processed: ${processed} Created: ${created} Skipped: ${skipped} Failed: ${failed.length}`);
  } catch (err) {
    await pool.query(
      `UPDATE import_jobs SET status='failed'::import_job_status, processed=$2, succeeded=$3, failed_count=$4, completed_at=NOW(), updated_at=NOW(), metadata=$5::jsonb WHERE id=$1`,
      [jobId, processed, created, failed.length, await upsertJob(jobId, { created, skipped, error: err instanceof Error ? err.message : "Erro" })],
    );
    console.error("FAIL:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

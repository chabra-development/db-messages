import "dotenv/config";
import axios, { AxiosError } from "axios";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import type {
  LimeThreadMessage,
  LimeThreadMessagesResponse,
} from "../src/types/lime-thread-messages-response.types";

// ============================================
// SETUP
// ============================================

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const RETRY_DELAY_MS = 10_000;
const MAX_RETRIES = 3;
type RetryableConfig = NonNullable<AxiosError["config"]> & {
  _retryCount?: number;
};

const api = axios.create({ timeout: 30_000 });
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    if (!config) return Promise.reject(error);
    config._retryCount = config._retryCount ?? 0;
    if (error.response?.status === 429 && config._retryCount < MAX_RETRIES) {
      config._retryCount++;
      console.warn(
        `[BLiP] 429 — aguardando ${RETRY_DELAY_MS / 1000}s (retry ${config._retryCount}/${MAX_RETRIES})`,
      );
      await new Promise<void>((r) => setTimeout(r, RETRY_DELAY_MS));
      return api(config);
    }
    return Promise.reject(error);
  },
);

const BLIP_URL = "https://chabra.http.msging.net/commands";
const API_KEY = process.env.BLIP_DESK_API_KEY!;
const BATCH_SIZE = 100;
const TICKET_BATCH = 50;
const MAX_SKIP = 10_000;
const CONCURRENCY = 5;
const MAX_EMPTY_BATCHES = 3; // para de varrer após N batches consecutivos sem match no DB
const PROGRESS_FILE = "scripts/.link-progress.json";
const DB_RETRY_DELAY_MS = 15_000;
const DB_MAX_RETRIES = 10;

async function retryDb<T>(fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: unknown) {
      const repr = String(err);
      const isDbDown =
        repr.includes("DatabaseNotReachable") ||
        repr.includes("Can't reach database") ||
        repr.includes("ECONNREFUSED") ||
        repr.includes("Connection terminated");
      if (isDbDown && attempt < DB_MAX_RETRIES) {
        attempt++;
        console.warn(
          `  [DB] Banco inacessível — aguardando ${DB_RETRY_DELAY_MS / 1000}s (tentativa ${attempt}/${DB_MAX_RETRIES})`,
        );
        await new Promise<void>((r) => setTimeout(r, DB_RETRY_DELAY_MS));
        continue;
      }
      throw err;
    }
  }
}

// ============================================
// TIPOS
// ============================================

type DeferredTicket = {
  ticketId: string;
  blipId: string;
  startSkip: number;
  sequentialId: number;
};

type Progress = {
  lastTicketSkip: number;
  totalProcessed: number;
  totalLinked: number;
  totalNotFound: number;
  totalFailed: number;
  deferred: DeferredTicket[];
  startedAt: string;
};

// ============================================
// PROGRESSO (resume)
// ============================================

function loadProgress(): Progress | null {
  if (existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
    } catch {}
  }
  return null;
}

function saveProgress(p: Progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

// ============================================
// BLIP
// ============================================

async function fetchTicketMessages(
  blipId: string,
  skip: number,
  take: number,
): Promise<{ items: LimeThreadMessage[]; total: number }> {
  const res = await api.post<LimeThreadMessagesResponse>(
    BLIP_URL,
    {
      id: randomUUID(),
      to: "postmaster@desk.msging.net",
      method: "get",
      uri: `/tickets/${blipId}/messages?$take=${take}&$skip=${skip}&$ascending=true&getFromOwnerIfTunnel=true`,
    },
    { headers: { Authorization: `Key ${API_KEY}` } },
  );

  if (res.data.status !== "success")
    throw new Error(`Blip error: ${JSON.stringify(res.data)}`);
  return { items: res.data.resource.items, total: res.data.resource.total };
}

// ============================================
// LINK SINGLE TICKET
// ============================================

async function linkSingleTicket(
  ticketId: string,
  blipId: string,
  startSkip = 0,
): Promise<{
  linked: number;
  notFound: number;
  deferred: boolean;
  nextSkip: number;
}> {
  let skip = startSkip;
  let linked = 0;
  let notFound = 0;
  let emptyBatches = 0;

  // Se já está totalmente vinculado, pular
  if (skip === 0) {
    const firstBatch = await fetchTicketMessages(blipId, 0, 1);
    if (firstBatch.total > 0) {
      const dbCount = await retryDb(() =>
        prisma.message.count({ where: { ticketId } }),
      );
      if (dbCount >= firstBatch.total) {
        return { linked: 0, notFound: 0, deferred: false, nextSkip: 0 };
      }
    }
  }

  while (true) {
    if (skip >= startSkip + MAX_SKIP) {
      return { linked, notFound, deferred: true, nextSkip: skip };
    }

    const { items: messages } = await fetchTicketMessages(
      blipId,
      skip,
      BATCH_SIZE,
    );

    if (messages.length === 0) break;

    const blipIds = messages.map((m) => m.id);

    const result = await retryDb(() =>
      prisma.message.updateMany({
        where: {
          blipId: { in: blipIds },
          OR: [{ ticketId: null }, { ticketId: { not: ticketId } }],
        },
        data: { ticketId },
      }),
    );

    linked += result.count;
    notFound += blipIds.length - result.count;

    if (result.count === 0) {
      emptyBatches++;
      if (emptyBatches >= MAX_EMPTY_BATCHES) break;
    } else {
      emptyBatches = 0;
    }

    skip += BATCH_SIZE;
    if (messages.length < BATCH_SIZE) break;
  }

  // Atualizar messageCount do ticket
  const messageCount = await retryDb(() =>
    prisma.message.count({ where: { ticketId } }),
  );
  await retryDb(() =>
    prisma.ticket.update({ where: { id: ticketId }, data: { messageCount } }),
  );

  return { linked, notFound, deferred: false, nextSkip: skip };
}

// ============================================
// MAIN
// ============================================

async function main() {
  const existing = loadProgress();
  let ticketSkip = existing?.lastTicketSkip ?? 0;
  let totalProcessed = existing?.totalProcessed ?? 0;
  let totalLinked = existing?.totalLinked ?? 0;
  let totalNotFound = existing?.totalNotFound ?? 0;
  let totalFailed = existing?.totalFailed ?? 0;
  let deferred: DeferredTicket[] = existing?.deferred ?? [];
  const startedAt = existing?.startedAt ?? new Date().toISOString();

  const totalTickets = await retryDb(() => prisma.ticket.count());

  if (existing) {
    console.log(
      `\n=== RETOMANDO vinculação (skip=${ticketSkip}, processados=${totalProcessed}/${totalTickets}) ===\n`,
    );
  } else {
    console.log(
      `\n=== INICIANDO vinculação de mensagens — ${totalTickets} tickets ===\n`,
    );
  }

  let hasMore = true;

  async function processTicket(ticket: {
    id: string;
    blipId: string;
    sequentialId: number;
  }) {
    process.stdout.write(`  [#${ticket.sequentialId}] iniciando...\r`);
    const result = await linkSingleTicket(ticket.id, ticket.blipId);

    const tag = result.deferred ? "⚠ ADIADO" : result.linked > 0 ? "✓" : "-";
    console.log(
      `  [#${ticket.sequentialId}] ${tag} linked=${result.linked} notFound=${result.notFound}${result.deferred ? ` nextSkip=${result.nextSkip}` : ""}`,
    );

    return {
      linked: result.linked,
      notFound: result.notFound,
      deferred: result.deferred
        ? {
            ticketId: ticket.id,
            blipId: ticket.blipId,
            startSkip: result.nextSkip,
            sequentialId: ticket.sequentialId,
          }
        : null,
    };
  }

  while (hasMore) {
    const tickets = await retryDb(() =>
      prisma.ticket.findMany({
        take: TICKET_BATCH,
        skip: ticketSkip,
        select: { id: true, blipId: true, sequentialId: true },
        orderBy: { storageDate: "asc" },
      }),
    );

    if (tickets.length === 0) {
      hasMore = false;
      break;
    }

    for (let i = 0; i < tickets.length; i += CONCURRENCY) {
      const chunk = tickets.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(chunk.map(processTicket));

      for (const r of results) {
        if (r.status === "rejected") {
          console.error(
            `  ERRO: ${r.reason instanceof Error ? r.reason.message : r.reason}`,
          );
          totalFailed++;
        } else {
          totalLinked += r.value.linked;
          totalNotFound += r.value.notFound;
          if (r.value.deferred) deferred.push(r.value.deferred);
        }
        totalProcessed++;
      }
    }

    ticketSkip += TICKET_BATCH;
    hasMore = tickets.length === TICKET_BATCH;

    saveProgress({
      lastTicketSkip: ticketSkip,
      totalProcessed,
      totalLinked,
      totalNotFound,
      totalFailed,
      deferred,
      startedAt,
    });

    const pct = ((totalProcessed / totalTickets) * 100).toFixed(1);
    console.log(
      `--- ${totalProcessed}/${totalTickets} (${pct}%) | linked=${totalLinked} notFound=${totalNotFound} failed=${totalFailed} deferred=${deferred.length} ---`,
    );
  }

  // ============================================
  // PROCESSAR ADIADOS
  // ============================================

  if (deferred.length > 0) {
    console.log(
      `\n=== PROCESSANDO ${deferred.length} ticket(s) adiado(s) ===\n`,
    );
    const stillDeferred: DeferredTicket[] = [];

    for (const t of deferred) {
      try {
        const result = await linkSingleTicket(
          t.ticketId,
          t.blipId,
          t.startSkip,
        );
        totalLinked += result.linked;
        totalNotFound += result.notFound;

        console.log(
          `  [#${t.sequentialId}] ${result.deferred ? "⚠ AINDA ADIADO" : "✓"} linked=${result.linked}${result.deferred ? ` nextSkip=${result.nextSkip}` : ""}`,
        );

        if (result.deferred)
          stillDeferred.push({ ...t, startSkip: result.nextSkip });
      } catch (error) {
        console.error(
          `  [#${t.sequentialId}] ERRO: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    if (stillDeferred.length > 0) {
      console.log(
        `\n⚠ ${stillDeferred.length} ticket(s) ainda adiados (>10k msgs). Execute novamente para continuar.`,
      );
      saveProgress({
        lastTicketSkip: ticketSkip,
        totalProcessed,
        totalLinked,
        totalNotFound,
        totalFailed,
        deferred: stillDeferred,
        startedAt,
      });
    } else {
      writeFileSync(
        PROGRESS_FILE,
        JSON.stringify(
          {
            completed: true,
            totalProcessed,
            totalLinked,
            totalNotFound,
            totalFailed,
            startedAt,
            completedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
    }
  } else {
    writeFileSync(
      PROGRESS_FILE,
      JSON.stringify(
        {
          completed: true,
          totalProcessed,
          totalLinked,
          totalNotFound,
          totalFailed,
          startedAt,
          completedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  }

  // ============================================
  // RESUMO FINAL
  // ============================================

  const stats = await retryDb(
    () => prisma.$queryRaw<
      [{ linked: bigint; unlinked: bigint; total: bigint }]
    >`
        SELECT
            COUNT(*) FILTER (WHERE ticket_id IS NOT NULL) AS linked,
            COUNT(*) FILTER (WHERE ticket_id IS NULL)     AS unlinked,
            COUNT(*)                                       AS total
        FROM messages
    `,
  );

  console.log(`\n=== RESUMO FINAL ===`);
  console.log(`  Tickets processados:      ${totalProcessed}/${totalTickets}`);
  console.log(`  Mensagens vinculadas:     ${totalLinked}`);
  console.log(`  Não encontradas no DB:    ${totalNotFound}`);
  console.log(`  Falhas:                   ${totalFailed}`);
  console.log(
    `\n  Banco — total: ${stats[0].total} | vinculadas: ${stats[0].linked} | não vinculadas: ${stats[0].unlinked}`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

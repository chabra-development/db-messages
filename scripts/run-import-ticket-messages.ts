import "dotenv/config";
import axios, { AxiosError } from "axios";
import { PrismaClient, Prisma } from "@prisma/client";
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
const PROGRESS_FILE = "scripts/.import-progress.json";

// ============================================
// TIPOS
// ============================================

type DeferredTicket = {
  ticketId: string;
  blipId: string;
  contactId: string;
  startSkip: number;
  sequentialId: number;
};

type Progress = {
  lastTicketSkip: number;
  totalProcessed: number;
  totalCreated: number;
  totalLinked: number;
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
    throw new Error("Falha ao buscar mensagens do Blip");
  return { items: res.data.resource.items, total: res.data.resource.total };
}

// ============================================
// RESOLVE CONTACT
// ============================================

async function resolveContactId(
  ticketId: string,
  blipId: string,
): Promise<{
  contactId: string;
  firstBatch: { items: LimeThreadMessage[]; total: number } | null;
}> {
  const linked = await prisma.message.findFirst({
    where: { ticketId },
    select: { contactId: true },
  });
  if (linked) return { contactId: linked.contactId, firstBatch: null };

  const firstBatch = await fetchTicketMessages(blipId, 0, BATCH_SIZE);
  for (const m of firstBatch.items) {
    const originator = (m.metadata as any)?.["#tunnel.originator"] as
      | string
      | undefined;
    if (originator) {
      const contact = await prisma.contact.findFirst({
        where: { identity: originator },
        select: { id: true },
      });
      if (contact) return { contactId: contact.id, firstBatch };
    }
  }
  return { contactId: "", firstBatch };
}

// ============================================
// IMPORT SINGLE TICKET
// ============================================

async function importSingleTicket(
  ticketId: string,
  blipId: string,
  contactId: string,
  startSkip = 0,
  prefetchedBatch?: { items: LimeThreadMessage[]; total: number },
): Promise<{
  created: number;
  linked: number;
  notFound: number;
  deferred: boolean;
  nextSkip: number;
}> {
  let skip = startSkip;
  let created = 0;
  let linked = 0;
  let notFound = 0;

  while (true) {
    if (skip >= startSkip + MAX_SKIP) {
      return { created, linked, notFound, deferred: true, nextSkip: skip };
    }

    const batch =
      skip === 0 && prefetchedBatch
        ? prefetchedBatch
        : await fetchTicketMessages(blipId, skip, BATCH_SIZE);

    // Early exit: se o total da API bate com o que temos no DB já linkado, pular
    if (skip === startSkip && batch.total > 0) {
      const dbCount = await prisma.message.count({ where: { ticketId } });
      if (dbCount >= batch.total) {
        return {
          created: 0,
          linked: 0,
          notFound: 0,
          deferred: false,
          nextSkip: 0,
        };
      }
    }

    const { items: messages } = batch;

    if (messages.length === 0) break;

    const blipIds = messages.map((m) => m.id);
    const existing = await prisma.message.findMany({
      where: { blipId: { in: blipIds } },
      select: { id: true, blipId: true, ticketId: true },
    });
    const existingMap = new Map(existing.map((m) => [m.blipId, m]));

    const toCreate = messages.filter((m) => !existingMap.has(m.id));
    const toLink = existing.filter((m) => m.ticketId !== ticketId);

    notFound += blipIds.length - existing.length - toCreate.length;

    if (toCreate.length > 0) {
      const result = await prisma.message.createMany({
        data: toCreate.map((m) => ({
          blipId: m.id,
          direction: (m.direction === "sent" ? "SENT" : "RECEIVED") as
            | "SENT"
            | "RECEIVED",
          type: m.type,
          content: m.content as any,
          status: (m.status === "consumed" ? "CONSUMED" : "DISPATCHED") as
            | "CONSUMED"
            | "DISPATCHED",
          metadata: m.metadata ? JSON.stringify(m.metadata) : Prisma.JsonNull,
          sentAt: new Date(m.date),
          contactId,
          ticketId,
        })),
        skipDuplicates: true,
      });
      created += result.count;
    }

    if (toLink.length > 0) {
      const result = await prisma.message.updateMany({
        where: { id: { in: toLink.map((m) => m.id) } },
        data: { ticketId },
      });
      linked += result.count;
    }

    skip += BATCH_SIZE;
    if (messages.length < BATCH_SIZE) break;
  }

  if (created + linked > 0) {
    const messageCount = await prisma.message.count({ where: { ticketId } });
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { messageCount },
    });
  }

  return { created, linked, notFound, deferred: false, nextSkip: skip };
}

// ============================================
// MAIN
// ============================================

async function main() {
  const existing = loadProgress();
  let ticketSkip = existing?.lastTicketSkip ?? 0;
  let totalProcessed = existing?.totalProcessed ?? 0;
  let totalCreated = existing?.totalCreated ?? 0;
  let totalLinked = existing?.totalLinked ?? 0;
  let totalFailed = existing?.totalFailed ?? 0;
  let deferred: DeferredTicket[] = existing?.deferred ?? [];
  const startedAt = existing?.startedAt ?? new Date().toISOString();

  const totalTickets = await prisma.ticket.count();

  if (existing) {
    console.log(
      `\n=== RETOMANDO importação (skip=${ticketSkip}, processados=${totalProcessed}/${totalTickets}) ===\n`,
    );
  } else {
    console.log(
      `\n=== INICIANDO importação de mensagens — ${totalTickets} tickets ===\n`,
    );
  }

  let hasMore = true;

  async function processTicket(ticket: {
    id: string;
    blipId: string;
    sequentialId: number;
  }) {
    const { contactId, firstBatch } = await resolveContactId(
      ticket.id,
      ticket.blipId,
    );
    if (!contactId) {
      console.log(`  [#${ticket.sequentialId}] ✗ sem contactId — pulado`);
      return { failed: true, deferred: null };
    }

    const result = await importSingleTicket(
      ticket.id,
      ticket.blipId,
      contactId,
      0,
      firstBatch ?? undefined,
    );

    if (result.created > 0 || result.linked > 0 || result.deferred) {
      const tag = result.deferred ? "⚠ ADIADO" : "✓";
      console.log(
        `  [#${ticket.sequentialId}] ${tag} created=${result.created} linked=${result.linked} notFound=${result.notFound}${result.deferred ? ` nextSkip=${result.nextSkip}` : ""}`,
      );
    }

    return {
      failed: false,
      created: result.created,
      linked: result.linked,
      deferred: result.deferred
        ? {
            ticketId: ticket.id,
            blipId: ticket.blipId,
            contactId,
            startSkip: result.nextSkip,
            sequentialId: ticket.sequentialId,
          }
        : null,
    };
  }

  while (hasMore) {
    const tickets = await prisma.ticket.findMany({
      take: TICKET_BATCH,
      skip: ticketSkip,
      select: { id: true, blipId: true, sequentialId: true },
      orderBy: { storageDate: "asc" },
    });

    if (tickets.length === 0) {
      hasMore = false;
      break;
    }

    // Processar em chunks de CONCURRENCY em paralelo
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
          if (r.value.failed) {
            totalFailed++;
          } else {
            totalCreated += r.value.created ?? 0;
            totalLinked += r.value.linked ?? 0;
            if (r.value.deferred) deferred.push(r.value.deferred);
          }
        }
        totalProcessed++;
      }
    }

    ticketSkip += TICKET_BATCH;
    hasMore = tickets.length === TICKET_BATCH;

    saveProgress({
      lastTicketSkip: ticketSkip,
      totalProcessed,
      totalCreated,
      totalLinked,
      totalFailed,
      deferred,
      startedAt,
    });

    const pct = ((totalProcessed / totalTickets) * 100).toFixed(1);
    console.log(
      `--- Progresso: ${totalProcessed}/${totalTickets} (${pct}%) | created=${totalCreated} linked=${totalLinked} failed=${totalFailed} deferred=${deferred.length} ---`,
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
        const result = await importSingleTicket(
          t.ticketId,
          t.blipId,
          t.contactId,
          t.startSkip,
        );
        totalCreated += result.created;
        totalLinked += result.linked;

        console.log(
          `  [#${t.sequentialId}] ${result.deferred ? "⚠ AINDA ADIADO" : "✓"} created=${result.created} linked=${result.linked}${result.deferred ? ` nextSkip=${result.nextSkip}` : ""}`,
        );

        if (result.deferred) {
          stillDeferred.push({ ...t, startSkip: result.nextSkip });
        }
      } catch (error) {
        console.error(
          `  [#${t.sequentialId}] ERRO: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    if (stillDeferred.length > 0) {
      console.log(
        `\n⚠ ${stillDeferred.length} ticket(s) ainda adiados (>20k msgs). Execute o script novamente para continuar.`,
      );
      saveProgress({
        lastTicketSkip: ticketSkip,
        totalProcessed,
        totalCreated,
        totalLinked,
        totalFailed,
        deferred: stillDeferred,
        startedAt,
      });
    } else {
      // Limpar arquivo de progresso — concluído
      writeFileSync(
        PROGRESS_FILE,
        JSON.stringify(
          {
            completed: true,
            totalProcessed,
            totalCreated,
            totalLinked,
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
          totalCreated,
          totalLinked,
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

  const stats = await prisma.$queryRaw<
    [{ linked: bigint; unlinked: bigint; total: bigint }]
  >`
        SELECT
            COUNT(*) FILTER (WHERE ticket_id IS NOT NULL) AS linked,
            COUNT(*) FILTER (WHERE ticket_id IS NULL)     AS unlinked,
            COUNT(*)                                       AS total
        FROM messages
    `;

  const durationMs = Date.now() - new Date(startedAt).getTime();
  console.log(`\n=== RESUMO FINAL ===`);
  console.log(`  Tickets processados: ${totalProcessed}/${totalTickets}`);
  console.log(`  Mensagens criadas:   ${totalCreated}`);
  console.log(`  Mensagens linkadas:  ${totalLinked}`);
  console.log(`  Falhas:              ${totalFailed}`);
  console.log(
    `\n  Banco — total: ${stats[0].total} | vinculadas: ${stats[0].linked} | não vinculadas: ${stats[0].unlinked}`,
  );

  await prisma.importLog.create({
    data: {
      type: "TICKET_MESSAGES",
      total: totalProcessed,
      succeeded: totalProcessed - totalFailed,
      failed: totalFailed,
      duration: durationMs,
      payloadSize: 0,
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

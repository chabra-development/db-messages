"use server";

import { env } from "@/env";
import { api } from "@/lib/axios";
import { downloadAndStoreMedia, isBlipMediaType } from "@/lib/blip-media";
import { prisma } from "@/lib/prisma";
import type {
  LimeThreadMessage,
  LimeThreadMessagesResponse,
} from "@/types/lime-thread-messages-response.types";
import { ImportJobStatus, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

// Estende limite de Vercel function (default 60s no Hobby).
export const maxDuration = 300;

const MAX_SKIP = 10_000;
const BATCH_SIZE = 100;
const TICKET_BATCH = 20;
const TICKET_CONCURRENCY = 5;

export type ImportTicketMessagesDeferred = {
  ticketId: string;
  blipId: string;
  contactId: string;
  startSkip: number;
};

// ============================================
// IMPORT ALL TICKET MESSAGES
// ============================================

export async function importAllTicketMessages() {
  const totalTickets = await prisma.ticket.count();

  if (totalTickets === 0) {
    throw new Error("Nenhum ticket encontrado");
  }

  const job = await prisma.importJob.create({
    data: {
      total: totalTickets,
      status: ImportJobStatus.PENDING,
      metadata: {
        type: "import-ticket-messages",
        description: "Importando mensagens de todos os tickets",
      },
    },
  });

  processImportTicketMessages(job.id).catch((error) => {
    console.error("Erro ao importar mensagens de tickets:", error);
  });

  return {
    success: true,
    jobId: job.id,
    message: `Importação iniciada: ${totalTickets} tickets`,
  };
}

// ============================================
// IMPORT DEFERRED TICKETS
// ============================================

export async function importDeferredTicketMessages(
  tickets: ImportTicketMessagesDeferred[],
) {
  if (tickets.length === 0) {
    throw new Error("Nenhum ticket adiado para reprocessar");
  }

  const job = await prisma.importJob.create({
    data: {
      total: tickets.length,
      status: ImportJobStatus.PENDING,
      metadata: {
        type: "import-ticket-messages-deferred",
        description: `Reprocessando ${tickets.length} ticket(s) adiado(s)`,
      },
    },
  });

  processImportDeferred(job.id, tickets).catch((error) => {
    console.error("Erro ao reprocessar tickets adiados:", error);
  });

  return {
    success: true,
    jobId: job.id,
    message: `Reprocessamento iniciado: ${tickets.length} ticket(s) adiado(s)`,
  };
}

// ============================================
// CONCURRENCY HELPER — sliding window
// ============================================

async function processConcurrently<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i]) };
      } catch (error) {
        results[i] = { status: "rejected", reason: error };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return results;
}

// ============================================
// BACKGROUND PROCESSOR — ALL
// ============================================

async function processImportTicketMessages(jobId: string) {
  try {
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: ImportJobStatus.RUNNING, startedAt: new Date() },
    });

    let ticketSkip = 0;
    let hasMore = true;
    let processed = 0;
    let totalCreated = 0;
    let totalLinked = 0;
    const failed: Array<{ blipId: string; reason: string }> = [];
    const deferred: ImportTicketMessagesDeferred[] = [];

    while (hasMore) {
      const tickets = await prisma.ticket.findMany({
        take: TICKET_BATCH,
        skip: ticketSkip,
        select: { id: true, blipId: true, customerIdentity: true },
        orderBy: { storageDate: "asc" },
      });

      if (tickets.length === 0) {
        hasMore = false;
        break;
      }

      const batchResults = await processConcurrently(
        tickets,
        TICKET_CONCURRENCY,
        (ticket) =>
          importSingleTicket(
            ticket.id,
            ticket.blipId,
            ticket.customerIdentity ?? "",
          ),
      );

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const result = batchResults[i];

        if (result.status === "fulfilled") {
          totalCreated += result.value.created;
          totalLinked += result.value.linked;
          if (result.value.deferred && result.value.contactId) {
            deferred.push({
              ticketId: ticket.id,
              blipId: ticket.blipId,
              contactId: result.value.contactId,
              startSkip: result.value.nextSkip,
            });
          }
        } else {
          const reason =
            result.reason instanceof Error
              ? result.reason.message
              : "Erro desconhecido";
          failed.push({ blipId: ticket.blipId, reason });
        }

        processed++;
      }

      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          processed,
          succeeded: processed - failed.length,
          failedCount: failed.length,
          failed: failed as any,
          metadata: {
            type: "import-ticket-messages",
            totalCreated,
            totalLinked,
            deferred: deferred.length,
          },
        },
      });

      ticketSkip += TICKET_BATCH;
      hasMore = tickets.length === TICKET_BATCH;
    }

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.COMPLETED,
        processed,
        succeeded: processed - failed.length,
        failedCount: failed.length,
        failed: failed as any,
        completedAt: new Date(),
        metadata: {
          type: "import-ticket-messages",
          totalCreated,
          totalLinked,
          totalTickets: processed,
          deferred: deferred.length > 0 ? deferred : undefined,
        },
      },
    });
  } catch (error) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.FAILED,
        completedAt: new Date(),
        metadata: {
          type: "import-ticket-messages",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        },
      },
    });
  }
}

// ============================================
// BACKGROUND PROCESSOR — DEFERRED
// ============================================

async function processImportDeferred(
  jobId: string,
  tickets: ImportTicketMessagesDeferred[],
) {
  try {
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: ImportJobStatus.RUNNING, startedAt: new Date() },
    });

    let processed = 0;
    let totalCreated = 0;
    let totalLinked = 0;
    const failed: Array<{ blipId: string; reason: string }> = [];
    const stillDeferred: ImportTicketMessagesDeferred[] = [];

    const batchResults = await processConcurrently(
      tickets,
      TICKET_CONCURRENCY,
      (ticket) =>
        importSingleTicket(
          ticket.ticketId,
          ticket.blipId,
          "",
          ticket.startSkip,
          ticket.contactId,
        ),
    );

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const result = batchResults[i];

      if (result.status === "fulfilled") {
        totalCreated += result.value.created;
        totalLinked += result.value.linked;
        if (result.value.deferred) {
          stillDeferred.push({ ...ticket, startSkip: result.value.nextSkip });
        }
      } else {
        const reason =
          result.reason instanceof Error
            ? result.reason.message
            : "Erro desconhecido";
        failed.push({ blipId: ticket.blipId, reason });
      }

      processed++;
    }

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.COMPLETED,
        processed,
        succeeded: processed - failed.length,
        failedCount: failed.length,
        failed: failed as any,
        completedAt: new Date(),
        metadata: {
          type: "import-ticket-messages-deferred",
          totalCreated,
          totalLinked,
          totalTickets: processed,
          deferred: stillDeferred.length > 0 ? stillDeferred : undefined,
        },
      },
    });
  } catch (error) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.FAILED,
        completedAt: new Date(),
        metadata: {
          type: "import-ticket-messages-deferred",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        },
      },
    });
  }
}

// ============================================
// IMPORT SINGLE TICKET
// ============================================

async function importSingleTicket(
  ticketId: string,
  blipId: string,
  customerIdentity: string,
  startSkip = 0,
  resolvedContactId?: string,
): Promise<{
  created: number;
  linked: number;
  deferred: boolean;
  nextSkip: number;
  contactId: string | null;
}> {
  let skip = startSkip;
  let created = 0;
  let linked = 0;
  let contactId: string | null = resolvedContactId ?? null;

  if (!contactId) {
    // 1. Pegar contactId de mensagem já linkada ao ticket
    const linked_msg = await prisma.message.findFirst({
      where: { ticketId },
      select: { contactId: true },
    });
    contactId = linked_msg?.contactId ?? null;
  }

  if (!contactId && customerIdentity) {
    // 2. Resolver pelo customerIdentity do ticket — sem chamada ao Blip
    const contact = await prisma.contact.findFirst({
      where: { identity: customerIdentity },
      select: { id: true },
    });
    contactId = contact?.id ?? null;
  }

  while (true) {
    if (skip >= startSkip + MAX_SKIP) {
      return { created, linked, deferred: true, nextSkip: skip, contactId };
    }

    const messages = await fetchTicketMessages(blipId, skip, BATCH_SIZE);

    if (messages.length === 0) break;

    const blipIds = messages.map((m) => m.id);

    const existing = await prisma.message.findMany({
      where: { blipId: { in: blipIds } },
      select: { id: true, blipId: true, ticketId: true, contactId: true },
    });
    const existingMap = new Map(existing.map((m) => [m.blipId, m]));

    // 3. Última chance: pegar contactId de mensagem existente no batch
    if (!contactId) {
      contactId = existing.find((m) => m.contactId)?.contactId ?? null;
    }

    const toCreate = messages.filter((m) => !existingMap.has(m.id));
    const toLink = existing.filter((m) => m.ticketId !== ticketId);

    if (toCreate.length > 0 && contactId) {
      const cId = contactId;

      // Pra cada msg com conteúdo de mídia, baixar do Blip e re-hospedar no MinIO.
      // A URI vinda do Blip tem SAS de 30min, então só funciona se baixar AGORA.
      // Em falha, mantém URI original (frontend mostra link quebrado quando expirar).
      for (const m of toCreate) {
        const content = m.content as { type?: unknown; uri?: unknown } | null;
        if (
          content &&
          typeof content === "object" &&
          isBlipMediaType(content.type) &&
          typeof content.uri === "string"
        ) {
          try {
            const newUri = await downloadAndStoreMedia(
              content.uri,
              cId,
              content.type,
              m.id,
            );
            (m.content as { uri: string }).uri = newUri;
          } catch (err) {
            console.error(
              `[import-media] msg=${m.id} type=${content.type}: ${err instanceof Error ? err.message : err}`,
            );
          }
        }
      }

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
          contactId: cId,
          ticketId,
        })),
        skipDuplicates: true,
      });
      created += result.count;
    }

    if (toLink.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: toLink.map((m) => m.id) } },
        data: {
          ticketId,
          ...(contactId ? { contactId } : {}),
        },
      });
      linked += toLink.length;
    }

    skip += BATCH_SIZE;
    if (messages.length < BATCH_SIZE) break;
  }

  const messageCount = await prisma.message.count({ where: { ticketId } });
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { messageCount },
  });

  return { created, linked, deferred: false, nextSkip: skip, contactId };
}

// ============================================
// FETCH TICKET MESSAGES FROM BLIP
// ============================================

async function fetchTicketMessages(
  blipTicketId: string,
  skip: number,
  take: number,
): Promise<LimeThreadMessage[]> {
  const body = {
    id: randomUUID(),
    to: "postmaster@desk.msging.net",
    method: "get",
    uri: `/tickets/${blipTicketId}/messages?$take=${take}&$skip=${skip}&$ascending=true&getFromOwnerIfTunnel=true`,
  };

  const response = await api.post<LimeThreadMessagesResponse>(
    "https://chabra.http.msging.net/commands",
    body,
    { headers: { Authorization: `Key ${env.BLIP_DESK_API_KEY}` } },
  );

  if (response.data.status !== "success") {
    throw new Error("Falha ao buscar mensagens do ticket no Blip");
  }

  return response.data.resource.items;
}

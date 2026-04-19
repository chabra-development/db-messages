"use server";

import { env } from "@/env";
import { api } from "@/lib/axios";
import { prisma } from "@/lib/prisma";
import type {
  LimeCollectionResponse,
  LimeTicket,
} from "@/types/blip-tickets.types";
import { ImportJobStatus, TicketStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import z from "zod";

const importTicketsSchema = z.object({
  BLIP_DESK_API_KEY: z.string().nonempty("A BLIP_DESK_API_KEY é obrigatória."),
});

// ============================================
// IMPORT TICKETS
// ============================================

export async function importAllTickets() {
  const result = importTicketsSchema.safeParse({
    BLIP_DESK_API_KEY: env.BLIP_DESK_API_KEY,
  });

  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }

  const { BLIP_DESK_API_KEY } = result.data;

  // 1. Descobrir total real via busca binária no $skip.
  //    A API do Blip não expõe um contador global — resource.total
  //    reflete apenas os itens da página atual. A busca binária
  //    encontra o total exato em ~log₂(100_000) ≈ 17 chamadas.
  const totalTickets = await getTotalTicketsFromBlip(BLIP_DESK_API_KEY);

  if (totalTickets === 0) {
    throw new Error("Nenhum ticket encontrado no Blip");
  }

  // 2. Criar job com o total correto
  const job = await prisma.importJob.create({
    data: {
      total: totalTickets,
      status: ImportJobStatus.PENDING,
      metadata: {
        type: "tickets",
        source: "blip-api",
      },
    },
  });

  // 3. Processar em background (não aguarda)
  processTicketsImport(job.id, BLIP_DESK_API_KEY).catch((error) => {
    console.error("Erro no processamento de tickets:", error);
  });

  return {
    success: true,
    jobId: job.id,
    message: `Importação iniciada: ${totalTickets} tickets`,
  };
}

// ============================================
// GET TOTAL TICKETS (busca binária)
// ============================================

async function getTotalTicketsFromBlip(apiKey: string): Promise<number> {
  let lo = 0;
  let hi = 100_000;

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const items = await fetchTicketsFromBlip(apiKey, mid, 1);

    if (items.length > 0) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  return lo;
}

// ============================================
// PROCESS IMPORT
// ============================================

async function processTicketsImport(jobId: string, apiKey: string) {
  try {
    // Atualizar status para RUNNING
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    const BATCH_SIZE = 100;
    let skip = 0;
    let hasMore = true;
    let processed = 0;
    let succeeded = 0;
    let skipped = 0;
    let discoveredTotal = 0;
    const failed: Array<{
      identity: string;
      blipId: string;
      reason: string;
      timestamp: Date;
    }> = [];

    while (hasMore) {
      // Buscar lote de tickets do Blip
      const tickets = await fetchTicketsFromBlip(apiKey, skip, BATCH_SIZE);

      if (tickets.length === 0) {
        hasMore = false;
        break;
      }

      // Atualiza o total descoberto:
      // - batch completo → pelo menos skip + BATCH_SIZE existem
      // - batch parcial  → skip + tickets.length é o total exato
      discoveredTotal =
        tickets.length === BATCH_SIZE
          ? skip + BATCH_SIZE
          : skip + tickets.length;

      // Processar cada ticket
      for (const ticket of tickets) {
        try {
          const result = await processTicket(ticket);
          if (result === "skipped") {
            skipped++;
          } else {
            succeeded++;
          }
        } catch (error) {
          failed.push({
            identity: ticket.customerIdentity,
            blipId: ticket.id,
            reason:
              error instanceof Error ? error.message : "Erro desconhecido",
            timestamp: new Date(),
          });
        }

        processed++;

        // Atualizar progresso a cada 10 tickets
        if (processed % 10 === 0) {
          await prisma.importJob.update({
            where: { id: jobId },
            data: {
              total: discoveredTotal,
              processed,
              succeeded,
              failedCount: failed.length,
              failed: failed as any,
              metadata: {
                type: "tickets",
                source: "blip-api",
                skipped,
              },
            },
          });
        }
      }

      skip += BATCH_SIZE;
      hasMore = tickets.length === BATCH_SIZE;

      // Delay para não sobrecarregar a API
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Finalizar job — total = processed (valor real ao final)
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.COMPLETED,
        total: processed,
        processed,
        succeeded,
        failedCount: failed.length,
        failed: failed as any,
        completedAt: new Date(),
        metadata: {
          type: "tickets",
          source: "blip-api",
          totalSucceeded: succeeded,
          totalSkipped: skipped,
          totalFailed: failed.length,
        },
      },
    });
  } catch (error) {
    // Marcar job como falho
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.FAILED,
        completedAt: new Date(),
        metadata: {
          type: "tickets",
          source: "blip-api",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        },
      },
    });
  }
}

// ============================================
// FETCH TICKETS FROM BLIP
// ============================================

async function fetchTicketsFromBlip(
  apiKey: string,
  skip: number,
  take: number,
): Promise<LimeTicket[]> {
  const url = "https://chabra.http.msging.net/commands";

  const body = {
    id: randomUUID(),
    method: "get",
    to: "postmaster@desk.msging.net",
    uri: `/tickets?$skip=${skip}&$take=${take}`,
  };

  const response = await api.post<LimeCollectionResponse>(url, body, {
    headers: {
      Authorization: `Key ${apiKey}`,
    },
  });

  if (response.data.status !== "success") {
    throw new Error("Falha ao buscar lote de tickets");
  }

  return response.data.resource.items;
}

// ============================================
// PROCESS SINGLE TICKET
// ============================================

async function processTicket(
  ticket: LimeTicket,
): Promise<"created" | "skipped"> {
  // 1. Ignorar se ticket já existe (blipId único)
  const existing = await prisma.ticket.findUnique({
    where: { blipId: ticket.id },
  });

  if (existing) {
    return "skipped";
  }

  // 2. Mapear status do Blip para o enum do Prisma
  const status = mapBlipStatusToEnum(ticket.status);

  // 3. Criar ticket no banco (sem associação de contato por enquanto)
  await prisma.ticket.create({
    data: {
      blipId: ticket.id,
      sequentialId: ticket.sequentialId,
      parentSequentialId: ticket.parentSequentialId ?? null,
      externalId: ticket.externalId ?? null,
      ownerIdentity: ticket.ownerIdentity,
      customerIdentity: ticket.customerIdentity,
      customerDomain: ticket.customerDomain,
      agentIdentity: ticket.agentIdentity ?? null,
      provider: ticket.provider,
      status,
      closed: ticket.closed,
      closedBy: ticket.closedBy ?? null,
      team: ticket.team,
      rating: ticket.rating,
      priority: ticket.priority,
      isAutomaticDistribution: ticket.isAutomaticDistribution ?? null,
      distributionType: ticket.distributionType ?? null,
      storageDate: new Date(ticket.storageDate),
      statusDate: new Date(ticket.statusDate ?? ticket.storageDate),
      openDate: ticket.openDate ? new Date(ticket.openDate) : null,
      closeDate: ticket.closeDate ? new Date(ticket.closeDate) : null,
      firstResponseDate: ticket.firstResponseDate
        ? new Date(ticket.firstResponseDate)
        : null,
    },
  });

  return "created";
}

// ============================================
// MAP STATUS - Blip → Prisma Enum
// ============================================

function mapBlipStatusToEnum(status: string): TicketStatus {
  // Normalizar status (remover espaços, lowercase)
  const normalized = status.toLowerCase().replace(/\s+/g, "");

  const statusMap: Record<string, TicketStatus> = {
    waiting: TicketStatus.Waiting,
    assigned: TicketStatus.Waiting, // Assigned = aguardando notificação consumed → ainda Waiting
    open: TicketStatus.InAttendance, // Open = agente reivindicou o ticket → InAttendance
    inattendance: TicketStatus.InAttendance,
    closedattendant: TicketStatus.ClosedAttendant,
    closedclient: TicketStatus.ClosedClient,
    closedsystem: TicketStatus.ClosedSystem,
    transferred: TicketStatus.Transferred,
  };

  return statusMap[normalized] || TicketStatus.Waiting;
}

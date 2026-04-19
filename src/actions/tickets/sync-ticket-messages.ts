"use server";

import { env } from "@/env";
import { api } from "@/lib/axios";
import { prisma } from "@/lib/prisma";
import type {
  LimeThreadMessage,
  LimeThreadMessagesResponse,
} from "@/types/lime-thread-messages-response.types";
import { randomUUID } from "node:crypto";

// ============================================
// SYNC TICKET MESSAGES
// ============================================

export async function syncTicketMessages(ticketId: string, blipId: string) {
  const BATCH_SIZE = 100;
  const startedAt = Date.now();
  let skip = 0;
  let hasMore = true;
  let synced = 0;
  let alreadyLinked = 0;
  let notFound = 0;

  while (hasMore) {
    const messages = await fetchTicketMessages(blipId, skip, BATCH_SIZE);

    if (messages.length === 0) break;

    const blipIds = messages.map((m) => m.id);

    const existing = await prisma.message.findMany({
      where: { blipId: { in: blipIds } },
      select: { id: true, blipId: true, ticketId: true, contactId: true },
    });

    notFound += blipIds.length - existing.length;

    const toLink = existing.filter((m) => m.ticketId !== ticketId);
    alreadyLinked += existing.length - toLink.length;

    if (toLink.length > 0) {
      const contactId = toLink.find((m) => m.contactId)?.contactId;

      const result = await prisma.message.updateMany({
        where: { id: { in: toLink.map((m) => m.id) } },
        data: { ticketId, ...(contactId ? { contactId } : {}) },
      });
      synced += result.count;
    }

    skip += BATCH_SIZE;
    hasMore = messages.length === BATCH_SIZE;
  }

  const messageCount = await prisma.message.count({ where: { ticketId } });
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { messageCount },
  });

  const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);

  return { synced, alreadyLinked, notFound, elapsedSeconds };
}

// ============================================
// FETCH TICKET MESSAGES FROM BLIP
// ============================================

async function fetchTicketMessages(
  blipTicketId: string,
  skip: number,
  take: number,
): Promise<LimeThreadMessage[]> {
  const url = "https://chabra.http.msging.net/commands";

  const body = {
    id: randomUUID(),
    to: "postmaster@desk.msging.net",
    method: "get",
    uri: `/tickets/${blipTicketId}/messages?$take=${take}&$skip=${skip}&$ascending=true&getFromOwnerIfTunnel=true`,
  };

  const response = await api.post<LimeThreadMessagesResponse>(url, body, {
    headers: {
      Authorization: `Key ${env.BLIP_DESK_API_KEY}`,
    },
  });

  if (response.data.status !== "success") {
    throw new Error("Falha ao buscar mensagens do ticket no Blip");
  }

  return response.data.resource.items;
}

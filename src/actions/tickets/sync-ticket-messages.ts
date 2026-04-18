"use server"

import { env } from "@/env"
import { api } from "@/lib/axios"
import { prisma } from "@/lib/prisma"
import type {
    LimeThreadMessage,
    LimeThreadMessagesResponse,
} from "@/types/lime-thread-messages-response.types"
import { randomUUID } from "node:crypto"

// ============================================
// SYNC TICKET MESSAGES
// ============================================

const MAX_SKIP = 10_000

export async function syncTicketMessages(ticketId: string, blipId: string) {
    const BATCH_SIZE = 100
    let skip = 0
    let hasMore = true
    let synced = 0
    let alreadyLinked = 0
    let notFound = 0

    while (hasMore) {
        if (skip >= MAX_SKIP) {
            return { synced, alreadyLinked, notFound, deferred: true }
        }

        const messages = await fetchTicketMessages(blipId, skip, BATCH_SIZE)

        if (messages.length === 0) {
            hasMore = false
            break
        }

        // Resolver IDs do batch: metadata["#messageId"] ?? message.id
        const blipIds = messages.map((m) => m.id)

        // 1 query para buscar todos os existentes no banco
        const existing = await prisma.message.findMany({
            where: { blipId: { in: blipIds } },
            select: { id: true, blipId: true, ticketId: true },
        })

        notFound += blipIds.length - existing.length

        const toLink = existing.filter((m) => m.ticketId !== ticketId)
        alreadyLinked += existing.length - toLink.length

        if (toLink.length > 0) {
            // 1 query para vincular todos de uma vez
            const result = await prisma.message.updateMany({
                where: { id: { in: toLink.map((m) => m.id) } },
                data: { ticketId },
            })
            synced += result.count
        }

        skip += BATCH_SIZE
        hasMore = messages.length === BATCH_SIZE
    }

    if (synced > 0) {
        const messageCount = await prisma.message.count({ where: { ticketId } })
        await prisma.ticket.update({ where: { id: ticketId }, data: { messageCount } })
    }

    return { synced, alreadyLinked, notFound, deferred: false }
}

// ============================================
// FETCH TICKET MESSAGES FROM BLIP
// ============================================

async function fetchTicketMessages(
    blipTicketId: string,
    skip: number,
    take: number,
): Promise<LimeThreadMessage[]> {
    const url = "https://chabra.http.msging.net/commands"

    const body = {
        id: randomUUID(),
        to: "postmaster@desk.msging.net",
        method: "get",
        uri: `/tickets/${blipTicketId}/messages?$take=${take}&$skip=${skip}&$ascending=true&getFromOwnerIfTunnel=true`,
    }

    const response = await api.post<LimeThreadMessagesResponse>(url, body, {
        headers: {
            Authorization: `Key ${env.BLIP_DESK_API_KEY}`,
        },
    })

    if (response.data.status !== "success") {
        throw new Error("Falha ao buscar mensagens do ticket no Blip")
    }

    return response.data.resource.items
}

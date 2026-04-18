"use server"

import { env } from "@/env"
import { api } from "@/lib/axios"
import { prisma } from "@/lib/prisma"
import type { 
    LimeThreadMessagesResponse, 
    LimeThreadMessage 
} from "@/types/lime-thread-messages-response.types"
import { ImportJobStatus } from "@prisma/client"
import { randomUUID } from "node:crypto"

// ============================================
// LINK ALL MESSAGES TO TICKETS
// ============================================

export async function linkAllMessagesToTickets() {
    // Buscar total de tickets
    const totalTickets = await prisma.ticket.count()

    if (totalTickets === 0) {
        throw new Error("Nenhum ticket encontrado para vincular")
    }

    // Criar job de vinculação
    const job = await prisma.importJob.create({
        data: {
            total: totalTickets,
            status: ImportJobStatus.PENDING,
            metadata: {
                type: "link-messages",
                description: "Vinculando mensagens aos tickets por data",
            },
        },
    })

    // Processar em background
    processLinkMessages(job.id).catch((error) => {
        console.error("Erro ao vincular mensagens:", error)
    })

    return {
        success: true,
        jobId: job.id,
        message: `Vinculação iniciada: ${totalTickets} tickets`,
    }
}

// ============================================
// PROCESS LINK MESSAGES (BACKGROUND)
// ============================================

async function processLinkMessages(jobId: string) {
    try {
        await prisma.importJob.update({
            where: { id: jobId },
            data: { status: ImportJobStatus.RUNNING, startedAt: new Date() },
        })

        const TICKET_BATCH = 50
        let ticketSkip = 0
        let hasMore = true
        let processed = 0
        let totalSynced = 0
        let totalNotFound = 0
        const failed: Array<{ blipId: string; reason: string }> = []
        const deferred: Array<{ ticketId: string; blipId: string; startSkip: number }> = []

        while (hasMore) {
            const tickets = await prisma.ticket.findMany({
                take: TICKET_BATCH,
                skip: ticketSkip,
                select: { id: true, blipId: true },
                orderBy: { storageDate: "asc" },
            })

            if (tickets.length === 0) {
                hasMore = false
                break
            }

            for (const ticket of tickets) {
                try {
                    const { synced, notFound, deferred: isDeferred, nextSkip } = await syncSingleTicketMessages(
                        ticket.id,
                        ticket.blipId,
                    )
                    totalSynced += synced
                    totalNotFound += notFound
                    if (isDeferred) {
                        deferred.push({ ticketId: ticket.id, blipId: ticket.blipId, startSkip: nextSkip })
                    }
                } catch (error) {
                    failed.push({
                        blipId: ticket.blipId,
                        reason: error instanceof Error ? error.message : "Erro desconhecido",
                    })
                }

                processed++

                if (processed % 10 === 0) {
                    await prisma.importJob.update({
                        where: { id: jobId },
                        data: {
                            processed,
                            succeeded: processed - failed.length,
                            failedCount: failed.length,
                            failed: failed as any,
                            metadata: {
                                type: "link-messages",
                                totalSynced,
                                totalNotFound,
                                deferred: deferred.length,
                            },
                        },
                    })
                }
            }

            ticketSkip += TICKET_BATCH
            hasMore = tickets.length === TICKET_BATCH
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
                    type: "link-messages",
                    totalSynced,
                    totalNotFound,
                    totalTickets: processed,
                    deferred: deferred.length > 0 ? deferred : undefined,
                },
            },
        })
    } catch (error) {
        await prisma.importJob.update({
            where: { id: jobId },
            data: {
                status: ImportJobStatus.FAILED,
                completedAt: new Date(),
                metadata: {
                    type: "link-messages",
                    error: error instanceof Error ? error.message : "Erro desconhecido",
                },
            },
        })
    }
}

// ============================================
// SYNC SINGLE TICKET (reutilizável internamente)
// ============================================

const MAX_SKIP = 10_000

async function syncSingleTicketMessages(ticketId: string, blipId: string, startSkip = 0) {
    const BATCH_SIZE = 100
    let skip = startSkip
    let hasMore = true
    let synced = 0
    let notFound = 0

    while (hasMore) {
        if (skip >= startSkip + MAX_SKIP) {
            return { synced, notFound, deferred: true, nextSkip: skip }
        }

        const messages = await fetchTicketMessages(blipId, skip, BATCH_SIZE)

        if (messages.length === 0) {
            hasMore = false
            break
        }

        const blipIds = messages.map(
            (m) => (m.metadata?.["#messageId"] as string | undefined) ?? m.id,
        )

        const existing = await prisma.message.findMany({
            where: { blipId: { in: blipIds } },
            select: { id: true, blipId: true, ticketId: true },
        })

        notFound += blipIds.length - existing.length

        const toLink = existing.filter((m) => m.ticketId !== ticketId)

        if (toLink.length > 0) {
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

    return { synced, notFound, deferred: false, nextSkip: skip }
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
        headers: { Authorization: `Key ${env.BLIP_DESK_API_KEY}` },
    })

    if (response.data.status !== "success") {
        throw new Error("Falha ao buscar mensagens do ticket no Blip")
    }

    return response.data.resource.items
}

// ============================================
// LINK DEFERRED TICKETS
// ============================================

export type DeferredTicket = { ticketId: string; blipId: string; startSkip: number }

export async function linkDeferredTickets(tickets: DeferredTicket[]) {
    if (tickets.length === 0) {
        throw new Error("Nenhum ticket adiado para reprocessar")
    }

    const job = await prisma.importJob.create({
        data: {
            total: tickets.length,
            status: ImportJobStatus.PENDING,
            metadata: {
                type: "link-messages-deferred",
                description: `Reprocessando ${tickets.length} ticket(s) adiado(s)`,
            },
        },
    })

    processLinkDeferredMessages(job.id, tickets).catch((error) => {
        console.error("Erro ao reprocessar tickets adiados:", error)
    })

    return {
        success: true,
        jobId: job.id,
        message: `Reprocessamento iniciado: ${tickets.length} ticket(s) adiado(s)`,
    }
}

async function processLinkDeferredMessages(jobId: string, tickets: DeferredTicket[]) {
    try {
        await prisma.importJob.update({
            where: { id: jobId },
            data: { status: ImportJobStatus.RUNNING, startedAt: new Date() },
        })

        let processed = 0
        let totalSynced = 0
        let totalNotFound = 0
        const failed: Array<{ blipId: string; reason: string }> = []
        const stillDeferred: DeferredTicket[] = []

        for (const ticket of tickets) {
            try {
                const { synced, notFound, deferred: isDeferred, nextSkip } = await syncSingleTicketMessages(
                    ticket.ticketId,
                    ticket.blipId,
                    ticket.startSkip,
                )
                totalSynced += synced
                totalNotFound += notFound
                if (isDeferred) {
                    stillDeferred.push({ ticketId: ticket.ticketId, blipId: ticket.blipId, startSkip: nextSkip })
                }
            } catch (error) {
                failed.push({
                    blipId: ticket.blipId,
                    reason: error instanceof Error ? error.message : "Erro desconhecido",
                })
            }

            processed++

            if (processed % 5 === 0) {
                await prisma.importJob.update({
                    where: { id: jobId },
                    data: {
                        processed,
                        succeeded: processed - failed.length,
                        failedCount: failed.length,
                        failed: failed as any,
                        metadata: {
                            type: "link-messages-deferred",
                            totalSynced,
                            totalNotFound,
                            stillDeferred: stillDeferred.length,
                        },
                    },
                })
            }
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
                    type: "link-messages-deferred",
                    totalSynced,
                    totalNotFound,
                    totalTickets: processed,
                    stillDeferred: stillDeferred.length > 0 ? stillDeferred : undefined,
                },
            },
        })
    } catch (error) {
        await prisma.importJob.update({
            where: { id: jobId },
            data: {
                status: ImportJobStatus.FAILED,
                completedAt: new Date(),
                metadata: {
                    type: "link-messages-deferred",
                    error: error instanceof Error ? error.message : "Erro desconhecido",
                },
            },
        })
    }
}

// ============================================
// GET LINK STATISTICS
// ============================================

/**
 * Retorna estatísticas sobre mensagens vinculadas
 */
export async function getLinkStatistics() {
    const [linked, unlinked, total, ticketsWithMessages, ticketsTotal] = await Promise.all([
        prisma.message.count({
            where: { ticketId: { not: null } },
        }),
        prisma.message.count({
            where: { ticketId: null },
        }),
        prisma.message.count(),
        prisma.ticket.count({
            where: { messageCount: { gt: 0 } },
        }),
        prisma.ticket.count(),
    ])

    return {
        messages: {
            linked,
            unlinked,
            total,
            linkedPercentage: total > 0 ? Math.round((linked / total) * 100) : 0,
        },
        tickets: {
            withMessages: ticketsWithMessages,
            total: ticketsTotal,
        },
    }
}

// ============================================
// UNLINK ALL MESSAGES (RESET)
// ============================================

/**
 * Remove todos os vínculos de mensagens (útil para reprocessar)
 */
export async function unlinkAllMessages() {
    
    const result = await prisma.message.updateMany({
        where: { ticketId: { not: null } },
        data: { ticketId: null },
    })

    // Resetar contadores dos tickets
    await prisma.ticket.updateMany({
        data: { messageCount: 0 },
    })

    return {
        unlinked: result.count,
    }
}
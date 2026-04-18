"use server"

import { env } from "@/env"
import { api } from "@/lib/axios"
import { prisma } from "@/lib/prisma"
import type {
    LimeThreadMessage,
    LimeThreadMessagesResponse,
} from "@/types/lime-thread-messages-response.types"
import { ImportJobStatus, Prisma } from "@prisma/client"
import { randomUUID } from "node:crypto"

const MAX_SKIP = 10_000
const BATCH_SIZE = 100
const TICKET_BATCH = 20

export type ImportTicketMessagesDeferred = {
    ticketId: string
    blipId: string
    contactId: string
    startSkip: number
}

// ============================================
// IMPORT ALL TICKET MESSAGES
// ============================================

export async function importAllTicketMessages() {
    const totalTickets = await prisma.ticket.count()

    if (totalTickets === 0) {
        throw new Error("Nenhum ticket encontrado")
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
    })

    processImportTicketMessages(job.id).catch((error) => {
        console.error("Erro ao importar mensagens de tickets:", error)
    })

    return {
        success: true,
        jobId: job.id,
        message: `Importação iniciada: ${totalTickets} tickets`,
    }
}

// ============================================
// IMPORT DEFERRED TICKETS
// ============================================

export async function importDeferredTicketMessages(tickets: ImportTicketMessagesDeferred[]) {
    if (tickets.length === 0) {
        throw new Error("Nenhum ticket adiado para reprocessar")
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
    })

    processImportDeferred(job.id, tickets).catch((error) => {
        console.error("Erro ao reprocessar tickets adiados:", error)
    })

    return {
        success: true,
        jobId: job.id,
        message: `Reprocessamento iniciado: ${tickets.length} ticket(s) adiado(s)`,
    }
}

// ============================================
// BACKGROUND PROCESSOR — ALL
// ============================================

async function processImportTicketMessages(jobId: string) {
    try {
        await prisma.importJob.update({
            where: { id: jobId },
            data: { status: ImportJobStatus.RUNNING, startedAt: new Date() },
        })

        let ticketSkip = 0
        let hasMore = true
        let processed = 0
        let totalCreated = 0
        let totalLinked = 0
        let totalNotFound = 0
        const failed: Array<{ blipId: string; reason: string }> = []
        const deferred: ImportTicketMessagesDeferred[] = []

        while (hasMore) {
            const tickets = await prisma.ticket.findMany({
                take: TICKET_BATCH,
                skip: ticketSkip,
                select: { id: true, blipId: true, customerIdentity: true },
                orderBy: { storageDate: "asc" },
            })

            if (tickets.length === 0) {
                hasMore = false
                break
            }

            for (const ticket of tickets) {
                try {
                    const contactId = await resolveContactId(ticket.id, ticket.blipId)

                    if (!contactId) {
                        failed.push({ blipId: ticket.blipId, reason: "Contato não encontrado" })
                        processed++
                        continue
                    }

                    const result = await importSingleTicket(ticket.id, ticket.blipId, contactId)
                    totalCreated += result.created
                    totalLinked += result.linked
                    totalNotFound += result.notFound
                    if (result.deferred) {
                        deferred.push({ ticketId: ticket.id, blipId: ticket.blipId, contactId, startSkip: result.nextSkip })
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
                                type: "import-ticket-messages",
                                totalCreated,
                                totalLinked,
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
                    type: "import-ticket-messages",
                    totalCreated,
                    totalLinked,
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
                    type: "import-ticket-messages",
                    error: error instanceof Error ? error.message : "Erro desconhecido",
                },
            },
        })
    }
}

// ============================================
// BACKGROUND PROCESSOR — DEFERRED
// ============================================

async function processImportDeferred(jobId: string, tickets: ImportTicketMessagesDeferred[]) {
    try {
        await prisma.importJob.update({
            where: { id: jobId },
            data: { status: ImportJobStatus.RUNNING, startedAt: new Date() },
        })

        let processed = 0
        let totalCreated = 0
        let totalLinked = 0
        let totalNotFound = 0
        const failed: Array<{ blipId: string; reason: string }> = []
        const stillDeferred: ImportTicketMessagesDeferred[] = []

        for (const ticket of tickets) {
            try {
                const result = await importSingleTicket(ticket.ticketId, ticket.blipId, ticket.contactId, ticket.startSkip)
                totalCreated += result.created
                totalLinked += result.linked
                totalNotFound += result.notFound
                if (result.deferred) {
                    stillDeferred.push({ ...ticket, startSkip: result.nextSkip })
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
                            type: "import-ticket-messages-deferred",
                            totalCreated,
                            totalLinked,
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
                    type: "import-ticket-messages-deferred",
                    totalCreated,
                    totalLinked,
                    totalNotFound,
                    totalTickets: processed,
                    deferred: stillDeferred.length > 0 ? stillDeferred : undefined,
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
                    type: "import-ticket-messages-deferred",
                    error: error instanceof Error ? error.message : "Erro desconhecido",
                },
            },
        })
    }
}

// ============================================
// RESOLVE CONTACT ID FOR TICKET
// ============================================

async function resolveContactId(ticketId: string, blipId: string): Promise<string | null> {
    // 1. Usar contactId de mensagem já linkada ao ticket
    const linked = await prisma.message.findFirst({
        where: { ticketId },
        select: { contactId: true },
    })
    if (linked) return linked.contactId

    // 2. Buscar primeiro batch e extrair #tunnel.originator de mensagem sent
    const messages = await fetchTicketMessages(blipId, 0, BATCH_SIZE)
    for (const m of messages) {
        const originator = m.metadata?.["#tunnel.originator"] as string | undefined
        if (originator) {
            const contact = await prisma.contact.findFirst({
                where: { identity: originator },
                select: { id: true },
            })
            if (contact) return contact.id
        }
    }

    return null
}

// ============================================
// IMPORT SINGLE TICKET
// ============================================

async function importSingleTicket(
    ticketId: string,
    blipId: string,
    contactId: string,
    startSkip = 0,
): Promise<{ created: number; linked: number; notFound: number; deferred: boolean; nextSkip: number }> {
    let skip = startSkip
    let created = 0
    let linked = 0
    let notFound = 0

    while (true) {
        if (skip >= startSkip + MAX_SKIP) {
            return { created, linked, notFound, deferred: true, nextSkip: skip }
        }

        // Se for o primeiro batch e já foi buscado em resolveContactId, reusar os dados
        const messages = await fetchTicketMessages(blipId, skip, BATCH_SIZE)

        if (messages.length === 0) break

        const blipIds = messages.map((m) => m.id)

        const existing = await prisma.message.findMany({
            where: { blipId: { in: blipIds } },
            select: { id: true, blipId: true, ticketId: true },
        })
        const existingMap = new Map(existing.map((m) => [m.blipId, m]))

        const toCreate = messages.filter((m) => !existingMap.has(m.id))
        const toLink = existing.filter((m) => m.ticketId !== ticketId)

        if (toCreate.length > 0) {
            const result = await prisma.message.createMany({
                data: toCreate.map((m) => ({
                    blipId: m.id,
                    direction: (m.direction === "sent" ? "SENT" : "RECEIVED") as "SENT" | "RECEIVED",
                    type: m.type,
                    content: m.content as any,
                    status: (m.status === "consumed" ? "CONSUMED" : "DISPATCHED") as "CONSUMED" | "DISPATCHED",
                    metadata: m.metadata ? JSON.stringify(m.metadata) : Prisma.JsonNull,
                    sentAt: new Date(m.date),
                    contactId,
                    ticketId,
                })),
                skipDuplicates: true,
            })
            created += result.count
        }

        if (toLink.length > 0) {
            const result = await prisma.message.updateMany({
                where: { id: { in: toLink.map((m) => m.id) } },
                data: { ticketId },
            })
            linked += result.count
        }

        notFound += blipIds.length - existing.length - toCreate.length

        skip += BATCH_SIZE
        if (messages.length < BATCH_SIZE) break
    }

    const messageCount = await prisma.message.count({ where: { ticketId } })
    await prisma.ticket.update({ where: { id: ticketId }, data: { messageCount } })

    return { created, linked, notFound, deferred: false, nextSkip: skip }
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
    }

    const response = await api.post<LimeThreadMessagesResponse>(
        "https://chabra.http.msging.net/commands",
        body,
        { headers: { Authorization: `Key ${env.BLIP_DESK_API_KEY}` } },
    )

    if (response.data.status !== "success") {
        throw new Error("Falha ao buscar mensagens do ticket no Blip")
    }

    return response.data.resource.items
}

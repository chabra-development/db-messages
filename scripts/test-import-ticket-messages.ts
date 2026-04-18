import "dotenv/config"
import axios, { AxiosError } from "axios"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { randomUUID } from "node:crypto"
import { Prisma } from "@prisma/client"
import type {
    LimeThreadMessage,
    LimeThreadMessagesResponse,
} from "../src/types/lime-thread-messages-response.types"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const RETRY_DELAY_MS = 10_000
const MAX_RETRIES = 3
type RetryableConfig = NonNullable<AxiosError["config"]> & { _retryCount?: number }
const api = axios.create({ timeout: 30_000 })
api.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
        const config = error.config as RetryableConfig | undefined
        if (!config) return Promise.reject(error)
        config._retryCount = config._retryCount ?? 0
        if (error.response?.status === 429 && config._retryCount < MAX_RETRIES) {
            config._retryCount++
            console.warn(`[BLiP] 429 — aguardando ${RETRY_DELAY_MS / 1000}s (retry ${config._retryCount}/${MAX_RETRIES})`)
            await new Promise<void>((r) => setTimeout(r, RETRY_DELAY_MS))
            return api(config)
        }
        return Promise.reject(error)
    },
)

const BLIP_URL = "https://chabra.http.msging.net/commands"
const API_KEY = process.env.BLIP_DESK_API_KEY!
const MAX_SKIP = 10_000
const BATCH_SIZE = 100

async function fetchTicketMessages(blipId: string, skip: number, take: number): Promise<LimeThreadMessage[]> {
    const res = await api.post<LimeThreadMessagesResponse>(BLIP_URL, {
        id: randomUUID(),
        to: "postmaster@desk.msging.net",
        method: "get",
        uri: `/tickets/${blipId}/messages?$take=${take}&$skip=${skip}&$ascending=true&getFromOwnerIfTunnel=true`,
    }, { headers: { Authorization: `Key ${API_KEY}` } })

    if (res.data.status !== "success") throw new Error("Falha ao buscar mensagens")
    return res.data.resource.items
}

async function importSingleTicket(ticketId: string, blipId: string, contactId: string) {
    let skip = 0
    let created = 0
    let linked = 0
    let notFound = 0
    let deferred = false

    while (true) {
        if (skip >= MAX_SKIP) {
            deferred = true
            break
        }

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

        notFound += blipIds.length - existing.length - toCreate.length

        if (toCreate.length > 0) {
            const result = await prisma.message.createMany({
                data: toCreate.map((m) => ({
                    blipId: m.id,
                    direction: m.direction === "sent" ? "SENT" : "RECEIVED",
                    type: m.type,
                    content: m.content as any,
                    status: m.status === "consumed" ? "CONSUMED" : "DISPATCHED",
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

        console.log(`    [skip=${skip}] msgs=${messages.length} | created=${toCreate.length} | linked=${toLink.length}`)

        skip += BATCH_SIZE
        if (messages.length < BATCH_SIZE) break
    }

    if (created + linked > 0) {
        const messageCount = await prisma.message.count({ where: { ticketId } })
        await prisma.ticket.update({ where: { id: ticketId }, data: { messageCount } })
    }

    return { created, linked, notFound, deferred }
}

async function main() {
    console.log("=== TESTE: import-ticket-messages ===\n")

    // Pegar 3 tickets mais recentes
    const tickets = await prisma.ticket.findMany({
        take: 3,
        orderBy: { storageDate: "desc" },
        select: { id: true, blipId: true, sequentialId: true, customerIdentity: true, messageCount: true },
    })

    console.log(`Testando com ${tickets.length} ticket(s):\n`)

    for (const ticket of tickets) {
        console.log(`--- Ticket #${ticket.sequentialId} | messageCount=${ticket.messageCount} ---`)
        console.log(`    customerIdentity: ${ticket.customerIdentity}`)

        // Tentar resolver contactId: mensagem já linkada ou #tunnel.originator
        let contactId: string | null = null
        const linkedMsg = await prisma.message.findFirst({ where: { ticketId: ticket.id }, select: { contactId: true } })
        if (linkedMsg) {
            contactId = linkedMsg.contactId
        } else {
            const sample = await fetchTicketMessages(ticket.blipId, 0, 10)
            for (const m of sample) {
                const originator = (m.metadata as any)?.["#tunnel.originator"] as string | undefined
                if (originator) {
                    const c = await prisma.contact.findFirst({ where: { identity: originator }, select: { id: true } })
                    if (c) { contactId = c.id; break }
                }
            }
        }

        if (!contactId) {
            console.log("    ✗ Contato não encontrado (sem originator ou não importado) — pulando\n")
            continue
        }

        console.log(`    contactId resolvido: ${contactId}`)

        const { created, linked, notFound, deferred } = await importSingleTicket(
            ticket.id, ticket.blipId, contactId,
        )

        const updatedTicket = await prisma.ticket.findUnique({
            where: { id: ticket.id },
            select: { messageCount: true },
        })

        if (deferred) {
            console.log(`    ⚠ ADIADO — created: ${created} | linked: ${linked} | notFound: ${notFound}`)
        } else {
            console.log(`    ✓ created: ${created} | linked: ${linked} | notFound: ${notFound}`)
        }
        console.log(`    messageCount no banco: ${updatedTicket?.messageCount}\n`)
    }

    const stats = await prisma.$queryRaw<[{ linked: bigint; unlinked: bigint; total: bigint }]>`
        SELECT
            COUNT(*) FILTER (WHERE ticket_id IS NOT NULL) AS linked,
            COUNT(*) FILTER (WHERE ticket_id IS NULL)     AS unlinked,
            COUNT(*)                                       AS total
        FROM messages
    `
    console.log("=== Resumo do banco ===")
    console.log(`  Total:         ${stats[0].total}`)
    console.log(`  Vinculadas:    ${stats[0].linked}`)
    console.log(`  Não vinculadas:${stats[0].unlinked}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())

import "dotenv/config"
import axios, { AxiosError } from "axios"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { randomUUID } from "node:crypto"
import type {
    LimeThreadMessage,
    LimeThreadMessagesResponse,
} from "../src/types/lime-thread-messages-response.types"

// ============================================
// SETUP
// ============================================

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

// ============================================
// HELPERS
// ============================================

async function fetchTicketMessages(blipTicketId: string, skip: number, take: number): Promise<LimeThreadMessage[]> {
    const body = {
        id: randomUUID(),
        to: "postmaster@desk.msging.net",
        method: "get",
        uri: `/tickets/${blipTicketId}/messages?$take=${take}&$skip=${skip}&$ascending=true&getFromOwnerIfTunnel=true`,
    }

    const response = await api.post<LimeThreadMessagesResponse>(BLIP_URL, body, {
        headers: { Authorization: `Key ${API_KEY}` },
    })

    if (response.data.status !== "success") {
        throw new Error(`Falha ao buscar mensagens: ${response.data.status}`)
    }

    return response.data.resource.items
}

const MAX_SKIP = 10_000

async function syncSingleTicket(ticketId: string, blipId: string, startSkip = 0): Promise<{ synced: number; notFound: number; deferred: boolean; nextSkip: number }> {
    const BATCH_SIZE = 100
    let skip = startSkip
    let hasMore = true
    let synced = 0
    let notFound = 0

    while (hasMore) {
        if (skip >= startSkip + MAX_SKIP) {
            console.log(`        [skip=${skip}] limite de 10.000 atingido — ticket adiado`)
            return { synced, notFound, deferred: true, nextSkip: skip }
        }

        console.log(`        [batch skip=${skip}] buscando mensagens...`)
        const messages = await fetchTicketMessages(blipId, skip, BATCH_SIZE)
        console.log(`        [batch skip=${skip}] recebidas: ${messages.length}`)

        if (messages.length === 0) break

        const blipIds = messages.map((m) => m.id)

        // 1 query para buscar todos do batch
        const existing = await prisma.message.findMany({
            where: { blipId: { in: blipIds } },
            select: { id: true, blipId: true, ticketId: true },
        })

        notFound += blipIds.length - existing.length

        const toLink = existing.filter((m) => m.ticketId !== ticketId)

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

    return { synced, notFound, deferred: false, nextSkip: skip }
}

// ============================================
// MAIN — testa com os primeiros 3 tickets
// ============================================

async function main() {
    console.log("=== TESTE: link-messages ===\n")

    // Pegar 3 tickets do banco (mais antigos primeiro)
    const tickets = await prisma.ticket.findMany({
        take: 3,
        orderBy: { storageDate: "asc" },
        select: { id: true, blipId: true, sequentialId: true, customerIdentity: true },
    })

    if (tickets.length === 0) {
        console.log("Nenhum ticket encontrado no banco.")
        return
    }

    console.log(`Testando com ${tickets.length} ticket(s):\n`)

    const deferredTickets: Array<{ sequentialId: number; blipId: string; ticketId: string; startSkip: number }> = []

    for (const ticket of tickets) {
        console.log(`--- Ticket #${ticket.sequentialId} (${ticket.blipId}) ---`)
        console.log(`    customerIdentity: ${ticket.customerIdentity}`)

        // 1. Buscar 1 mensagem do Blip para ver a estrutura
        const sample = await fetchTicketMessages(ticket.blipId, 0, 3)
        console.log(`    Mensagens retornadas pelo Blip (amostra): ${sample.length}`)

        if (sample.length > 0) {
            const msg = sample[0]
            const resolvedId = msg.metadata?.["#messageId"] as string | undefined ?? msg.id
            console.log(`    message.id:               ${msg.id}`)
            console.log(`    metadata["#messageId"]:   ${msg.metadata?.["#messageId"] ?? "(ausente)"}`)
            console.log(`    resolvedId (usado):        ${resolvedId}`)

            const inDb = await prisma.message.findUnique({
                where: { blipId: resolvedId },
                select: { id: true, ticketId: true },
            })
            console.log(`    No banco: ${inDb ? `✓ (ticketId: ${inDb.ticketId ?? "null"})` : "✗ não encontrado"}`)
        }

        // 2. Rodar sync completo
        console.log(`    Iniciando sync...`)
        const { synced, notFound, deferred, nextSkip } = await syncSingleTicket(ticket.id, ticket.blipId)

        if (deferred) {
            console.log(`    ⚠ ADIADO — synced: ${synced} | notFound: ${notFound} | continuará em skip=${nextSkip}\n`)
            deferredTickets.push({ sequentialId: ticket.sequentialId, blipId: ticket.blipId, ticketId: ticket.id, startSkip: nextSkip })
        } else {
            console.log(`    ✓ synced: ${synced} | notFound: ${notFound}\n`)
        }
    }

    if (deferredTickets.length > 0) {
        console.log("=== Tickets adiados (>10.000 mensagens) ===")
        for (const t of deferredTickets) {
            console.log(`  #${t.sequentialId} — blipId: ${t.blipId} — continuará em skip=${t.startSkip}`)
        }
        console.log()

        // 3. Testar reprocessamento dos adiados (próximos 10.000 de cada)
        console.log("=== REPROCESSANDO ADIADOS ===\n")
        for (const t of deferredTickets) {
            console.log(`--- Reprocessando #${t.sequentialId} a partir de skip=${t.startSkip} ---`)
            const { synced, notFound, deferred: stillDeferred, nextSkip } = await syncSingleTicket(
                t.ticketId, t.blipId, t.startSkip,
            )
            if (stillDeferred) {
                console.log(`    ⚠ AINDA ADIADO — synced: ${synced} | notFound: ${notFound} | próximo skip=${nextSkip}\n`)
            } else {
                console.log(`    ✓ CONCLUÍDO — synced: ${synced} | notFound: ${notFound}\n`)
            }
        }
    }

    // Resumo final
    const stats = await prisma.$queryRaw<[{ linked: bigint; unlinked: bigint }]>`
        SELECT
            COUNT(*) FILTER (WHERE ticket_id IS NOT NULL) AS linked,
            COUNT(*) FILTER (WHERE ticket_id IS NULL)     AS unlinked
        FROM messages
    `
    console.log("=== Resumo do banco ===")
    console.log(`  Mensagens vinculadas:   ${stats[0].linked}`)
    console.log(`  Mensagens não vinculadas: ${stats[0].unlinked}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

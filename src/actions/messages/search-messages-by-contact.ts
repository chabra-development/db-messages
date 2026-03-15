"use server"

import { prisma } from "@/lib/prisma"
import { Message } from "@prisma/client"
import { Prisma } from "@prisma/client"

type SearchResult = Pick<Message, "id" | "direction" | "content" | "sentAt" | "status">

type Params = {
    contactId: string
    query: string
    from?: Date
    to?: Date
    take?: number
}

export async function searchMessagesByContact({
    contactId,
    query,
    from,
    to,
    take = 30,
}: Params): Promise<SearchResult[]> {

    if (!query.trim()) return []

    const term = `%${query.trim()}%`

    const conditions: Prisma.Sql[] = [
        Prisma.sql`contact_id = ${contactId}`,
        Prisma.sql`content::text ILIKE ${term}`,
    ]

    if (from) {
        conditions.push(Prisma.sql`sent_at >= ${from}`)
    }

    if (to) {
        const endOfDay = new Date(to)
        endOfDay.setHours(23, 59, 59, 999)
        conditions.push(Prisma.sql`sent_at <= ${endOfDay}`)
    }

    const where = Prisma.join(conditions, " AND ")

    type RawResult = Omit<SearchResult, "sentAt"> & { sentAt: Date }

    const results = await prisma.$queryRaw<RawResult[]>`
        SELECT id, direction, content, sent_at AS "sentAt", status
        FROM messages
        WHERE ${where}
        ORDER BY sent_at DESC
        LIMIT ${take}
    `

    return results
}

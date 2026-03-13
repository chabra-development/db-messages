"use server"

import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function findMessagesMediaByContactId(contactId: string) {
    return await prisma.message.findMany({
        where: {
            contactId,
            AND: [
                { content: { not: Prisma.JsonNull } },
                { content: { path: ["uri"], not: Prisma.JsonNull } },
                { content: { path: ["type"], not: "sticker/webp" } },
            ]
        },
        orderBy: [
            { sentAt: "desc" },
            { id: "desc" },
        ],
        select: {
            id: true,
            content: true,
            sentAt: true,
        },
    })
}
"use server"

import { prisma } from "@/lib/prisma"
import { Message } from "@prisma/client"

type Params = {
    contactId: string
    take?: number
    cursor?: string
}

type Response = {
    messages: Message[]
    nextCursor: string | null
}

export async function findMessagesByContact({
    contactId,
    take = 20,
    cursor,
}: Params): Promise<Response> {
    const messages = await prisma.message.findMany({
        where: { contactId },
        take,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { sentAt: "desc" },
    })

    return {
        messages,
        nextCursor: messages.length === take ? messages.at(-1)!.id : null,
    }
}

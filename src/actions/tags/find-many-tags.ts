"use server"

import { prisma } from "@/lib/prisma"

export async function findManyTags() {
    return prisma.tag.findMany({
        orderBy: { createdAt: "asc" },
        include: {
            _count: { select: { contacts: true } },
        },
    })
}

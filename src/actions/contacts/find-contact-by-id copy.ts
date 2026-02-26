"use server"

import { prisma } from "@/lib/prisma"

export async function findContactById(id: string) {
    return await prisma.contact.findUniqueOrThrow({
        where: {
            id
        }
    })
}
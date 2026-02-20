"use server"

import { prisma } from "@/lib/prisma"

export async function findContactById(id: string) {

    const contact = await prisma.contact.findUnique({
        where: {
            id
        }
    })

    return contact
}
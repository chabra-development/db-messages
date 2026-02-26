"use server"

import { prisma } from "@/lib/prisma"

export async function findAttendantsById(id: string) {
    return await prisma.user.findUniqueOrThrow({
        where: {
            id
        }
    })
}
"use server"

import { prisma } from "@/lib/prisma"

export async function findAttendantsByUser(id: string) {

    const user = await prisma.user.findUnique({
        where: {
            id
        }
    })

    if (!user) {
        throw new Error("O usuário não foi encontrado.")
    }

    return user
}
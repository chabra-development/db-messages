"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export async function deleteTag(id: string) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) throw new Error("Não autorizado")

    await prisma.tag.delete({ where: { id } })
}

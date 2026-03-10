"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createTagSchema } from "@/schemas/tag.schema"
import { headers } from "next/headers"

export async function createTag(input: { name: string; color?: string }) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) throw new Error("Não autorizado")

    const result = createTagSchema.safeParse(input)
    if (!result.success) throw new Error(result.error.issues[0].message)

    const { name, color } = result.data

    const existing = await prisma.tag.findUnique({ where: { name } })
    if (existing) throw new Error("Já existe uma tag com esse nome")

    return prisma.tag.create({
        data: { name, color, created_by_id: session.user.id },
    })
}

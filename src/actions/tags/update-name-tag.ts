"use server"

import { prisma } from "@/lib/prisma"
import { findTagById } from "./find-tag-by-id"

type UpdateNameTagProps = {
    id: string
    name: string
}

export async function updateNameTag({ id, name }: UpdateNameTagProps) {
    
    await findTagById(id)
    
    return await prisma.tag.update({
        where: { id },
        data: { name }
    })
}

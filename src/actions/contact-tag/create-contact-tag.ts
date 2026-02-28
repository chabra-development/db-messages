"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CreateTagsProps } from "@/schemas/create-tags-schema"
import { headers } from "next/headers"
import { findContactById } from "../contacts/find-contact-by-id"

type CreateContactTagsProps = CreateTagsProps & {
    contactId: string
}

export async function createContactTags({ tags, contactId }: CreateContactTagsProps) {

    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        throw new Error("Sessão inválida, tente conectar novamente.")
    }

    const createdById = session.user.id

    await findContactById(contactId)

    const existingTags = await prisma.contactTag.findMany({
        where: { contactId },
        select: { id: true, tag: true }
    })

    const newTagNames = tags.map(({ name }) => name)
    const existingTagNames = existingTags.map(({ tag }) => tag)

    const tagsToDelete = existingTags
        .filter(({ tag }) => !newTagNames.includes(tag))
        .map(({ id }) => id)

    const tagsToCreate = tags.filter(({ name }) => !existingTagNames.includes(name))

    const [deletedTags, createdTags] = await prisma.$transaction([
        prisma.contactTag.deleteMany({
            where: { id: { in: tagsToDelete } }
        }),
        prisma.contactTag.createMany({
            skipDuplicates: true,
            data: tagsToCreate.map(({ name: tag }) => ({
                contactId,
                createdById,
                tag,
            }))
        })
    ])

    return { deletedTags, createdTags }
}
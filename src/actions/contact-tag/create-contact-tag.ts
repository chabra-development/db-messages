"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CreateTagsProps } from "@/schemas/create-tags-schema"
import { findContactById } from "../contacts/find-contact-by-id"

type CreateContactTagsProps = CreateTagsProps & {
    contactId: string
}

export async function createContactTags({ tags, contactId }: CreateContactTagsProps) {

    const session = await auth.api.getSession()

    if (!session) {
        throw new Error("Sessão inválida, tente conectar novamente.")
    }

    const createdById = session.user.id

    await findContactById(contactId)

    const tagsCreated = await prisma.contactTag.createManyAndReturn({
        data: tags.map(({ name: tag }) => ({
            contactId,
            createdById,
            tag,
        }))
    })

    return tagsCreated
}
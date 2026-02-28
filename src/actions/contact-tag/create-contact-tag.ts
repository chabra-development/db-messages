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

    // busca as tags já associadas ao contato
    const existingContactTags = await prisma.contactTag.findMany({
        where: { contactId },
        include: { tag: true }
    })

    const newTagNames = tags.map(({ name }) => name)
    const existingTagNames = existingContactTags.map(({ tag }) => tag.name)

    // tagIds a desassociar do contato
    const tagIdsToDelete = existingContactTags
        .filter(({ tag }) => !newTagNames.includes(tag.name))
        .map(({ tagId }) => tagId)

    // nomes de tags novas a criar/associar
    const tagsToCreate = tags.filter(({ name }) => !existingTagNames.includes(name))

    const [deletedTags, ...createdTags] = await prisma.$transaction([
        prisma.contactTag.deleteMany({
            where: {
                contactId,
                tagId: { in: tagIdsToDelete }
            }
        }),
        ...tagsToCreate.map(({ name }) =>
            prisma.contactTag.create({
                data: {
                    contact: { connect: { id: contactId } },
                    tag: {
                        connectOrCreate: {
                            where: { name },
                            create: { name, createdById }
                        }
                    }
                }
            })
        )
    ])

    return { deletedTags, createdTags }
}
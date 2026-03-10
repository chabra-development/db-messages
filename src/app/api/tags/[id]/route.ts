import { createContactTags } from "@/actions/contact-tag/create-contact-tag"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createTagsSchema } from "@/schemas/create-tags-schema"
import { NextRequest, NextResponse } from "next/server"

interface Params {
    params: Promise<{ id: string }>
}

export async function GET(_: NextRequest, { params }: Params) {

    const { id: contactId } = await params

    const contact = await prisma.contact.findFirst({
        where: {
            OR: [{ id: contactId }, { identity: contactId }]
        },
        select: { id: true }
    })

    if (!contact) {
        return NextResponse.json(
            { error: "Não foi encontrado o contato selecionado." },
            { status: 404 }
        )
    }

    const tags = await prisma.tag.findMany({
        where: {
            contacts: {
                some: { contactId: contact.id }
            }
        }
    })

    return NextResponse.json(tags, { status: 200 })
}

export async function PUT(req: NextRequest, { params }: Params) {

    const { id: contactId } = await params

    const { success, data, error } = createTagsSchema.safeParse(await req.json())

    if (!success) {
        return NextResponse.json(error, { status: 400 })
    }

    const result = await createContactTags({ ...data, contactId, headers: req.headers })

    return NextResponse.json(result, { status: 200 })
}
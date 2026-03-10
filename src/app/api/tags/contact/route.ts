import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { assignTagSchema, unassignTagSchema } from "@/schemas/tag.schema"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// GET /api/tags/contact?identity=xxx — tags de um contato pelo identity do Blip
export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const identity = req.nextUrl.searchParams.get("identity")
    if (!identity) {
        return NextResponse.json(
            { error: "Parâmetro 'identity' é obrigatório" },
            { status: 400 }
        )
    }

    const contact = await prisma.contacts.findUnique({ where: { identity } })
    if (!contact) {
        return NextResponse.json([])
    }

    const contactTags = await prisma.contactTag.findMany({
        where: { contactId: contact.id },
        include: { tag: true },
    })

    return NextResponse.json(contactTags.map((ct) => ct.tag))
}

// POST /api/tags/contact — associa uma tag a um contato
export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const result = assignTagSchema.safeParse(body)

    if (!result.success) {
        return NextResponse.json(
            { error: result.error.issues[0].message },
            { status: 400 }
        )
    }

    const { contactIdentity, tagId } = result.data

    const contact = await prisma.contacts.findUnique({
        where: { identity: contactIdentity },
    })
    if (!contact) {
        return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 })
    }

    const tag = await prisma.tag.findUnique({ where: { id: tagId } })
    if (!tag) {
        return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 })
    }

    const contactTag = await prisma.contactTag.upsert({
        where: { contactId_tagId: { contactId: contact.id, tagId } },
        create: { contactId: contact.id, tagId },
        update: {},
        include: { tag: true },
    })

    return NextResponse.json(contactTag.tag, { status: 201 })
}

// DELETE /api/tags/contact — remove a associação de uma tag com um contato
export async function DELETE(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const result = unassignTagSchema.safeParse(body)

    if (!result.success) {
        return NextResponse.json(
            { error: result.error.issues[0].message },
            { status: 400 }
        )
    }

    const { contactIdentity, tagId } = result.data

    const contact = await prisma.contacts.findUnique({
        where: { identity: contactIdentity },
    })
    if (!contact) {
        return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 })
    }

    await prisma.contactTag.deleteMany({
        where: { contactId: contact.id, tagId },
    })

    return new NextResponse(null, { status: 204 })
}

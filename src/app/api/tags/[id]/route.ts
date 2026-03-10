import { prisma } from "@/lib/prisma"
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
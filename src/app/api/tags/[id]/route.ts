import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

interface Params {
    params: Promise<{ id: string }>
}

export async function GET(_: NextRequest, { params }: Params) {

    const { id: contactId } = await params

    const contact = await prisma.contact.findUnique({
        where: {
            id: contactId
        },
        select: {
            id: true
        }
    })

    if (!contact) {
        return NextResponse.json(
            {
                error: "Não foi encontrado o contato selecionado."
            }, {
            status: 404
        })
    }

    const tags = await prisma.tag.findMany({
        where: {
            contacts: {
                some: {
                    contactId
                }
            }
        }
    })

    return NextResponse.json(tags, { status: 200 })
}
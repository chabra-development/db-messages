import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// GET /api/tags/ticket?blipId={uuid} — tags de um contato pelo blip_id do ticket
export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const blipId = req.nextUrl.searchParams.get("blipId")
    if (!blipId) {
        return NextResponse.json(
            { error: "Parâmetro 'blipId' é obrigatório" },
            { status: 400 }
        )
    }

    const ticket = await prisma.tickets.findUnique({
        where: { blip_id: blipId },
        select: { contact_id: true },
    })

    if (!ticket) {
        return NextResponse.json([])
    }

    const contactTags = await prisma.contactTag.findMany({
        where: { contactId: ticket.contact_id },
        include: { tag: true },
    })

    return NextResponse.json(contactTags.map((ct) => ct.tag))
}

import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const querySchema = z.object({
    take: z.coerce.number().int().positive().max(100).optional().default(10),
    skip: z.coerce.number().int().nonnegative().optional().default(0),
    direction: z.enum(["SENT", "RECEIVED"]).optional(),
    type: z.string().min(1).optional(),
})

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: contactId } = await params

    const parsed = querySchema.safeParse(
        Object.fromEntries(req.nextUrl.searchParams)
    )

    if (!parsed.success) {
        return NextResponse.json(
            { error: z.prettifyError(parsed.error) },
            { status: 400 }
        )
    }

    const { take, skip, direction, type } = parsed.data

    const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { id: true, name: true, source: true },
    })

    if (!contact) {
        return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 })
    }

    const where = {
        contactId,
        ...(direction ? { direction } : {}),
        ...(type ? { type } : {}),
    }

    const [messages, total] = await prisma.$transaction([
        prisma.message.findMany({
            where,
            take,
            skip,
            orderBy: { sentAt: "desc" },
            select: {
                id: true,
                direction: true,
                type: true,
                content: true,
                sentAt: true,
            },
        }),
        prisma.message.count({ where }),
    ])

    return NextResponse.json(
        {
            contact,
            pagination: { take, skip, total },
            messages,
        },
        { status: 200 }
    )
}

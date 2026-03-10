import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createTagSchema } from "@/schemas/tag.schema"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// GET /api/tags — lista todas as tags
export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const tags = await prisma.tag.findMany({
        orderBy: { createdAt: "asc" },
        include: {
            _count: { select: { contacts: true } },
        },
    })

    return NextResponse.json(tags)
}

// POST /api/tags — cria uma nova tag
export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const result = createTagSchema.safeParse(body)

    if (!result.success) {
        return NextResponse.json(
            { error: result.error.issues[0].message },
            { status: 400 }
        )
    }

    const { name, color } = result.data

    const existing = await prisma.tag.findUnique({ where: { name } })
    if (existing) {
        return NextResponse.json(
            { error: "Já existe uma tag com esse nome" },
            { status: 409 }
        )
    }

    const tag = await prisma.tag.create({
        data: {
            name,
            color,
            created_by_id: session.user.id,
        },
    })

    return NextResponse.json(tag, { status: 201 })
}

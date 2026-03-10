import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// DELETE /api/tags/[id] — remove uma tag e todas as suas associações
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    const tag = await prisma.tag.findUnique({ where: { id } })
    if (!tag) {
        return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 })
    }

    await prisma.tag.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
}

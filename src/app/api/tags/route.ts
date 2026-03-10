import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const querySchema = z.object({
    take: z.coerce.number().int().positive().optional(),
    skip: z.coerce.number().int().nonnegative().optional(),
    search: z.string().min(1).optional(),
})

export async function GET(req: NextRequest) {

    const parsed = querySchema.safeParse(
        Object.fromEntries(req.nextUrl.searchParams)
    )

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.flatten().fieldErrors },
            { status: 400 }
        )
    }

    const { take, skip, search } = parsed.data

    const tags = await prisma.tag.findMany({
        take,
        skip,
        where: search ? {
            name: { contains: search, mode: "insensitive" }
        } : undefined,
        orderBy: { name: "asc" }
    })

    return NextResponse.json(tags, { status: 200 })
}
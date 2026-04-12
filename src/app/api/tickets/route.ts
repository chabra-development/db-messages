import { env } from "@/env"
import { api } from "@/lib/axios"
import type { LimeCollectionResponse } from "@/types/blip-tickets.types"
import { randomUUID } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const querySchema = z.object({
    take: z.coerce.number().int().positive().max(100).default(100),
    skip: z.coerce.number().int().nonnegative().default(0),
})

const BLIP_URL = "https://chabra.http.msging.net/commands"

export async function GET(req: NextRequest) {
    const parsed = querySchema.safeParse(
        Object.fromEntries(req.nextUrl.searchParams)
    )

    if (!parsed.success) {
        return NextResponse.json(
            { error: z.prettifyError(parsed.error) },
            { status: 400 }
        )
    }

    const { take, skip } = parsed.data

    const response = await api.post<LimeCollectionResponse>(
        BLIP_URL,
        {
            id: randomUUID(),
            to: "postmaster@desk.msging.net",
            method: "get",
            uri: `/tickets?$skip=${skip}&$take=${take}`,
        },
        {
            headers: {
                Authorization: `Key ${env.BLIP_DESK_API_KEY}`,
            },
        }
    )

    if (response.data.status !== "success") {
        return NextResponse.json(
            { error: "Falha ao buscar tickets no Blip", detail: response.data.status },
            { status: 502 }
        )
    }

    const { total, items } = response.data.resource

    return NextResponse.json(
        {
            pagination: { skip, take, total },
            tickets: items,
        },
        { status: 200 }
    )
}

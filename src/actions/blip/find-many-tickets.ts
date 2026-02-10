"use server"

import { api } from "@/lib/axios"
import { BodyBlib } from "@/types/index.types"
import { LimeCollectionResponse } from "@/types/lime-ticket-response.types"
import { randomUUID } from "node:crypto"
import { z } from "zod"
import { env } from "@/env"

const findContactIdByNumberPhoneSchema = z.object({
    BLIP_DESK_API_KEY: z.string().min(1, "A chave do roteador é obrigatória."),
})

export async function findManyTickets() {

    const url = "https://chabra.http.msging.net/commands"

    const result = findContactIdByNumberPhoneSchema.safeParse({
        BLIP_DESK_API_KEY: env.BLIP_DESK_API_KEY
    })

    if (!result.success) {
        throw new Error(result.error.issues[0].message)
    }

    const { BLIP_DESK_API_KEY } = result.data

    const body: BodyBlib = {
        id: randomUUID(),
        to: "postmaster@desk.msging.net",
        method: "get",
        uri: "/tickets"
    }

    const response = await api.post<LimeCollectionResponse>(url, body, {
        headers: {
            Authorization: `Key ${BLIP_DESK_API_KEY}`,
        },
    })

    return response.data
}

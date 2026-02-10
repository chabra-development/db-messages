"use server"

import { api } from "@/lib/axios"
import { randomUUID } from "node:crypto"
import { LimeCollectionResponse } from "@/types/lime-collection-response.types"
import z from "zod"
import { env } from "@/env"

const findManyContactsSchema = z.object({
    ROUTER_API_KEY: z.string().min(1, "A chave do roteador é obrigatória."),
})

export async function findManyContacts() {

    const url = "https://chabra.http.msging.net/commands"

    const result = findManyContactsSchema.safeParse({
        ROUTER_API_KEY: env.ROUTER_API_KEY,
    })

    if (!result.success) {
        throw new Error(result.error.issues[0].message)
    }

    const { ROUTER_API_KEY } = result.data

    const body = {
        id: randomUUID(),
        method: "get",
        uri: "/contacts"
    }

    const response = await api.post<LimeCollectionResponse>(url, body, {
        headers: {
            Authorization: `Key ${ROUTER_API_KEY}`,
        },
    })

    return response.data
}
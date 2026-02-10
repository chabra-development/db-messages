"use server"

import { env } from "@/env"
import { api } from "@/lib/axios"
import {
    LimeThreadMessagesResponse
} from "@/types/lime-thread-messages-response.types"
import { randomUUID } from "node:crypto"
import z from "zod"

const findManyContactsSchema = z.object({
    ROUTER_API_KEY: z.string().min(1, "A chave do roteador é obrigatória."),
})

export async function findMessagesByIdentifyContact(identify: string) {

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
        uri: `/threads/${identify}?refreshExpiredMedia=true`
    }

    const response = await api.post<LimeThreadMessagesResponse>(url, body, {
        headers: {
            Authorization: `Key ${ROUTER_API_KEY}`,
        },
    })

    return response.data
}
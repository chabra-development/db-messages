"use server"

import { env } from "@/env"
import { api } from "@/lib/axios"
import {
    LimeThreadMessagesResponse,
    LimeThreadMessage
} from "@/types/lime-thread-messages-response.types"
import { randomUUID, type UUID } from "node:crypto"
import z from "zod"

const findManyContactsSchema = z.object({
    ROUTER_API_KEY: z.string().min(1, "A chave do roteador é obrigatória."),
})

interface FindMessagesOptions {
    limit?: number
}

export async function findMessagesByIdentifyContact(
    identify: string,
    options: FindMessagesOptions = {}
): Promise<LimeThreadMessagesResponse> {
    const url = "https://chabra.http.msging.net/commands"

    const result = findManyContactsSchema.safeParse({
        ROUTER_API_KEY: env.ROUTER_API_KEY,
    })

    if (!result.success) {
        throw new Error(result.error.issues[0].message)
    }

    const { ROUTER_API_KEY } = result.data

    const TAKE = 100

    const { limit = Infinity } = options

    let skip = 0
    let allMessages: LimeThreadMessage[] = []
    let total = 0
    let responseId = randomUUID()
    let responseFrom = ""
    let responseTo = ""

    try {
        
        while (allMessages.length < limit) {

            const currentTake = Math.min(TAKE, limit - allMessages.length)

            const body = {
                id: randomUUID(),
                method: "get",
                uri: `/threads/${identify}?$skip=${skip}&$take=${currentTake}&refreshExpiredMedia=true`
            }

            const response = await api.post<LimeThreadMessagesResponse>(url, body, {
                headers: {
                    Authorization: `Key ${ROUTER_API_KEY}`,
                },
            })

            // Verificar status
            if (response.data.status !== "success") {
                throw new Error(
                    `Falha ao buscar mensagens: ${response.data.status}`
                )
            }

            const { resource, id, from, to } = response.data

            // Salvar informações da primeira resposta
            if (skip === 0) {
                responseId = id as UUID
                responseFrom = from
                responseTo = to
            }

            // Capturar total na primeira iteração
            if (total === 0) {
                total = resource.total
            }

            allMessages.push(...resource.items)

            if (
                (resource.items.length < currentTake) ||
                (allMessages.length >= total)
            ) {
                break
            }

            skip += currentTake

            await new Promise(resolve => setTimeout(resolve, 300))
        }

        // Limitar array ao limite especificado
        const limitedMessages = allMessages.slice(0, limit)

        // Retornar no formato LimeThreadMessagesResponse
        return {
            type: "application/vnd.lime.collection+json",
            method: "get",
            status: "success",
            id: responseId,
            from: responseFrom,
            to: responseTo,
            resource: {
                total: limitedMessages.length,
                itemType: "application/vnd.iris.thread-message+json",
                items: limitedMessages
            }
        }

    } catch (error) {
        console.error('Erro ao buscar mensagens:', error)
        throw error
    }
}
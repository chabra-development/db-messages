"use server"

import { env } from "@/env"
import {
    isLimeMediaContent,
    isLimeReplyToMedia,
} from "@/guards/lime-thread-messages.guards"
import { api } from "@/lib/axios"
import { LimeThreadMessage } from "@/types/lime-thread-messages-response.types"
import { randomUUID } from "node:crypto"
import z from "zod"
import { uploadFile } from "../supabase/upload-files"

// ============================================
// CONFIGURAÇÃO
// ============================================

const ALLOWED_MEDIA_TYPES =
    "image/jpeg, image/png, image/gif, image/webp, audio/ogg, audio/mpeg, audio/mp4, audio/aac, video/mp4, video/ogg, video/webm, application/pdf"

const allowedMediaTypesArray = ALLOWED_MEDIA_TYPES.split(", ")

const processMessageContentSchema = z.object({
    BLIP_DESK_API_KEY: z.string().nonempty("A BLIP_DESK_API_KEY é obrigatória."),
})

// ============================================
// HELPERS
// ============================================

function isAllowedMediaType(type: string): boolean {
    return allowedMediaTypesArray.includes(type)
}

/**
 * Renova uma URI de mídia expirada do BLiP
 */
async function refreshMediaUri(expiredUri: string, deskApiKey: string): Promise<string | null> {
    
    const response = await api.post(
        "https://chabra.http.msging.net/commands",
        {
            id: randomUUID(),
            to: "postmaster@media.msging.net",
            method: "set",
            uri: "/refresh-media-uri",
            type: "text/plain",
            resource: expiredUri,
        },
        {
            headers: { Authorization: `Key ${deskApiKey}` },
        }
    )

    if (response.data.status !== "success") return null

    return response.data.resource as string
}

/**
 * Verifica se a URI está acessível via HEAD com a BLIP_DESK_API_KEY
 */
async function isUriAccessible(uri: string, deskApiKey: string): Promise<boolean> {
    try {
        const response = await fetch(uri, {
            method: "HEAD",
            headers: { Authorization: `Key ${deskApiKey}` },
            signal: AbortSignal.timeout(5000),
        })

        const contentType = response.headers.get("Content-Type") ?? ""

        return response.ok && !contentType.includes("xml")
    } catch {
        return false
    }
}

/**
 * Obtém a URI válida — verifica acessibilidade e renova se necessário
 */
async function resolveMediaUri(
    uri: string,
    deskApiKey: string
): Promise<string | null> {
    const accessible = await isUriAccessible(uri, deskApiKey)

    if (accessible) return uri

    return await refreshMediaUri(uri, deskApiKey)
}

/**
 * Faz o download e upload de uma URI de mídia para o Supabase.
 * Retorna a URL pública ou null se falhar.
 */
async function uploadMediaFromUri(uri: string, messageId: string): Promise<string | null> {
    const response = await fetch(uri)

    const blob = await response.blob()
    const file = new File([blob], messageId, { type: blob.type })

    if (!isAllowedMediaType(file.type)) {
        throw new Error(`Tipo de mídia não permitido: ${blob.type}`)
    }

    return await uploadFile(file)
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

export async function processMessageContent(message: LimeThreadMessage): Promise<{
    content: LimeThreadMessage["content"]
    metadata?: LimeThreadMessage["metadata"]
}> {

    // Caso 1: content é mídia direta — { type, uri }
    if (isLimeMediaContent(message.content)) {
        try {
            const { data, error } = processMessageContentSchema.safeParse({
                ROUTER_API_KEY: env.ROUTER_API_KEY,
                BLIP_DESK_API_KEY: env.BLIP_DESK_API_KEY,
            })

            if (error) throw new Error(error.issues[0].message)

            const uri = await resolveMediaUri(message.content.uri, data.BLIP_DESK_API_KEY)

            if (!uri) throw new Error(`Não foi possível resolver a URI: ${message.content.uri}`)

            const publicUrl = await uploadMediaFromUri(uri, message.id)

            if (!publicUrl) throw new Error(`Falha ao fazer upload da mídia: ${message.id}`)

            return {
                content: { ...message.content, uri: publicUrl },
                metadata: message.metadata,
            }

        } catch (error) {
            console.error(`Failed to upload media for message ${message.id}:`, error)
        }
    }

    // Caso 2: content é reply com mídia no inReplyTo — { replied, inReplyTo: { value: { type, uri } } }
    if (isLimeReplyToMedia(message.content)) {
        try {
            const { data, error } = processMessageContentSchema.safeParse({
                BLIP_DESK_API_KEY: env.BLIP_DESK_API_KEY,
            })

            if (error) throw new Error(error.issues[0].message)

            const mediaUri = message.content.inReplyTo.value.uri

            const uri = await resolveMediaUri(mediaUri, data.BLIP_DESK_API_KEY)

            if (!uri) throw new Error(`Não foi possível resolver a URI: ${mediaUri}`)

            const publicUrl = await uploadMediaFromUri(uri, message.id)

            if (!publicUrl) throw new Error(`Falha ao fazer upload da mídia: ${message.id}`)

            return {
                content: {
                    ...message.content,
                    inReplyTo: {
                        ...message.content.inReplyTo,
                        value: {
                            ...message.content.inReplyTo.value,
                            uri: publicUrl,
                        },
                    },
                },
                metadata: message.metadata,
            }

        } catch (error) {
            console.error(`Failed to upload reply media for message ${message.id}:`, error)
        }
    }

    // Demais tipos — retorna content original sem modificação
    return {
        content: message.content,
        metadata: message.metadata,
    }
}
"use server"

import { env } from "@/env"
import { api } from "@/lib/axios"
import { prisma } from "@/lib/prisma"
import { LimeCollectionResponse, LimeContact } from "@/types/lime-collection-response.types"
import { randomUUID } from "node:crypto"
import z from "zod"
import { findContactNameByNumberPhone } from "../blip/find-contact-name-by-number-phone"
import { appendImportJobFailure } from "../import-job/append-import-job-failure"
import { createImportJob } from "../import-job/create-import-job"
import { deleteImportJob } from "../import-job/delete-import-job"
import { updateImportJobProgress } from "../import-job/update-import-job-progress"
import { updateImportJobStatus } from "../import-job/update-import-job-status"

// Configurações de importação
const TAKE = 100 // Máximo suportado pela API
const BATCH_SIZE = 10 // Processa 10 contatos por vez
const DELAY_BETWEEN_BATCHES = 500 // 500ms entre lotes (rate limiting)
const JOB_CLEANUP_DELAY = 60_000 // 1 minuto para limpar job concluído

const importContactsEnvSchema = z.object({
    ROUTER_API_KEY: z
        .string()
        .nonempty("A ROUTER_API_KEY é obrigatória.")
})

interface ImportResult {
    jobId: string
    total: number
    message: string
}

/**
 * Divide array em lotes menores
 */
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

/**
 * Aguarda um tempo determinado
 */
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Busca uma página de contatos da API
 */
async function fetchContactsPage(
    routerApiKey: string,
    skip: number
): Promise<LimeCollectionResponse> {

    const url = "https://chabra.http.msging.net/commands"

    const body = {
        id: randomUUID(),
        method: "get",
        uri: `/contacts?$skip=${skip}&$take=${TAKE}`
    }

    const response = await api.post<LimeCollectionResponse>(url, body, {
        headers: {
            Authorization: `Key ${routerApiKey}`,
        },
    })

    return response.data
}

/**
 * Busca todos os contatos da API paginando até o total
 */
async function fetchAllContacts(routerApiKey: string): Promise<LimeContact[]> {

    const firstPage = await fetchContactsPage(routerApiKey, 0)

    if (firstPage.status !== "success") {
        throw new Error(`Falha ao buscar contatos: ${firstPage.status}`)
    }

    const total = firstPage.resource.total
    const allContacts: LimeContact[] = [...firstPage.resource.items]

    const remainingPages = Math.ceil((total - TAKE) / TAKE)

    for (let i = 1; i <= remainingPages; i++) {
        const skip = i * TAKE
        const page = await fetchContactsPage(routerApiKey, skip)

        if (page.status !== "success") {
            throw new Error(`Falha ao buscar página ${i}: ${page.status}`)
        }

        allContacts.push(...page.resource.items)

        await delay(300)
    }

    return allContacts
}

/**
 * Processa um único contato (upsert)
 */
async function processContact(
    jobId: string,
    contact: LimeContact
): Promise<{ success: boolean; error?: string }> {

    const {
        identity,
        source,
        phoneNumber,
        email,
        taxDocument,
        group,
        extras,
        lastMessageDate,
        lastUpdateDate
    } = contact

    try {

        if (!identity) {
            throw new Error("Identity é obrigatório")
        }

        const name = await findContactNameByNumberPhone({
            numberPhone: phoneNumber,
            alternativeName: contact.name
        })

        await prisma.contact.upsert({
            where: { identity },
            create: {
                identity,
                name: name ?? "sem nome",
                source,
                phoneNumber,
                email,
                taxDocument,
                group,
                extras: extras ?? undefined,
                lastMessageDate: lastMessageDate ? new Date(lastMessageDate) : undefined,
                lastUpdateDate: lastUpdateDate ? new Date(lastUpdateDate) : undefined,
            },
            update: {
                name,
                source,
                phoneNumber,
                email,
                taxDocument,
                group,
                extras: extras ?? undefined,
                lastMessageDate: lastMessageDate ? new Date(lastMessageDate) : undefined,
                lastUpdateDate: lastUpdateDate ? new Date(lastUpdateDate) : undefined,
            },
        })

        return { success: true }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"

        await appendImportJobFailure(jobId, {
            identity,
            reason: errorMessage,
            timestamp: new Date(),
        })

        return { success: false, error: errorMessage }
    }
}

/**
 * Processa um lote de contatos
 */
async function processBatch(
    jobId: string,
    batch: LimeContact[]
): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0
    let failed = 0

    const results = await Promise.allSettled(
        batch.map(contact => processContact(jobId, contact))
    )

    for (const result of results) {
        if (result.status === "fulfilled" && result.value.success) {
            succeeded++
        } else {
            failed++
        }
    }

    await updateImportJobProgress(jobId, {
        processedIncrement: batch.length,
        succeededIncrement: succeeded,
        failedIncrement: failed,
    })

    return { succeeded, failed }
}

/**
 * Função principal de importação de contatos
 */
export async function importContacts(): Promise<ImportResult> {

    const result = importContactsEnvSchema.safeParse({
        ROUTER_API_KEY: env.ROUTER_API_KEY,
    })

    if (!result.success) {
        throw new Error(result.error.issues[0].message)
    }

    const { ROUTER_API_KEY } = result.data

    const contacts = await fetchAllContacts(ROUTER_API_KEY)

    const uniqueContacts = Array.from(
        new Map(contacts.map(c => [c.identity, c])).values()
    )

    const deduplicatedCount = contacts.length - uniqueContacts.length

    const job = await createImportJob({
        total: uniqueContacts.length,
        metadata: {
            deduplicatedCount,
            batchSize: BATCH_SIZE,
            startedAt: new Date().toISOString(),
        },
    })

        // Processa em background (não bloqueia a resposta)
        ; (async () => {
            try {
                await updateImportJobStatus(job.id, "RUNNING")

                const batches = chunkArray(uniqueContacts, BATCH_SIZE)

                let totalSucceeded = 0
                let totalFailed = 0

                for (let i = 0; i < batches.length; i++) {

                    const { succeeded, failed } = await processBatch(job.id, batches[i])

                    totalSucceeded += succeeded
                    totalFailed += failed

                    if (i < batches.length - 1) {
                        await delay(DELAY_BETWEEN_BATCHES)
                    }
                }

                await updateImportJobStatus(job.id, "COMPLETED", {
                    deduplicatedCount,
                    batchSize: BATCH_SIZE,
                    totalSucceeded,
                    totalFailed,
                    completedAt: new Date().toISOString(),
                })

            } catch (error) {
                console.error("Import contacts job failed:", error)

                await updateImportJobStatus(job.id, "FAILED", {
                    error: error instanceof Error ? error.message : "Unknown error",
                    failedAt: new Date().toISOString(),
                })

            } finally {
                setTimeout(async () => {
                    await deleteImportJob(job.id)
                }, JOB_CLEANUP_DELAY)
            }
        })()

    return {
        jobId: job.id,
        total: uniqueContacts.length,
        message: deduplicatedCount > 0
            ? `Importação iniciada. ${deduplicatedCount} duplicata(s) removida(s).`
            : "Importação iniciada com sucesso."
    }
}
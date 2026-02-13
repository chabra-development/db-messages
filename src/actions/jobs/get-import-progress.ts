"use server"

/**
 * Busca o progresso de um job de importação
 * Versão simplificada com type assertions corretas
 */

import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export interface ImportProgress {
    id: string
    total: number
    processed: number
    succeeded: number
    failedCount: number
    status: "pending" | "running" | "done" | "error"
    failed: Array<{
        identity: string
        email: string
        reason: string
        timestamp?: Date
    }>
    metadata?: {
        deduplicatedCount?: number
        batchSize?: number
        totalSucceeded?: number
        totalFailed?: number
        startedAt?: string
        completedAt?: string
        error?: string
    }
    createdAt: Date
    startedAt?: Date | null
    completedAt?: Date | null
}

/**
 * Type guard para validar se é um array de failed items
 */
function isFailedItemsArray(value: unknown): value is ImportProgress["failed"] {
    if (!Array.isArray(value)) return false

    return value.every(
        item =>
            typeof item === "object" &&
            item !== null &&
            "identity" in item &&
            "email" in item &&
            "reason" in item &&
            typeof item.identity === "string" &&
            typeof item.email === "string" &&
            typeof item.reason === "string"
    )
}

/**
 * Type guard para validar metadata
 */
function isMetadata(value: unknown): value is ImportProgress["metadata"] {
    if (value === null || value === undefined) return true
    if (typeof value !== "object") return false
    return true
}

export async function getImportProgress(
    jobId: string
): Promise<ImportProgress | null> {
    try {
        const job = await prisma.importJob.findUnique({
            where: { id: jobId },
            select: {
                id: true,
                total: true,
                processed: true,
                succeeded: true,
                failedCount: true,
                status: true,
                failed: true,
                metadata: true,
                createdAt: true,
                startedAt: true,
                completedAt: true,
            },
        })

        if (!job) {
            return null
        }

        // Parse failed com validação
        let failed: ImportProgress["failed"] = []

        if (isFailedItemsArray(job.failed)) {
            failed = job.failed
        } else if (Array.isArray(job.failed)) {
            // Fallback: tenta converter o que for possível
            failed = job.failed
                .filter(item =>
                    typeof item === "object" &&
                    item !== null &&
                    "identity" in item &&
                    "email" in item &&
                    "reason" in item
                )
                .map(item => ({
                    identity: String((item as any).identity),
                    email: String((item as any).email),
                    reason: String((item as any).reason),
                    timestamp: (item as any).timestamp
                        ? new Date((item as any).timestamp)
                        : undefined,
                }))
        }

        // Parse metadata
        let metadata: ImportProgress["metadata"] = undefined

        if (isMetadata(job.metadata) && job.metadata) {
            metadata = job.metadata as ImportProgress["metadata"]
        }

        return {
            id: job.id,
            total: job.total,
            processed: job.processed,
            succeeded: job.succeeded,
            failedCount: job.failedCount,
            status: job.status as "pending" | "running" | "done" | "error",
            failed,
            metadata,
            createdAt: job.createdAt,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
        }
    } catch (error) {
        console.error("Error fetching import progress:", error)
        return null
    }
}
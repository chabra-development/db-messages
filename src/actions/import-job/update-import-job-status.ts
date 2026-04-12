"use server"

import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { ImportJobStatus, Prisma } from "@prisma/client"
import { findImportJobOrThrow } from "./find-import-job-by-id"

/**
 * Atualiza o status do job.
 * Seta automaticamente startedAt, completedAt conforme o status.
 */
export async function updateImportJobStatus(
    id: string,
    status: ImportJobStatus,
    metadata?: Prisma.JsonValue | Prisma.JsonArray
) {

    await findImportJobOrThrow(id)

    const updated = await prisma.importJob.update({
        where: { id },
        data: {
            status,
            ...(status === "RUNNING" && { startedAt: new Date() }),
            ...(status === "COMPLETED" || status === "FAILED"
                ? { completedAt: new Date() }
                : {}),
            ...(metadata && { metadata }),
        },
    })

    await logger({
        level: status === "FAILED" ? "ERROR" : "INFO",
        category: "JOB",
        action: "job.status.changed",
        message: `Job ${id} → ${status}`,
        entityId: id,
        metadata: { status, ...(metadata as Record<string, unknown> | undefined) },
    })

    return updated
}
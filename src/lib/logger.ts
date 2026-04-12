import { LogCategory, LogLevel, Prisma } from "@prisma/client"
import { prisma } from "./prisma"

interface LogOptions {
    level?: LogLevel
    category: LogCategory
    action: string
    message?: string
    entityId?: string
    userId?: string
    metadata?: Record<string, unknown>
}

const CONSOLE_FN: Record<LogLevel, (...args: unknown[]) => void> = {
    INFO: console.log,
    WARN: console.warn,
    ERROR: console.error,
}

export async function logger({
    level = "INFO",
    category,
    action,
    message,
    entityId,
    userId,
    metadata,
}: LogOptions): Promise<void> {
    const timestamp = new Date().toISOString()
    const logFn = CONSOLE_FN[level]

    logFn(`[${timestamp}] [${level}] [${category}] ${action}`, message ?? "", metadata ?? "")

    await prisma.systemLog
        .create({
            data: {
                level,
                category,
                action,
                message,
                entityId,
                userId,
                metadata: metadata as Prisma.InputJsonValue | undefined,
            },
        })
        .catch((err) => {
            console.error("[logger] Falha ao persistir log:", err)
        })
}

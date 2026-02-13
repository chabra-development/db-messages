"use client"

/**
 * Hook para monitorar progresso de importação de atendentes
 */

import { useQuery } from "@tanstack/react-query"
import { getImportProgress } from "@/actions/jobs/get-import-progress"

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
        completedAt?: string
        error?: string
    }
    createdAt: Date
    startedAt?: Date | null
    completedAt?: Date | null
}

interface UseImportProgressOptions {
    jobId: string | null
    enabled?: boolean
    refetchInterval?: number | false
}

export const useImportProgress = ({
    jobId,
    enabled = true,
    refetchInterval = 1000, // Atualiza a cada 1 segundo
}: UseImportProgressOptions) => {
    const query = useQuery<ImportProgress | null>({
        queryKey: ["import-progress", jobId],
        queryFn: () => (jobId ? getImportProgress(jobId) : null),
        enabled: enabled && !!jobId,
        refetchInterval: (query) => {
            // Para de atualizar quando concluído ou com erro
            const data = query.state.data
            if (!data || data.status === "done" || data.status === "error") {
                return false
            }
            return refetchInterval
        },
        staleTime: 0, // Sempre busca dados frescos
    })

    // Calcula porcentagem
    const progress = query.data
        ? Math.round((query.data.processed / query.data.total) * 100)
        : 0

    // Verifica se está completo (acessa do data, não do query)
    const isComplete = query.data?.status === "done"
    const hasError = query.data?.status === "error"
    const isRunning = query.data?.status === "running"
    const isPending = query.data?.status === "pending"

    // Tempo estimado restante (aproximado)
    const estimatedTimeRemaining = (() => {
        if (!query.data || !query.data.startedAt) return null

        const { processed, total, startedAt } = query.data

        if (processed === 0) return null

        const elapsed = Date.now() - new Date(startedAt).getTime()
        const rate = processed / elapsed // itens por ms
        const remaining = total - processed
        const estimatedMs = remaining / rate

        return Math.ceil(estimatedMs / 1000) // retorna em segundos
    })()

    return {
        // Propriedades do React Query (renomeadas para evitar conflito)
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,

        // Propriedades customizadas
        progress,
        isComplete,
        hasError,
        isRunning,
        isPending,
        estimatedTimeRemaining,
        data: query.data,
    }
}

/**
 * Formata tempo restante para exibição
 */
export function formatTimeRemaining(seconds: number | null): string {
    if (seconds === null || seconds <= 0) return ""

    if (seconds < 60) {
        return `${seconds}s`
    }

    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60

    if (minutes < 60) {
        return `${minutes}m ${secs}s`
    }

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    return `${hours}h ${mins}m`
}
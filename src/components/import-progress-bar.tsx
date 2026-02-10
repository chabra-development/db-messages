"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { getImportJob } from "@/actions/jobs/get-import-progress"

type ImportStatus = "pending" | "running" | "done" | "error"

const INITIAL_STATE = {
    processed: 0,
    total: 1,
    status: "pending" as ImportStatus,
}

export const ImportProgressBar = ({ jobId }: { jobId?: string }) => {

    const [processed, setProcessed] = useState(INITIAL_STATE.processed)
    const [total, setTotal] = useState(INITIAL_STATE.total)
    const [status, setStatus] = useState<ImportStatus>(INITIAL_STATE.status)
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        if (!jobId) {
            setVisible(false)
            return
        }

        let cancelled = false

        const interval = setInterval(async () => {
            if (cancelled) return

            const job = await getImportJob(jobId)

            // 🔑 se o job não existe mais → esconde tudo
            if (!job) {
                setVisible(false)
                clearInterval(interval)
                return
            }

            setVisible(true)
            setProcessed(job.processed ?? 0)
            setTotal(job.total || 1)
            setStatus(job.status as ImportStatus)

            if (job.status === "done" || job.status === "error") {
                clearInterval(interval)
            }
        }, 1000)

        return () => {
            cancelled = true
            clearInterval(interval)
        }
    }, [jobId])

    if (!visible) return null

    const percentage = Math.min(
        100,
        Math.round((processed / total) * 100)
    )

    return (
        <div className="space-y-2">
            <Progress value={percentage} />
            <p className="text-sm text-muted-foreground">
                {status === "pending" && "Preparando importação..."}
                {status === "running" && (
                    <>Importando {processed} de {total} ({percentage}%)</>
                )}
                {status === "done" && "Importação concluída"}
                {status === "error" && "Erro durante a importação"}
            </p>
        </div>
    )
}

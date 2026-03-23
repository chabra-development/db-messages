"use client"

import { getStorageStats } from "@/actions/supabase/get-storage-stats"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { FileBox, Loader2 } from "lucide-react"

function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const value = bytes / Math.pow(k, i)
    return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${sizes[i]}`
}

// Limite do plano free do Supabase: 1 GB
const STORAGE_QUOTA_BYTES = 1 * 1024 * 1024 * 1024

const MIMETYPE_LABEL: Record<string, string> = {
    image: "Imagens",
    video: "Vídeos",
    audio: "Áudios",
    application: "Documentos",
    text: "Textos",
    unknown: "Outros",
}

export const StorageStatsQuery = () => {
    
    const { data, isLoading } = useQuery({
        queryKey: ["storage-stats"],
        queryFn: getStorageStats,
        refetchInterval: 60_000,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <Loader2 className="animate-spin size-6 text-muted-foreground" />
            </div>
        )
    }

    if (!data || data.buckets.length === 0) {
        return (
            <CardDescription className="italic">Nenhum bucket encontrado.</CardDescription>
        )
    }

    const totalSize = data.buckets.reduce((acc, b) => acc + b.totalSize, 0)
    const totalFiles = data.buckets.reduce((acc, b) => acc + b.fileCount, 0)
    const usagePercent = Math.min((totalSize / STORAGE_QUOTA_BYTES) * 100, 100)
    const isWarning = usagePercent >= 70
    const isCritical = usagePercent >= 90

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        <strong className="text-foreground">{formatBytes(totalSize)}</strong> de {formatBytes(STORAGE_QUOTA_BYTES)} utilizados
                    </span>
                    <span className={`font-medium ${isCritical ? "text-destructive" : isWarning ? "text-yellow-500" : "text-muted-foreground"}`}>
                        {usagePercent.toFixed(1)}%
                    </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${isCritical ? "bg-destructive" : isWarning ? "bg-yellow-500" : "bg-primary"}`}
                        style={{ width: `${usagePercent}%` }}
                    />
                </div>
                <div className="flex items-center gap-6 text-xs text-muted-foreground pt-0.5">
                    <span><strong className="text-foreground">{data.buckets.length}</strong> bucket{data.buckets.length !== 1 ? "s" : ""}</span>
                    <span><strong className="text-foreground">{totalFiles}</strong> arquivos</span>
                    <span><strong className="text-foreground">{formatBytes(STORAGE_QUOTA_BYTES - totalSize)}</strong> disponível</span>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {data.buckets.map(bucket => (
                    <Card key={bucket.id} className="gap-2 w-full">
                        <CardHeader className="pb-1">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileBox className="size-4 text-muted-foreground" />
                                    {bucket.name}
                                </CardTitle>
                                <div className="flex items-center gap-1.5">
                                    <Badge variant={bucket.public ? "default" : "secondary"}>
                                        {bucket.public ? "Público" : "Privado"}
                                    </Badge>
                                    <Badge variant="outline">{bucket.type}</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{formatBytes(bucket.totalSize)} de {formatBytes(STORAGE_QUOTA_BYTES)}</span>
                                    <span>{((bucket.totalSize / STORAGE_QUOTA_BYTES) * 100).toFixed(2)}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${Math.min((bucket.totalSize / STORAGE_QUOTA_BYTES) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-6 text-sm">
                                <span className="text-muted-foreground">
                                    Arquivos: <strong className="text-foreground">{bucket.fileCount}</strong>
                                </span>
                                <span className="text-muted-foreground">
                                    Tamanho: <strong className="text-foreground">{formatBytes(bucket.totalSize)}</strong>
                                </span>
                            </div>
                            {Object.keys(bucket.byMimetype).length > 0 && (
                                <div className="space-y-1">
                                    {Object.entries(bucket.byMimetype).map(([type, count]) => (
                                        <div key={type} className="space-y-0.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">{MIMETYPE_LABEL[type] ?? type}</span>
                                                <span>{count}</span>
                                            </div>
                                            <div className="h-1 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{ width: bucket.fileCount ? `${(count / bucket.fileCount) * 100}%` : "0%" }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

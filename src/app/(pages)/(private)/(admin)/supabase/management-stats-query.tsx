"use client"

import { getManagementStats } from "@/actions/supabase/get-management-stats"
import { Badge } from "@/components/ui/badge"
import { CardDescription } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react"

const SERVICE_LABEL: Record<string, string> = {
    auth: "Auth",
    db: "Banco de dados",
    "rest-admin": "REST Admin",
    storage: "Storage",
    realtime: "Realtime",
    functions: "Edge Functions",
    pgbouncer: "PgBouncer",
}

const STATUS_ICON = {
    HEALTHY: <CheckCircle2 className="size-4 text-green-500" />,
    UNHEALTHY: <XCircle className="size-4 text-destructive" />,
    COMING_UP: <AlertCircle className="size-4 text-yellow-500" />,
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    HEALTHY: "default",
    UNHEALTHY: "destructive",
    COMING_UP: "outline",
}

export const ManagementStatsQuery = () => {

    const { data, isLoading } = useQuery({
        queryKey: ["management-stats"],
        queryFn: getManagementStats,
        refetchInterval: 60_000,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <Loader2 className="animate-spin size-6 text-muted-foreground" />
            </div>
        )
    }

    if (!data || !data.configured) {
        return (
            <CardDescription className="italic">
                Configure <code className="text-xs bg-muted px-1 py-0.5 rounded">SUPABASE_MANAGEMENT_TOKEN</code> no <code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code> para visualizar estas informações.
                Gere o token em <strong>supabase.com/dashboard/account/tokens</strong>.
            </CardDescription>
        )
    }

    const { project, health } = data

    return (
        <div className="space-y-4">
            {project && (
                <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-muted-foreground">Nome: <strong className="text-foreground">{project.name}</strong></span>
                    <span className="text-muted-foreground">Região: <strong className="text-foreground">{project.region}</strong></span>
                    <span className="text-muted-foreground">
                        Status: <Badge variant={project.status === "ACTIVE_HEALTHY" ? "default" : "destructive"} className="ml-1">
                            {project.status}
                        </Badge>
                    </span>
                </div>
            )}

            {health && health.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                    {health.map(item => (
                        <div
                            key={item.name}
                            className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                        >
                            <span className="text-muted-foreground">{SERVICE_LABEL[item.name] ?? item.name}</span>
                            <div className="flex items-center gap-1.5">
                                {STATUS_ICON[item.status as keyof typeof STATUS_ICON] ?? (
                                    <AlertCircle className="size-4 text-muted-foreground" />
                                )}
                                <Badge variant={STATUS_BADGE[item.status] ?? "outline"} className="text-xs">
                                    {item.status}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

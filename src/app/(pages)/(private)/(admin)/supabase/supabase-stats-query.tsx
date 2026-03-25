"use client"

import { getDatabaseStats } from "@/actions/supabase/get-database-stats"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import {
    ArrowDownLeft,
    ArrowUpRight,
    Hash,
    Loader2,
    MessageSquare,
    Ticket,
    UserRound,
    Users,
} from "lucide-react"
import { Route } from "next"
import Link from "next/link"

const TICKET_STATUS_LABEL: Record<string, string> = {
    Waiting: "Aguardando",
    InAttendance: "Em atendimento",
    ClosedAttendant: "Fechado (atendente)",
    ClosedClient: "Fechado (cliente)",
    ClosedSystem: "Fechado (sistema)",
    Transferred: "Transferido",
}

export const SupabaseStatsQuery = () => {
    
    const { data, isLoading } = useQuery({
        queryKey: ["database-stats"],
        queryFn: getDatabaseStats,
        refetchInterval: 30_000,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin size-8 text-muted-foreground" />
            </div>
        )
    }

    if (!data) return null

    const { counts, messagesByDirection, ticketsByStatus } = data

    const sentCount = (messagesByDirection.find(m => m.direction === "SENT")?._count as { _all: number } | undefined)?._all ?? 0
    const receivedCount = (messagesByDirection.find(m => m.direction === "RECEIVED")?._count as { _all: number } | undefined)?._all ?? 0
    const totalMessages = sentCount + receivedCount

    const statCards = [
        { label: "Contatos", value: counts.contacts, icon: Users, href: "/contacts" },
        { label: "Mensagens", value: counts.messages, icon: MessageSquare, href: null },
        { label: "Tickets", value: counts.tickets, icon: Ticket, href: "/tickets" },
        { label: "Tags", value: counts.tags, icon: Hash, href: "/tags" },
        { label: "Usuários", value: counts.users, icon: UserRound, href: "/attendants" },
    ]

    return (
        <div className="space-y-6 p-1">

            {/* Totais */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {statCards.map(({ label, value, icon: Icon, href }) => (
                    <Card key={label} className={`gap-2 ${href ? "hover:border-primary transition-colors" : ""}`}>
                        <CardHeader className="pb-1">
                            <CardDescription className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5">
                                    <Icon className="size-3.5" />
                                    {label}
                                </span>
                                {href && (
                                    <Link
                                        href={href as Route}
                                        className="hover:text-foreground transition-colors"
                                        title={`Ir para ${label}`}
                                    >
                                        ↗
                                    </Link>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <span className="text-2xl font-bold">{value.toLocaleString("pt-BR")}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Mensagens por direção */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Mensagens por direção</CardTitle>
                        <CardDescription>{totalMessages.toLocaleString("pt-BR")} no total</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1.5">
                                    <ArrowUpRight className="size-4 text-blue-500" />
                                    Enviadas
                                </span>
                                <span className="font-medium">{sentCount.toLocaleString("pt-BR")}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: totalMessages ? `${(sentCount / totalMessages) * 100}%` : "0%" }}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1.5">
                                    <ArrowDownLeft className="size-4 text-green-500" />
                                    Recebidas
                                </span>
                                <span className="font-medium">{receivedCount.toLocaleString("pt-BR")}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all"
                                    style={{ width: totalMessages ? `${(receivedCount / totalMessages) * 100}%` : "0%" }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tickets por status */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Tickets por status</CardTitle>
                                <CardDescription>{counts.tickets.toLocaleString("pt-BR")} no total</CardDescription>
                            </div>
                            <Link href={"/tickets" as Route} className="text-muted-foreground hover:text-foreground transition-colors text-sm" title="Ir para Tickets">
                                ↗
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {ticketsByStatus.map(({ status, _count }) => {
                            const count = (_count as { _all: number })._all
                            return (
                                <div key={status} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>{TICKET_STATUS_LABEL[status] ?? status}</span>
                                        <span className="font-medium">{count.toLocaleString("pt-BR")}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: counts.tickets ? `${(count / counts.tickets) * 100}%` : "0%" }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

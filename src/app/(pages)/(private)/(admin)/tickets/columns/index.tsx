import { Badge } from "@/components/ui/badge"
import { extractNameFromBlipIdentity } from "@/functions/extract-name-from-blip-identity"
import { TicketStatus } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export type TicketRow = {
    id: string
    blipId: string
    sequentialId: number
    status: TicketStatus
    team: string
    customerIdentity: string
    agentIdentity: string | null
    openDate: Date | null
    closeDate: Date | null
    messageCount: number
    closed: boolean
    closedBy: string | null
}

const STATUS_CONFIG: Record<
    TicketStatus,
    { label: string; variant: "secondary" | "outline" | "destructive" | "default"; className?: string }
> = {
    Waiting: { label: "Aguardando", variant: "outline", className: "border-yellow-500 text-yellow-600 dark:text-yellow-400" },
    InAttendance: { label: "Em atendimento", variant: "default", className: "bg-blue-500 text-white" },
    ClosedAttendant: { label: "Fechado (atendente)", variant: "secondary", className: "text-green-600 dark:text-green-400" },
    ClosedClient: { label: "Fechado (cliente)", variant: "secondary", className: "text-green-600 dark:text-green-400" },
    ClosedSystem: { label: "Fechado (sistema)", variant: "secondary" },
    Transferred: { label: "Transferido", variant: "outline", className: "border-purple-500 text-purple-600 dark:text-purple-400" },
}

export const columns: ColumnDef<TicketRow>[] = [
    {
        accessorKey: "sequentialId",
        header: "#",
        cell: ({ row }) => (
            <span className="font-mono text-xs text-muted-foreground">
                #{row.original.sequentialId}
            </span>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const config = STATUS_CONFIG[row.original.status]
            return (
                <Badge variant={config.variant} className={config.className}>
                    {config.label}
                </Badge>
            )
        },
    },
    {
        accessorKey: "team",
        header: "Fila",
        cell: ({ row }) => (
            <Badge variant="outline">
                {row.original.team === "DIRECT_TRANSFER"
                    ? "Transferência direta"
                    : row.original.team}
            </Badge>
        ),
    },
    {
        accessorKey: "customerIdentity",
        header: "Contato",
        cell: ({ row }) => (
            <span className="text-sm">
                {extractNameFromBlipIdentity(row.original.customerIdentity)}
            </span>
        ),
    },
    {
        accessorKey: "agentIdentity",
        header: "Atendente",
        cell: ({ row }) =>
            row.original.agentIdentity ? (
                <span className="text-sm">
                    {extractNameFromBlipIdentity(row.original.agentIdentity)}
                </span>
            ) : (
                <span className="text-muted-foreground text-xs">—</span>
            ),
    },
    {
        accessorKey: "openDate",
        header: "Aberto em",
        cell: ({ row }) =>
            row.original.openDate ? (
                <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                    {format(new Date(row.original.openDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
            ) : (
                <span className="text-muted-foreground text-xs">—</span>
            ),
    },
    {
        accessorKey: "closeDate",
        header: "Fechado em",
        cell: ({ row }) =>
            row.original.closeDate ? (
                <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                    {format(new Date(row.original.closeDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
            ) : (
                <span className="text-muted-foreground text-xs">—</span>
            ),
    },
    {
        accessorKey: "messageCount",
        header: "Mensagens",
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
                {row.original.messageCount}
            </span>
        ),
    },
]

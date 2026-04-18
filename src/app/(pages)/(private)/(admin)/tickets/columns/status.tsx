import { Badge } from "@/components/ui/badge"
import { TicketStatus } from "@prisma/client"
import type { ColumnDef } from "@tanstack/react-table"
import type { TicketRow } from "./types"

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

export const statusColumn: ColumnDef<TicketRow> = {
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
}

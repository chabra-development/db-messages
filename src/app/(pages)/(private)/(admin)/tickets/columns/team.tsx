import { Badge } from "@/components/ui/badge"
import type { ColumnDef } from "@tanstack/react-table"
import type { TicketRow } from "./types"

export const teamColumn: ColumnDef<TicketRow> = {
    accessorKey: "team",
    header: "Fila",
    cell: ({ row }) => (
        <Badge variant="outline">
            {row.original.team === "DIRECT_TRANSFER"
                ? "Transferência direta"
                : row.original.team}
        </Badge>
    ),
}

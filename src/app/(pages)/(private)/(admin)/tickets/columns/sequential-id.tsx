import type { TicketRow } from "./types"
import type { ColumnDef } from "@tanstack/react-table"

export const sequentialIdColumn: ColumnDef<TicketRow> = {
    accessorKey: "sequentialId",
    header: "#",
    cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
            #{row.original.sequentialId}
        </span>
    ),
}

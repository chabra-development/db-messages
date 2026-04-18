import { TicketActionsMenu } from "@/app/(pages)/(private)/(admin)/tickets/ticket-actions-menu"
import type { ColumnDef } from "@tanstack/react-table"
import type { TicketRow } from "./types"

export const actionsColumn: ColumnDef<TicketRow> = {
    id: "actions",
    header: "",
    cell: ({ row }) => <TicketActionsMenu ticket={row.original} />,
}

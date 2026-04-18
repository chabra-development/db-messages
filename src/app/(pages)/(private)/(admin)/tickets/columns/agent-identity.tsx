import { extractNameFromBlipIdentity } from "@/functions/extract-name-from-blip-identity"
import type { ColumnDef } from "@tanstack/react-table"
import type { TicketRow } from "./types"

export const agentIdentityColumn: ColumnDef<TicketRow> = {
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
}

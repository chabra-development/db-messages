import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { TicketRow } from "./types"

export const closeDateColumn: ColumnDef<TicketRow> = {
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
}

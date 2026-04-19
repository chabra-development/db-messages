import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TicketRow } from "./types";

export const openDateColumn: ColumnDef<TicketRow> = {
  accessorKey: "openDate",
  header: "Aberto em",
  cell: ({ row }) =>
    row.original.openDate ? (
      <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
        {format(new Date(row.original.openDate), "dd/MM/yyyy HH:mm", {
          locale: ptBR,
        })}
      </span>
    ) : (
      <span className="text-muted-foreground text-xs">—</span>
    ),
};

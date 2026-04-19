import type { ColumnDef } from "@tanstack/react-table";
import type { TicketRow } from "./types";

export const messageCountColumn: ColumnDef<TicketRow> = {
  accessorKey: "messageCount",
  header: "Mensagens",
  cell: ({ row }) => (
    <span className="text-sm text-muted-foreground">
      {row.original.messageCount}
    </span>
  ),
};

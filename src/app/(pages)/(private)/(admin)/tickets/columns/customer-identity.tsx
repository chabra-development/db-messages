import { extractNameFromBlipIdentity } from "@/functions/extract-name-from-blip-identity";
import type { ColumnDef } from "@tanstack/react-table";
import type { TicketRow } from "./types";

export const customerIdentityColumn: ColumnDef<TicketRow> = {
  accessorKey: "customerIdentity",
  header: "Contato",
  cell: ({ row }) => (
    <span className="text-sm">
      {extractNameFromBlipIdentity(row.original.customerIdentity)}
    </span>
  ),
};

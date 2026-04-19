import { Badge } from "@/components/ui/badge";
import { SystemLog } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export type SystemLogRow = Pick<
  SystemLog,
  | "id"
  | "level"
  | "category"
  | "action"
  | "message"
  | "entityId"
  | "userId"
  | "metadata"
  | "createdAt"
>;

const LEVEL_VARIANT: Record<
  SystemLog["level"],
  {
    variant: "secondary" | "destructive" | "outline";
    label: string;
    className?: string;
  }
> = {
  INFO: { variant: "secondary", label: "INFO" },
  WARN: {
    variant: "outline",
    label: "WARN",
    className: "border-yellow-500 text-yellow-600 dark:text-yellow-400",
  },
  ERROR: { variant: "destructive", label: "ERROR" },
};

const CATEGORY_LABEL: Record<SystemLog["category"], string> = {
  IMPORT: "Import",
  JOB: "Job",
  USER_MANAGEMENT: "Usuário",
  AUTH: "Auth",
  SYSTEM: "Sistema",
};

export const columns: ColumnDef<SystemLogRow>[] = [
  {
    accessorKey: "createdAt",
    header: "Data/Hora",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
          {date.toLocaleDateString("pt-BR")} {date.toLocaleTimeString("pt-BR")}
        </span>
      );
    },
  },
  {
    accessorKey: "level",
    header: "Nível",
    cell: ({ row }) => {
      const { variant, label, className } = LEVEL_VARIANT[row.original.level];
      return (
        <Badge variant={variant} className={className}>
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row }) => (
      <Badge variant="outline">{CATEGORY_LABEL[row.original.category]}</Badge>
    ),
  },
  {
    accessorKey: "action",
    header: "Ação",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.action}</span>
    ),
  },
  {
    accessorKey: "message",
    header: "Mensagem",
    cell: ({ row }) =>
      row.original.message ? (
        <span className="text-sm text-muted-foreground max-w-xs truncate block">
          {row.original.message}
        </span>
      ) : null,
  },
  {
    accessorKey: "entityId",
    header: "Entidade",
    cell: ({ row }) =>
      row.original.entityId ? (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.entityId.slice(0, 8)}…
        </span>
      ) : null,
  },
  {
    accessorKey: "metadata",
    header: "Detalhes",
    cell: ({ row }) => {
      const meta = row.original.metadata;
      if (!meta) return null;
      return (
        <details className="cursor-pointer">
          <summary className="text-xs text-muted-foreground select-none">
            ver
          </summary>
          <pre className="mt-1 text-xs bg-muted rounded p-2 max-w-xs overflow-auto whitespace-pre-wrap break-all">
            {JSON.stringify(meta, null, 2)}
          </pre>
        </details>
      );
    },
  },
];

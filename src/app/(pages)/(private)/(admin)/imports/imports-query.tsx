"use client";

import { findManyImportLogs } from "@/actions/import-logs/create-import-log";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";

const TYPES = [
  { value: "all", label: "Todos os tipos" },
  { value: "CONTACTS", label: "Contatos" },
  { value: "TICKETS", label: "Tickets" },
  { value: "TICKET_MESSAGES", label: "Mensagens de Ticket" },
  { value: "MESSAGES", label: "Mensagens" },
  { value: "ATTENDANTS", label: "Atendentes" },
] as const;

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  CONTACTS: {
    label: "Contatos",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  TICKETS: {
    label: "Tickets",
    className: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  TICKET_MESSAGES: {
    label: "Msgs. Ticket",
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  MESSAGES: {
    label: "Mensagens",
    className: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  },
  ATTENDANTS: {
    label: "Atendentes",
    className: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  },
};

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

function SuccessBadge({
  total,
  succeeded,
}: {
  total: number;
  succeeded: number;
}) {
  if (total === 0) return <Badge variant="outline">—</Badge>;
  const pct = Math.round((succeeded / total) * 100);
  if (pct >= 95)
    return (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
        {pct}%
      </Badge>
    );
  if (pct >= 70)
    return (
      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
        {pct}%
      </Badge>
    );
  return <Badge variant="destructive">{pct}%</Badge>;
}

export function ImportHistoryTableContainer() {
  const [take, setTake] = useQueryState("take", parseAsInteger.withDefault(25));
  const [skip, setSkip] = useQueryState("skip", parseAsInteger.withDefault(0));
  const [type, setType] = useQueryState(
    "type",
    parseAsString.withDefault("all"),
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["import-logs", take, skip, type],
    queryFn: () =>
      findManyImportLogs({
        type: type as any,
        take,
        skip,
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const logs = data?.data ?? [];
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v);
              setSkip(0);
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  <span className="flex items-center gap-2">
                    {value !== "all" && (
                      <span
                        className={`inline-block size-2 rounded-full ${
                          value === "CONTACTS"
                            ? "bg-blue-500"
                            : value === "TICKETS"
                              ? "bg-purple-500"
                              : value === "TICKET_MESSAGES"
                                ? "bg-orange-500"
                                : value === "MESSAGES"
                                  ? "bg-teal-500"
                                  : "bg-pink-500"
                        }`}
                      />
                    )}
                    {label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(take)}
            onValueChange={(v) => {
              setTake(Number(v));
              setSkip(0);
            }}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Sucesso</TableHead>
              <TableHead className="text-right">Erros</TableHead>
              <TableHead className="text-right">Taxa</TableHead>
              <TableHead className="text-right">Duração</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  Carregando...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhuma importação registrada.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge className={TYPE_CONFIG[log.type]?.className ?? ""}>
                      {TYPE_CONFIG[log.type]?.label ?? log.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {log.total.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {log.succeeded.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right font-mono text-destructive">
                    {log.failed.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <SuccessBadge total={log.total} succeeded={log.succeeded} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatDuration(log.duration)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total.toLocaleString("pt-BR")} registro(s)</span>
        <div className="flex items-center gap-2">
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={skip === 0 || isFetching}
            onClick={() => setSkip(Math.max(0, skip - take))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage >= totalPages || isFetching}
            onClick={() => setSkip(skip + take)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

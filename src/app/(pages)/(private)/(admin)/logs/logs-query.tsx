"use client";

import { findManySystemLogs } from "@/actions/system-logs/find-many-system-logs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { SystemLogsDataTable } from "./data-table";

const LEVELS = [
  { value: "all", label: "Todos os níveis" },
  { value: "INFO", label: "INFO" },
  { value: "WARN", label: "WARN" },
  { value: "ERROR", label: "ERROR" },
] as const;

const CATEGORIES = [
  { value: "all", label: "Todas as categorias" },
  { value: "IMPORT", label: "Import" },
  { value: "JOB", label: "Job" },
  { value: "USER_MANAGEMENT", label: "Usuário" },
  { value: "AUTH", label: "Auth" },
  { value: "SYSTEM", label: "Sistema" },
] as const;

export function SystemLogsTableContainer() {
  const [take, setTake] = useQueryState("take", parseAsInteger.withDefault(50));
  const [skip, setSkip] = useQueryState("skip", parseAsInteger.withDefault(0));
  const [level, setLevel] = useQueryState(
    "level",
    parseAsString.withDefault("all"),
  );
  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withDefault("all"),
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["system-logs", take, skip, level, category],
    queryFn: () =>
      findManySystemLogs({
        take,
        skip,
        level: level as "all" | "INFO" | "WARN" | "ERROR",
        category: category as
          | "all"
          | "IMPORT"
          | "JOB"
          | "USER_MANAGEMENT"
          | "AUTH"
          | "SYSTEM",
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const logs = data?.data ?? [];
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? 1;

  const hasFilters = level !== "all" || category !== "all";

  function handlePageSize(value: string) {
    setTake(Number(value));
    setSkip(0);
  }

  function handlePreviousPage() {
    setSkip(Math.max(0, skip - take));
  }

  function handleNextPage() {
    setSkip(skip + take);
  }

  function handleClearFilters() {
    setLevel(null);
    setCategory(null);
    setSkip(0);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select
          value={level}
          onValueChange={(v) => {
            setLevel(v);
            setSkip(0);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Nível" />
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setSkip(0);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-muted-foreground"
          >
            <X className="mr-1 size-4" />
            Limpar
          </Button>
        )}
      </div>

      <SystemLogsDataTable
        data={logs}
        total={total}
        totalPages={totalPages}
        currentPage={currentPage}
        isLoading={isLoading}
        isFetching={isFetching}
        take={take}
        skip={skip}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        onPageSize={handlePageSize}
      />
    </div>
  );
}

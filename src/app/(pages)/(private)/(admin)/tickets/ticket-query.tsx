"use client"

import { findManyTickets } from "@/actions/tickets/find-many-tickets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TicketStatus } from "@prisma/client"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Search, X } from "lucide-react"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { useEffect, useState } from "react"
import { TicketsDataTable } from "./data-table"

const STATUS_OPTIONS = [
    { value: "all", label: "Todos os status" },
    { value: "Waiting", label: "Aguardando" },
    { value: "InAttendance", label: "Em atendimento" },
    { value: "ClosedAttendant", label: "Fechado (atendente)" },
    { value: "ClosedClient", label: "Fechado (cliente)" },
    { value: "ClosedSystem", label: "Fechado (sistema)" },
    { value: "Transferred", label: "Transferido" },
] as const

export function TicketsTableContainer() {
    
    const [take, setTake] = useQueryState("take", parseAsInteger.withDefault(50))
    const [skip, setSkip] = useQueryState("skip", parseAsInteger.withDefault(0))
    const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all"))
    const [team, setTeam] = useQueryState("team", parseAsString.withDefault("all"))

    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useQueryState("search", parseAsString.withDefault(""))

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search || null)
            setSkip(0)
        }, 800)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        if (debouncedSearch) setSearch(debouncedSearch)
    }, [])

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ["find-many-tickets", take, skip, debouncedSearch, status, team],
        queryFn: () =>
            findManyTickets({
                take,
                skip,
                search: debouncedSearch || null,
                status: status !== "all" ? (status as TicketStatus) : "all",
                team: team !== "all" ? team : null,
            }),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 30,
        refetchOnWindowFocus: false,
    })

    const tickets = data?.data ?? []
    const total = data?.count ?? 0
    const totalPages = data?.totalPages ?? 1
    const currentPage = data?.page ?? 1

    const allTeams = Array.from(new Set(tickets.map((t) => t.team))).sort()

    const hasFilters = search !== "" || status !== "all" || team !== "all"

    function handlePageSize(value: string) {
        setTake(Number(value))
        setSkip(0)
    }

    function handlePreviousPage() {
        setSkip(Math.max(0, skip - take))
    }

    function handleNextPage() {
        setSkip(skip + take)
    }

    function handleClearFilters() {
        setSearch("")
        setDebouncedSearch(null)
        setStatus(null)
        setTeam(null)
        setSkip(0)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por contato ou atendente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>

                <Select value={status} onValueChange={(v) => { setStatus(v); setSkip(0) }}>
                    <SelectTrigger className="w-52">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={team} onValueChange={(v) => { setTeam(v); setSkip(0) }}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Fila" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as filas</SelectItem>
                        {allTeams.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t === "DIRECT_TRANSFER" ? "Transferência direta" : t}
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

            <TicketsDataTable
                data={tickets}
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
    )
}

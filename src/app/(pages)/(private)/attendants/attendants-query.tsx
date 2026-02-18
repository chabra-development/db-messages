"use client"

import {
    ImportAttendantsForm
} from "@/components/forms/form-import-attendants/import-attendants-form"
import { Pagination } from "@/components/pagination"
import { SearchInput } from "@/components/seach-input"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardAction,
    CardContent,
    CardFooter,
    CardHeader
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Filter } from "lucide-react"
import { AttendantCard } from "./attendant-card"
import { AttendantsQueryLoading } from "./attendants-query-loading"
import { UseAttendantsQuery } from "./use-attendants"

export const AttendantsQuery = () => {

    const useAttendantsQuery = UseAttendantsQuery()

    if (!useAttendantsQuery) {
        return (
            <AttendantsQueryLoading />
        )
    }

    const {
        search,
        setSearch,
        uniqueTeams,
        selectedTeams,
        toggleTeam,
        filteredAttendants,
        role,
        term,
        hasTeamFilter,
        page,
        take,
        totalPages,
        count
    } = useAttendantsQuery

    return (
        <Card className="flex-1 border-none rounded-none gap-0">
            <CardHeader className="border-b py-4">
                <div className="flex flex-col gap-3 min-w-0">
                    <SearchInput
                        placeholder="Pesquisar atendente..."
                        className="w-2/3"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {uniqueTeams.length > 0 && (
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="teams-filter">
                                <AccordionTrigger
                                    className="w-2/3 px-4 flex-none"
                                >
                                    <div className="flex gap-2 items-center">
                                        <Filter className="size-4" />
                                        Filtrar por lista
                                    </div>
                                    {/* <ChevronDown /> */}
                                    {selectedTeams.size > 0 && (
                                        <span className="ml-2 text-muted-foreground">
                                            ({selectedTeams.size} selecionada
                                            {selectedTeams.size === 1 ? "" : "s"})
                                        </span>
                                    )}
                                </AccordionTrigger>
                                <AccordionContent className="pt-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {uniqueTeams.map((team) => (
                                            <Badge
                                                key={team}
                                                variant={selectedTeams.has(team) ? "default" : "secondary"}
                                                className="cursor-pointer px-3 py-1.5 rounded-md transition-colors hover:opacity-90"
                                                onClick={() => toggleTeam(team)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault()
                                                        toggleTeam(team)
                                                    }
                                                }}
                                            >
                                                {team}
                                            </Badge>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}
                </div>
                {
                    role === "ADMIN" && (
                        <CardAction>
                            <ImportAttendantsForm />
                        </CardAction>
                    )
                }
            </CardHeader>
            <ScrollArea className="min-h-0 flex-1 py-6">
                <CardContent className="grid grid-cols-2 gap-2 space-y-2 px-2">
                    {filteredAttendants.length === 0 ? (
                        <p className="col-span-2 text-center text-muted-foreground py-8">
                            {term || hasTeamFilter
                                ? "Nenhum atendente encontrado para os filtros aplicados."
                                : "Nenhum atendente cadastrado."}
                        </p>
                    ) : (
                        filteredAttendants.map((attendant, index) => (
                            <AttendantCard
                                key={attendant.id}
                                attendant={attendant}
                                index={index}
                            />
                        ))
                    )}
                </CardContent>
            </ScrollArea>
            <CardFooter className="border-t">
                <Pagination
                    paginationData={{ page, take, totalPages, count }}
                    countLabel="Total de atendentes"
                />
            </CardFooter>
        </Card>
    )
}  
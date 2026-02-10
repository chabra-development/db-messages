"use client"

import { findManyAttendants } from "@/actions/attendants/find-many-attendants"
import {
    ImportAttendantsForm
} from "@/components/forms/form-import-attendants/import-attendants-form"
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
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Ellipsis, Filter } from "lucide-react"
import { useState } from "react"
import { AttendantsQueryLoading } from "./attendants-query-loading"
import { authClient } from "@/lib/auth-client"
import { User } from "@prisma/client"
import { Button } from "@/components/ui/button"

const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.05, duration: 0.25 },
    }),
}

export const AttendantsQuery = () => {

    const [search, setSearch] = useState("")
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set())

    const { data } = authClient.useSession()

    const {
        data: attendants,
        isLoading
    } = useQuery({
        queryKey: ["find-many-attendants"],
        queryFn: () => findManyAttendants()
    })

    if (isLoading || !attendants || !data) {
        return (
            <AttendantsQueryLoading />
        )
    }

    const uniqueTeams = [
        ...new Set(attendants.flatMap((a) => a.teams ?? [])),
    ].sort()

    const term = search.trim().toLowerCase()
    const hasTeamFilter = selectedTeams.size > 0

    const filteredAttendants = attendants.filter(({ name, email, teams = [] }) => {
        const matchesSearch =
            !term ||
            name.toLowerCase().includes(term) ||
            email.toLowerCase().includes(term) ||
            teams.some((t) => t.toLowerCase().includes(term))

        const matchesTeams = !hasTeamFilter || teams.some((t) => selectedTeams.has(t))

        return matchesSearch && matchesTeams
    })

    const toggleTeam = (team: string) => {
        setSelectedTeams((prev) => {

            const next = new Set(prev)

            if (next.has(team)) next.delete(team)
            else next.add(team)

            return next
        })
    }

    const { role } = data.user as User

    console.log(role)

    return (
        <Card className="flex-1 border-none rounded-none">
            <CardHeader className="border-b py-4">
                <div className="flex flex-col gap-3 min-w-0">
                    <SearchInput
                        placeholder="Pesquisar atendente..."
                        classNameDiv="w-2/3"
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
            <ScrollArea className="min-h-0 flex-1">
                <CardContent className="grid grid-cols-2 gap-2 space-y-2 px-2">
                    {filteredAttendants.length === 0 ? (
                        <p className="col-span-2 text-center text-muted-foreground py-8">
                            {term || hasTeamFilter
                                ? "Nenhum atendente encontrado para os filtros aplicados."
                                : "Nenhum atendente cadastrado."}
                        </p>
                    ) : (
                        filteredAttendants.map(({
                            id, email, name, teams = []
                        }, index) => (
                            <motion.div
                                key={id}
                                layout
                                initial="hidden"
                                animate="visible"
                                custom={index}
                                variants={cardVariants}
                            >
                                <Card className="h-full justify-between">
                                    <CardHeader>
                                        <CardTitle className="capitalize text-xl">
                                            {name}
                                        </CardTitle>
                                        <CardDescription>
                                            {email}
                                        </CardDescription>
                                        <CardAction>
                                            <Button variant={"ghost"}>
                                                <Ellipsis />
                                            </Button>
                                        </CardAction>
                                    </CardHeader>
                                    <ScrollArea className={cn(
                                        teams.length > 3 ? "h-36" : "h-20"
                                    )}>
                                        <CardFooter className="flex flex-wrap h-full gap-2.5 items-start px-4 py-4 mx-6 border rounded-lg text-xs drop-shadow-2xl">
                                            {teams.length === 0 ? (
                                                <Badge
                                                    variant={"secondary"}
                                                    className="w-fit px-3 py-2 rounded-md text-center whitespace-normal"
                                                >
                                                    Sem listas adicionadas
                                                </Badge>
                                            ) : (
                                                teams.map((team, index) => (
                                                    <Badge
                                                        key={`${id}-${team}-${index}`}
                                                        className="w-fit px-3 py-2 rounded-md text-center whitespace-normal"
                                                    >
                                                        {team}
                                                    </Badge>
                                                ))
                                            )}
                                        </CardFooter>
                                    </ScrollArea>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </CardContent>
            </ScrollArea>
        </Card >
    )
}  
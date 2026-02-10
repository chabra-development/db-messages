"use client"

import { findManyAttendants } from "@/actions/attendants/find-many-attendants"
import { SearchInput } from "@/components/seach-input"
import {
    ImportAttendantsForm
} from "@/components/forms/form-import-attendants/import-attendants-form"
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useQuery } from "@tanstack/react-query"
import { AttendantsQueryLoading } from "./attendants-query-loading"

export const AttendantsQuery = () => {

    const {
        data: attendants,
        isLoading
    } = useQuery({
        queryKey: ["find-many-attendants"],
        queryFn: () => findManyAttendants()
    })

    if (isLoading || !attendants) {
        return (
            <AttendantsQueryLoading />
        )
    }

    return (
        <Card className="flex-1 border-none rounded-none">
            <CardHeader className="border-b py-4">
                <SearchInput
                    placeholder="Pesquisar atendente..."
                    classNameDiv="w-2/3"
                />
                <CardAction>
                    <ImportAttendantsForm />
                </CardAction>
            </CardHeader>
            <ScrollArea className="flex-1 min-h-200">
                <ScrollBar />
                <CardContent className="grid grid-cols-2 gap-2 space-y-2 px-2">
                    {
                        attendants.map(({ id, email, name, teams = [] }) => (
                            <Card
                                key={id}
                                className="min-h-40 overflow-hidden"
                            >
                                <CardHeader>
                                    <CardTitle className="capitalize text-xl">
                                        {name}
                                    </CardTitle>
                                    <CardDescription>
                                        {email}
                                    </CardDescription>
                                </CardHeader>
                                <ScrollArea className="max-h-52">
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
                        ))
                    }
                </CardContent>
            </ScrollArea>
        </Card >
    )
}  
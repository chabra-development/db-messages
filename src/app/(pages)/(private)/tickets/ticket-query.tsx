"use client"

import { findManyTickets } from "@/actions/blip/find-many-tickets"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useQuery } from "@tanstack/react-query"
import { TicketsQueryLoading } from "./ticket-query-loading"
import { TicketInfoSheet } from "./ticket-info-sheet"
import { Pagination } from "@/components/pagination"
import { useSearchParams } from "next/navigation"

export const TicketsQuery = () => {

    const searchParams = useSearchParams()

    const take = searchParams.get("take")
    const skip = searchParams.get("skip")

    const {
        data: tickets,
        isLoading
    } = useQuery({
        queryKey: ["find-many-tickets", take, skip],
        queryFn: () => findManyTickets()
    })

    if (isLoading || !tickets) {
        return (
            <TicketsQueryLoading />
        )
    }

    const { resource: { items = [] } } = tickets

    return (
        <Card className="flex-1 border-none rounded-none">
            <ScrollArea className="flex-1 min-h-200">
                <ScrollBar />
                <CardContent className="grid grid-cols-2 gap-2 space-y-2 px-2">
                    {
                        items.map((ticket, index) => (
                            <TicketInfoSheet
                                key={`${ticket.id}-${index}`}
                                ticket={ticket}
                            />
                        ))
                    }
                </CardContent>
            </ScrollArea>
            <CardFooter>
                <Pagination
                    paginationData={{
                        count: 0, page: 1, take: "10", totalPages: 1
                    }}
                    countLabel="Total de tickets"
                    
                />
            </CardFooter>
        </Card>
    )
}  
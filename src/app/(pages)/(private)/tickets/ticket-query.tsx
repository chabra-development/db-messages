"use client"

import { findManyTickets } from "@/actions/blip/find-many-tickets"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useQuery } from "@tanstack/react-query"
import { TicketsQueryItem } from "@/components/ticket/ticket-query-item"
import { TicketsQueryLoading } from "./ticket-query-loading"

export const TicketsQuery = () => {

    const {
        data: tickets,
        isLoading
    } = useQuery({
        queryKey: ["find-many-tickets"],
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
                            <TicketsQueryItem
                                key={`${ticket.id}-${index}`}
                                ticket={ticket}
                            />
                        ))
                    }
                </CardContent>
            </ScrollArea>
        </Card>
    )
}  
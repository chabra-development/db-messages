'use client'

import { searchMessagesByContact } from "@/actions/messages/search-messages-by-contact"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { DateRange } from "react-day-picker"
import { useDebounce } from "./use-debounce"

export function useSearchMessages(contactId: string) {

    const [query, setQuery] = useState("")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const debouncedQuery = useDebounce(query, 400)

    const result = useQuery({
        queryKey: ["search-messages", contactId, debouncedQuery, dateRange?.from, dateRange?.to],
        queryFn: () => searchMessagesByContact({
            contactId,
            query: debouncedQuery,
            from: dateRange?.from,
            to: dateRange?.to,
        }),
        enabled: !!debouncedQuery.trim(),
    })

    return { ...result, query, setQuery, debouncedQuery, dateRange, setDateRange }
}

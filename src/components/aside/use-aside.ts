import { findManyContacts } from "@/actions/blip/find-many-contacts"
import {
    normalizeWhatsAppIdentify
} from "@/functions/normalize-whatsapp-identify"
import { useDebounce } from "@/hooks/use-debounce"
import { LimeContact } from "@/types/lime-collection-response.types"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

export function UseAside() {

    const [searchQuery, setSearchQuery] = useState("")
    const [activeContactId, setActiveContactId] = useState<string | null>(null)

    // Debounce da pesquisa para melhor performance
    const debouncedSearch = useDebounce(searchQuery, 500)

    // Indica se está digitando (diferença entre query e debounced)
    const isSearching = searchQuery !== debouncedSearch

    const {
        data,
        isLoading,
        error,
        refetch,
        isFetching
    } = useQuery({
        queryKey: ["find-many-contacts"],
        queryFn: () => findManyContacts(),
    })

    // Filtra e busca contatos (memoizado para performance)
    const filteredContacts = (() => {
        
        if (!data) return []

        const uniqueItems = data.resource.items

        if (!debouncedSearch.trim()) {
            return uniqueItems
        }

        const query = debouncedSearch.toLowerCase().trim()

        return uniqueItems.filter((contact) => {
            const name = contact.name?.toLowerCase() ?? ""
            const identity = normalizeWhatsAppIdentify(contact.identity).toLowerCase()
            const extras = contact.extras
                ? JSON.stringify(contact.extras).toLowerCase()
                : ""

            return (
                name.includes(query) ||
                identity.includes(query) ||
                extras.includes(query)
            )
        })
    })()


    // Handler para limpar pesquisa
    const handleClearSearch = () => setSearchQuery("")

    // Handler para selecionar contato
    const handleSelectContact = (contact: LimeContact) => setActiveContactId(contact.identity)

    if (!data || isLoading) return

    const totalContacts = data.resource.total
    const filteredCount = filteredContacts.length
    const hasSearch = debouncedSearch.trim().length > 0

    return {
        error,
        refetch,
        searchQuery,
        setSearchQuery,
        handleClearSearch,
        isSearching,
        hasSearch,
        filteredCount,
        totalContacts,
        isFetching,
        filteredContacts,
        debouncedSearch,
        handleSelectContact,
        activeContactId
    }
}
"use client"

import { findManyContacts } from "@/actions/blip/find-many-contacts"
import { SearchInput } from "@/components/seach-input"
import { toast } from "@/components/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    normalizeWhatsAppIdentify
} from "@/functions/normalize-whatsapp-identify"
import { useDebounce } from "@/hooks/use-debounce"
import { LimeContact } from "@/types/lime-collection-response.types"
import { useQuery } from "@tanstack/react-query"
import { Contact, RefreshCw } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { AsideEmptyState } from "./aside-empty-state"
import { AsideLoading } from "./aside-loading"
import { ContactCardItem } from "./contact-card-item"

export const Aside = () => {

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
        staleTime: 1000 * 60 * 5, // 5 minutos
        refetchOnWindowFocus: false,
    })

    // Filtra e busca contatos (memoizado para performance)
    const filteredContacts = useMemo(() => {
        if (!data) return []

        const uniqueItems = data.resource.items

        if (!debouncedSearch.trim()) {
            return uniqueItems
        }

        const query = debouncedSearch.toLowerCase().trim()

        return uniqueItems.filter((contact) => {
            const name = contact.name?.toLowerCase() || ""
            const identity = normalizeWhatsAppIdentify(contact.identity).toLowerCase()
            const extras = contact.extras ? JSON.stringify(contact.extras).toLowerCase() : ""

            return (
                name.includes(query) ||
                identity.includes(query) ||
                extras.includes(query)
            )
        })
    }, [data, debouncedSearch])

    // Handler para limpar pesquisa
    const handleClearSearch = () => setSearchQuery("")

    // Handler para selecionar contato
    const handleSelectContact = (contact: LimeContact) => setActiveContactId(contact.identity)

    // Loading inicial
    if (isLoading || !data) {
        return <AsideLoading />
    }

    // Error state com toast
    if (error) {
        toast({
            title: error.name,
            duration: Infinity,
            description: error.message,
            variant: "destructive",
            action: {
                label: "Tentar novamente",
                onClick: () => refetch()
            }
        })
        return null
    }

    const totalContacts = data.resource.total
    const filteredCount = filteredContacts.length
    const hasSearch = debouncedSearch.trim().length > 0

    return (
        <Card className="size-full rounded-none border-0 shadow-none">
            {/* Header com busca */}
            <CardHeader className="space-y-4 pb-4">
                <SearchInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClear={handleClearSearch}
                    placeholder="Buscar contatos..."
                    isLoading={isSearching}
                />
            </CardHeader>

            {/* Área com scroll */}
            <ScrollArea className="flex-1 min-h-50">
                <ScrollBar className="w-2" />

                {/* Header com título e badge */}
                <CardHeader className="pt-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Contact className="size-6" />
                            Contatos
                            <Badge variant="secondary" className="h-fit">
                                {hasSearch
                                    ? `${filteredCount}/${totalContacts}`
                                    : totalContacts
                                }
                            </Badge>
                        </CardTitle>

                        {/* Botão de refresh */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="size-8"
                            title="Atualizar contatos"
                        >
                            <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>

                <Separator />

                {/* Lista de contatos */}
                <CardContent className="px-2 pt-4 pb-6">
                    {filteredContacts.length === 0 ? (
                        <AsideEmptyState searchQuery={debouncedSearch} />
                    ) : (
                        <div className="space-y-2">
                            {filteredContacts.map((limeContact, index) => (
                                <div
                                    key={`${limeContact.identity}-${index}`}
                                    className="animate-in fade-in slide-in-from-bottom-2"
                                    style={{
                                        animationDelay: `${Math.min(index * 30, 300)}ms`,
                                        animationDuration: "300ms",
                                        animationFillMode: "both"
                                    }}
                                >
                                    <ContactCardItem
                                        limeContact={limeContact}
                                        searchQuery={debouncedSearch}
                                        onClick={() => handleSelectContact(limeContact)}
                                        isActive={activeContactId === limeContact.identity}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </ScrollArea>
        </Card>
    )
}
"use client"

import { SearchInput } from "@/components/seach-input"
import { toast } from "@/components/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Contact, Download, RefreshCw } from "lucide-react"
import { AsideEmptyState } from "./aside-empty-state"
import { AsideLoading } from "./aside-loading"
import { ContactCardItem } from "./contact-card-item"
import { UseAside } from "./use-aside"
import { ImportAllContactsButton } from "./import-all-contacts-button"

export const Aside = () => {

    const useAside = UseAside()

    // Loading inicial
    if (!useAside) {
        return <AsideLoading />
    }

    const {
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
    } = useAside

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
            <CardFooter className="px-2">
                <ImportAllContactsButton />
            </CardFooter>
        </Card>
    )
}
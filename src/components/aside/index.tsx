"use client"

import { SearchInput } from "@/components/seach-input"
import { toast } from "@/components/toast"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { authClient } from "@/lib/auth-client"
import { AsideContactResults } from "./aside-contact-results"
import { AsideLoading } from "./aside-loading"
import { AsideMessageResults } from "./aside-message-results"
import { ImportAllContactsButton } from "./import-all-contacts-button"
import { ImportContactMessagesButton } from "./Import-contact-messages-button"
import { UseAside } from "./use-aside"

export const Aside = () => {

    const useAside = UseAside()
    const { data: session } = authClient.useSession()

    if (!useAside || !session) return <AsideLoading />

    const {
        error,
        refetch,
        searchQuery,
        setSearchQuery,
        handleClearSearch,
        handleSelectContact,
        handleSelectMessage,
        isSearching,
        isSearchingMessages,
        hasSearch,
        filteredCount,
        totalContacts,
        isFetching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        contacts,
        debouncedSearch,
        activeContactId,
        messageResults,
        noContactResults,
    } = useAside

    if (error) {
        toast({
            title: error.name,
            duration: Infinity,
            description: error.message,
            variant: "destructive",
            action: { label: "Tentar novamente", onClick: () => refetch() },
        })

        return null
    }

    const isAdmin = session.user.role === "ADMIN"

    return (
        <Card className="size-full rounded-none border-0 shadow-none">
            <CardHeader className="space-y-4 pb-4">
                <SearchInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClear={handleClearSearch}
                    placeholder="Buscar contatos ou mensagens..."
                    isLoading={isSearching || isSearchingMessages}
                    autoFocus
                />
            </CardHeader>

            <ScrollArea className="flex-1 min-h-50">
                <ScrollBar className="w-2" />

                {noContactResults ? (
                    <AsideMessageResults
                        messageResults={messageResults}
                        isSearchingMessages={isSearchingMessages}
                        activeContactId={activeContactId}
                        debouncedSearch={debouncedSearch}
                        onSelectMessage={handleSelectMessage}
                    />
                ) : (
                    <AsideContactResults
                        contacts={contacts}
                        hasSearch={hasSearch}
                        isFetching={isFetching}
                        filteredCount={filteredCount}
                        totalContacts={totalContacts}
                        debouncedSearch={debouncedSearch}
                        activeContactId={activeContactId}
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        fetchNextPage={fetchNextPage}
                        onRefetch={refetch}
                        onSelectContact={handleSelectContact}
                    />
                )}
            </ScrollArea>

            {isAdmin && (
                <CardFooter className="px-2 flex-col gap-2">
                    <ImportAllContactsButton />
                    <ImportContactMessagesButton />
                </CardFooter>
            )}
        </Card>
    )
}
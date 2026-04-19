"use client";

import { SearchInput } from "@/components/seach-input";
import { toast } from "@/components/toast";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { AsideContactResults } from "./aside-contact-results";
import { AsideFavoriteResults } from "./aside-favorite-results";
import { AsideLoading } from "./aside-loading";
import { AsideMessageResults } from "./aside-message-results";
import { ImportAllContactsButton } from "./import-all-contacts-button";
import { ImportContactMessagesButton } from "./Import-contact-messages-button";
import { UseAside } from "./use-aside";

const TAB_ORDER = ["contacts", "favorites"];

export const Aside = () => {
  const useAside = UseAside();
  const { data: session } = authClient.useSession();
  const [activeTab, setActiveTab] = useState("contacts");
  const [slideFrom, setSlideFrom] = useState<"right" | "left">("right");

  if (!useAside || !session) return <AsideLoading />;

  function handleTabChange(value: string) {
    const from = TAB_ORDER.indexOf(activeTab);
    const to = TAB_ORDER.indexOf(value);
    setSlideFrom(to > from ? "right" : "left");
    setActiveTab(value);
  }

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
    pinnedContacts,
    favoriteContacts,
    debouncedSearch,
    activeContactId,
    messageResults,
    noContactResults,
  } = useAside;

  if (error) {
    toast({
      title: error.name,
      duration: Infinity,
      description: error.message,
      variant: "destructive",
      action: { label: "Tentar novamente", onClick: () => refetch() },
    });

    return null;
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <Card className="size-full rounded-none border-0 shadow-none overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col size-full"
      >
        <CardHeader className="space-y-4 pb-4">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={handleClearSearch}
            placeholder="Buscar contatos ou mensagens..."
            isLoading={isSearching || isSearchingMessages}
            autoFocus
          />
          <TabsList variant={"line"} className="w-full">
            <TabsTrigger value="contacts" className="flex-1">
              Contatos
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1">
              Favoritos
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <TabsContent
          value="contacts"
          className={`flex-1 min-h-0 mt-0 ${slideFrom === "left" ? "data-[state=active]:slide-in-from-left-8" : "data-[state=active]:slide-in-from-right-8"}`}
        >
          <ScrollArea className="h-full">
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
                pinnedContacts={pinnedContacts}
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
        </TabsContent>

        <TabsContent
          value="favorites"
          className={`flex-1 min-h-0 mt-0 ${slideFrom === "right" ? "data-[state=active]:slide-in-from-right-8" : "data-[state=active]:slide-in-from-left-8"}`}
        >
          <ScrollArea className="h-full">
            <ScrollBar className="w-2" />
            <AsideFavoriteResults
              favoriteContacts={favoriteContacts}
              activeContactId={activeContactId}
              onSelectContact={handleSelectContact}
            />
          </ScrollArea>
        </TabsContent>

        {isAdmin && (
          <CardFooter className="px-2 flex-col gap-2">
            <ImportAllContactsButton />
            <ImportContactMessagesButton />
          </CardFooter>
        )}
      </Tabs>
    </Card>
  );
};

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Contact } from "@prisma/client";
import { Contact as ContactIcon, Pin, RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";
import { ContactSearchSkeleton } from "./aside-search-skeleton";
import { ContactCardItem } from "./contact-card-item";

type Props = {
  contacts: Contact[];
  pinnedContacts: Contact[];
  hasSearch: boolean;
  isFetching: boolean;
  filteredCount: number;
  totalContacts: number;
  debouncedSearch: string;
  activeContactId: string | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onRefetch: () => void;
  onSelectContact: (contact: Contact) => void;
};

export function AsideContactResults({
  contacts,
  pinnedContacts,
  hasSearch,
  isFetching,
  filteredCount,
  totalContacts,
  debouncedSearch,
  activeContactId,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onRefetch,
  onSelectContact,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasSearch) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasSearch, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <CardHeader className="pt-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <ContactIcon className="size-6" />
            Contatos
            <Badge variant="secondary" className="h-fit">
              {hasSearch ? `${filteredCount}/${totalContacts}` : totalContacts}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefetch}
            disabled={isFetching}
            className="size-8"
            title="Atualizar contatos"
          >
            <RefreshCw
              className={`size-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>

      <Separator />

      {!hasSearch && pinnedContacts.length > 0 && (
        <>
          <CardContent className="px-2 pt-4 pb-2">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Pin className="size-3.5 text-muted-foreground fill-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Fixados
              </span>
              <Badge variant="secondary" className="h-fit text-xs">
                {pinnedContacts.length}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              {pinnedContacts.map((contact) => (
                <ContactCardItem
                  key={contact.identity}
                  contact={contact}
                  searchQuery=""
                  onClick={() => onSelectContact(contact)}
                  isActive={activeContactId === contact.identity}
                />
              ))}
            </div>
          </CardContent>
          <Separator />
        </>
      )}

      {isFetching && hasSearch && contacts.length === 0 ? (
        <ContactSearchSkeleton />
      ) : (
        <CardContent className="px-2 pt-4 pb-6">
          <div className="space-y-2">
            {contacts.map((contact, index) => (
              <div
                key={`${contact.identity}-${index}`}
                className="animate-in fade-in slide-in-from-bottom-2"
                style={{
                  animationDelay: `${Math.min(index * 30, 300)}ms`,
                  animationDuration: "300ms",
                  animationFillMode: "both",
                }}
              >
                <ContactCardItem
                  contact={contact}
                  searchQuery={debouncedSearch}
                  onClick={() => onSelectContact(contact)}
                  isActive={activeContactId === contact.identity}
                />
              </div>
            ))}

            {!hasSearch && (
              <div ref={sentinelRef} className="py-2 flex justify-center">
                {isFetchingNextPage && (
                  <RefreshCw className="size-4 animate-spin text-muted-foreground" />
                )}
                {!hasNextPage && contacts.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Todos os contatos carregados
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </>
  );
}

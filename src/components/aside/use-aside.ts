"use client"

import { findManyContacts } from "@/actions/contacts/find-many-contacts"
import { GlobalMessageResult, searchMessagesGlobal } from "@/actions/messages/search-messages-global"
import { findFavoriteContactsByUserId } from "@/actions/user-preference/find-favorite-contacts-by-user-id"
import { findPinnedContactsByUserId } from "@/actions/user-preference/find-pinned-contacts-by-user-id"
import { useDebounce } from "@/hooks/use-debounce"
import { Contact } from "@prisma/client"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { parseAsString, useQueryState } from "nuqs"
import { useState } from "react"

const TAKE = 20

export function UseAside() {

    const router = useRouter()
    const [searchQuery, setSearchQuery] = useQueryState("contact-name", parseAsString.withDefault(""))
    const [activeContactId, setActiveContactId] = useState<string | null>(null)

    const debouncedSearch = useDebounce(searchQuery, 500)
    const isSearching = searchQuery !== debouncedSearch
    const hasSearch = debouncedSearch.trim().length > 0

    // ── Contatos fixados ─────────────────────────────────────────
    const pinnedQuery = useQuery({
        queryKey: ["find-pinned-contacts"],
        queryFn: () => findPinnedContactsByUserId(),
    })

    // ── Contatos favoritos ────────────────────────────────────────
    const favoriteQuery = useQuery({
        queryKey: ["find-favorite-contacts"],
        queryFn: () => findFavoriteContactsByUserId(),
    })

    const favoriteContacts = favoriteQuery.data?.map((p) => p.contact) ?? []

    const pinnedContacts = pinnedQuery.data?.map((p) => p.contact) ?? []
    const pinnedContactIds = pinnedContacts.map((c) => c.id)

    // ── Scroll infinito (sem busca) ──────────────────────────────
    const infiniteQuery = useInfiniteQuery({
        queryKey: ["find-infinity-contacts", pinnedContactIds],
        queryFn: ({ pageParam }) =>
            findManyContacts({
                cursor: pageParam,
                take: TAKE,
                where: pinnedContactIds.length > 0
                    ? { id: { notIn: pinnedContactIds } }
                    : undefined,
            }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        enabled: !hasSearch,
    })

    // ── Busca de contatos server-side ────────────────────────────────────────
    const contactSearchQuery = useQuery({
        queryKey: ["contacts-search", debouncedSearch],
        queryFn: () =>
            findManyContacts({
                where: {
                    OR: [
                        { name: { contains: debouncedSearch, mode: "insensitive" } },
                        { identity: { contains: debouncedSearch, mode: "insensitive" } },
                    ],
                },
            }),
        enabled: hasSearch,
    })

    const contactResults = hasSearch
        ? (contactSearchQuery.data?.data ?? [])
        : (infiniteQuery.data?.pages.flatMap((p) => p.data) ?? [])

    const contactSearchDone = hasSearch && !contactSearchQuery.isLoading
    const noContactResults = contactSearchDone && contactResults.length === 0

    // ── Busca de mensagens (fallback quando não há contatos) ─────────────────
    const messageSearchQuery = useQuery({
        queryKey: ["messages-global-search", debouncedSearch],
        queryFn: () => searchMessagesGlobal({ query: debouncedSearch }),
        enabled: noContactResults,
    })

    const isLoading = hasSearch
        ? contactSearchQuery.isLoading
        : infiniteQuery.isLoading

    const isFetching = hasSearch
        ? contactSearchQuery.isFetching || (noContactResults && messageSearchQuery.isFetching)
        : infiniteQuery.isFetching

    const error = hasSearch
        ? (contactSearchQuery.error ?? messageSearchQuery.error)
        : infiniteQuery.error

    const refetch = hasSearch
        ? contactSearchQuery.refetch
        : infiniteQuery.refetch

    const contacts = contactResults

    const totalContacts = hasSearch
        ? contactResults.length
        : (infiniteQuery.data?.pages[0]?.data.length ?? 0)

    const messageResults: GlobalMessageResult[] = noContactResults
        ? (messageSearchQuery.data ?? [])
        : []

    const isSearchingMessages = noContactResults && messageSearchQuery.isFetching

    function handleSelectMessage(message: GlobalMessageResult) {
        const { contact } = message
        setActiveContactId(contact.identity)
        router.push(`/contacts/${contact.id}?contact-name=${searchQuery}&message-id=${message.id}`)
    }

    if (isLoading) return undefined

    return {
        error,
        refetch,
        pinnedContacts,
        searchQuery,
        setSearchQuery,
        handleClearSearch: () => setSearchQuery(""),
        handleSelectContact: (contact: Contact) => setActiveContactId(contact.identity),
        handleSelectMessage,
        isSearching,
        hasSearch,
        isFetching,
        debouncedSearch,
        activeContactId,
        contacts,
        totalContacts,
        filteredCount: contacts.length,
        // scroll infinito
        fetchNextPage: infiniteQuery.fetchNextPage,
        hasNextPage: infiniteQuery.hasNextPage,
        isFetchingNextPage: infiniteQuery.isFetchingNextPage,
        // busca de mensagens
        messageResults,
        isSearchingMessages,
        noContactResults,
        // favoritos
        favoriteContacts,
    }
}

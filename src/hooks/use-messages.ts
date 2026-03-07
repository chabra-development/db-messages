import { findMessagesByContact } from "@/actions/messages/find-messages-by-contact"
import { useInfiniteQuery } from "@tanstack/react-query"

export function useMessages(contactId: string) {
    const query = useInfiniteQuery({
        queryKey: ["messages", contactId],
        queryFn: ({ pageParam }) =>
            findMessagesByContact({
                contactId,
                take: 20,
                cursor: pageParam,
            }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        enabled: !!contactId,
    })

    // Páginas em ordem desc (mais recentes primeiro)
    // MessagesBoard chama toReversed() para exibir em ordem cronológica
    const messages = query.data?.pages.flatMap((p) => p.messages) ?? []

    return { ...query, messages }
}

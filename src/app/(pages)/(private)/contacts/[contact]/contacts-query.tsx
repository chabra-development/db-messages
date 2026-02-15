"use client"

import {
    findContactIdByNumberPhone
} from "@/actions/blip/find-contact-id-by-number-phone"
import {
    findMessagesByIdentifyContact
} from "@/actions/blip/find-messages-by-identify-contact"
import { toast } from "@/components/toast"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { ContactInterative } from "./contact-interative"
import { ContactInterativeList } from "./contact-interative-list"
import { ContactMessage } from "./contact-message"
import { ContactScopeAvaliation } from "./contact-scope-avaliation"
import { ContactScopeTextResponse } from "./contact-scope-text-response"
import { ContactsQueryLoading } from "./contacts-query-loading"
import { renderEmoji } from "@/functions/render-emoji"
import { isSameDay } from "date-fns"
import { formatChatDate } from "@/functions/format-chat-date"
import { Badge } from "@/components/ui/badge"
import { AudioPlayer } from "@/components/audio-player"
import {
    isLimeMediaContent,
    isLimeEmojiReaction,
    isLimeSelectContent,
    isLimeReplyContent,
    isLimeInteractiveList,
    isLimeInteractiveButton,
    isLimeInteractiveMessage,
    isLimeReplyToText,
    isUnknownContent
} from "@/guards/lime-thread-messages.guards"
import { stringToHTML } from "@/functions/string-to-HTML"
import { MessagesBoard } from "@/components/messages-board"

export const ContactsQuery = ({ identity }: { identity: string }) => {

    const numberPhone = identity.slice(0, 13)

    const {
        data: contact,
        isLoading: contactIsLoading
    } = useQuery({
        queryKey: ["find-contact-id-by-number-phone", identity],
        queryFn: () => findContactIdByNumberPhone(numberPhone)
    })

    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ["find-many-messages-by-identify", identity],
        queryFn: () => findMessagesByIdentifyContact(identity)
    })

    if (isLoading || !data) {
        return (
            <ContactsQueryLoading />
        )
    }

    if (error) {
        return (
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
        )
    }

    const { resource } = data

    return (
        <Card className="size-full border-none rounded-none">
            {
                contact && (
                    <CardHeader className="border-b pb-3 gap-0">
                        <CardTitle className="text-2xl mb-1.25">
                            {
                                (contactIsLoading)
                                    ? <Skeleton className="h-8 w-full rounded-full" />
                                    : contact.resource.fullName
                            }
                        </CardTitle>
                        <CardDescription>
                            {
                                (contactIsLoading)
                                    ? <Skeleton className="h-6 w-full rounded-full" />
                                    : contact.resource.phoneNumber
                            }
                        </CardDescription>
                    </CardHeader>
                )
            }
            <MessagesBoard resource={resource} />
        </Card>
    )
}
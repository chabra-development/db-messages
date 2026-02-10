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
import { ContactScopeText } from "./contact-scope-text"
import { ContactScopeTextResponse } from "./contact-scope-text-response"
import { ContactsQueryLoading } from "./contacts-query-loading"
import { renderEmoji } from "@/functions/render-emoji"
import { isSameDay } from "date-fns"
import { formatChatDate } from "@/functions/format-chat-date"
import { Badge } from "@/components/ui/badge"
import { AudioPlayer } from "@/components/audio-player"

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
        <Card className="flex-1 border-none rounded-none">
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
            <ScrollArea className="flex-1 min-h-200 @container/chat">
                <ScrollBar />
                <CardContent className={cn(
                    "space-y-2 px-2"
                )}>
                    {
                        resource.items.length === 0
                            ? (
                                <Card className="flex-1 h-[calc(100dvh-48px)] bg-transparent border-none">
                                    <CardContent className="size-full flex justify-center">
                                        <CardDescription className="text-xl">
                                            Esse contato ainda não possui uma conversa
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            )
                            : [...resource.items].reverse().map((
                                {
                                    id, direction, content, date, metadata
                                },
                                index,
                                array
                            ) => {

                                const currentDate = new Date(date)

                                const previousDate =
                                    index > 0 ? new Date(array[index - 1].date) : null

                                const showDateDivider =
                                    !previousDate || !isSameDay(currentDate, previousDate)

                                if (
                                    typeof content === "object" &&
                                    "type" in content &&
                                    typeof content.type === "string" &&
                                    content.type === "audio/ogg"
                                ) {
                                    console.log(content)
                                }

                                return (
                                    <div
                                        key={id}
                                        className={cn(
                                            "w-full flex flex-col",
                                            direction === "sent"
                                                ? "items-end"
                                                : "items-start"
                                        )}
                                    >
                                        {
                                            showDateDivider && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs  mx-auto py-2 px-4 dark:bg-muted bg-zinc-100 border border-border mb-3 not-first:mt-2.5"
                                                >
                                                    {formatChatDate(currentDate)}
                                                </Badge>
                                            )
                                        }
                                        {
                                            (
                                                typeof content === "object" &&
                                                "type" in content &&
                                                typeof content.type === "string" &&
                                                content.type === "audio/ogg"
                                            ) && (
                                                <AudioPlayer
                                                    url={content.uri}
                                                    date={date}
                                                    direction={direction}
                                                />
                                            )
                                        }
                                        {
                                            (
                                                typeof content === "object" &&
                                                "emoji" in content
                                            ) && (
                                                <ContactMessage
                                                    date={date}
                                                    direction={direction}
                                                    content={renderEmoji(content.emoji)}
                                                />
                                            )
                                        }
                                        {
                                            (
                                                typeof content === "object" &&
                                                "recipient_type" in content &&
                                                "interactive" in content &&
                                                "body" in content.interactive &&
                                                "action" in content.interactive &&
                                                "button" in content.interactive.action
                                            ) && (
                                                <ContactInterativeList
                                                    date={date}
                                                    direction={direction}
                                                    sections={content.interactive.action.sections}
                                                    title={content.interactive.body.text}
                                                />
                                            )
                                        }
                                        {
                                            (
                                                typeof content === "object" &&
                                                "options" in content &&
                                                !("scope" in content) &&
                                                direction === "sent"
                                            ) && (
                                                <ContactScopeAvaliation
                                                    content={content}
                                                    date={date}
                                                    direction={direction}
                                                />
                                            )
                                        }
                                        {
                                            (
                                                typeof content === "object" &&
                                                "replied" in content &&
                                                "value" in content.replied
                                            ) && (
                                                <ContactScopeTextResponse
                                                    date={date}
                                                    direction={direction}
                                                    title={content.replied.value}
                                                />
                                            )
                                        }
                                        {
                                            (
                                                typeof content === "object" &&
                                                "replied" in content &&
                                                "interactive" in content.inReplyTo.value &&
                                                "type" in content.inReplyTo.value.interactive &&
                                                content.inReplyTo.value.interactive.type === "list" &&
                                                direction === "sent"
                                            ) && (
                                                <ContactInterativeList
                                                    title={
                                                        content.inReplyTo.value.interactive.body.text
                                                    }
                                                    sections={
                                                        content.inReplyTo.value.interactive.action.sections
                                                    }
                                                    date={date}
                                                    direction={direction}
                                                />
                                            )
                                        }
                                        {
                                            (
                                                typeof content === "object" &&
                                                "replied" in content &&
                                                "interactive" in content.inReplyTo.value &&
                                                "type" in content.inReplyTo.value.interactive &&
                                                content.inReplyTo.value.interactive.type === "button" &&
                                                direction === "sent"
                                            ) && (
                                                <ContactInterative
                                                    title={
                                                        content.inReplyTo.value.interactive.body.text
                                                    }
                                                    buttons={
                                                        content.inReplyTo.value.interactive.action.buttons
                                                    }
                                                    date={date}
                                                    direction={direction}
                                                />
                                            )
                                        }
                                        {
                                            typeof content === "string" && (
                                                <ContactMessage
                                                    date={date}
                                                    content={content}
                                                    direction={direction}
                                                    metadata={metadata}
                                                />
                                            )
                                        }
                                        {(
                                            typeof content === "object" &&
                                            "scope" in content
                                        ) && (
                                                <ContactScopeText
                                                    content={content}
                                                    date={date}
                                                    direction={direction}
                                                />
                                            )
                                        }
                                        {(
                                            typeof content === "object" &&
                                            "interactive" in content &&
                                            "body" in content.interactive &&
                                            "buttons" in content.interactive.action
                                        ) && (
                                                <ContactInterative
                                                    title={content.interactive.body.text}
                                                    buttons={
                                                        content
                                                            .interactive
                                                            .action
                                                            .buttons
                                                    }
                                                    date={date}
                                                    direction={direction}
                                                />
                                            )
                                        }
                                    </div>
                                )
                            })
                    }
                </CardContent>
            </ScrollArea>
        </Card>
    )
}
import {
    findMessagesByTicketId
} from "@/actions/blip/find-many-messages-by-ticket-id"
import { AudioPlayer } from "@/components/audio-player"
import { TicketsQueryItem } from "@/components/ticket/ticket-query-item"
import { toast } from "@/components/toast"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { ScrollBar, ScrollArea } from "@/components/ui/scroll-area"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet"
import { extractNameFromBlipIdentity } from "@/functions/extract-name-from-blip-identity"
import { formatChatDate } from "@/functions/format-chat-date"
import {
    isLimeReplyToText,
    isLimeMediaContent,
    isLimeEmojiReaction,
    isLimeSelectContent,
    isLimeReplyContent,
    isLimeInteractiveList,
    isLimeInteractiveButton,
    isLimeInteractiveMessage,
    isUnknownContent
} from "@/guards/lime-thread-messages.guards"
import { renderEmoji } from "@/functions/render-emoji"
import { stringToHTML } from "@/functions/string-to-HTML"
import { cn } from "@/lib/utils"
import { LimeTicket } from "@/types/lime-ticket-response.types"
import { useQuery } from "@tanstack/react-query"
import { formatDate, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ContactInterative } from "../contacts/[contact]/contact-interative"
import {
    ContactInterativeList
} from "../contacts/[contact]/contact-interative-list"
import { ContactMessage } from "../contacts/[contact]/contact-message"
import {
    ContactScopeAvaliation
} from "../contacts/[contact]/contact-scope-avaliation"
import { ContactScopeTextResponse } from "../contacts/[contact]/contact-scope-text-response"

export const TicketInfoSheet = ({ ticket }: { ticket: LimeTicket }) => {

    console.log(ticket)

    const { id, sequentialId, team, openDate, closeDate, closedBy } = ticket

    const {
        data: ticketMessageResponse,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ["find-many-messages-by-ticket-id", id],
        queryFn: () => findMessagesByTicketId(id)
    })

    if (!ticketMessageResponse || isLoading) {
        return <p>Carregando...</p>
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

    console.log(ticketMessageResponse)

    const { resource } = ticketMessageResponse

    return (
        <Sheet>
            <SheetTrigger>
                <TicketsQueryItem ticket={ticket} />
            </SheetTrigger>
            <SheetContent className="sm:max-w-5xl sm:w-full">
                <SheetHeader>
                    <SheetTitle>
                        {id}
                    </SheetTitle>
                    <SheetDescription>
                        # {sequentialId}
                    </SheetDescription>
                </SheetHeader>
                <div className="px-4 space-y-2.5">
                    <div className="flex">
                        fila:
                        <Badge
                            variant={"secondary"}
                            className="text-sm mx-2"
                        >
                            {
                                team !== "DIRECT_TRANSFER"
                                    ? team
                                    : "transferência direta"
                            }
                        </Badge>
                    </div>
                    <div className="flex gap-4">
                        {
                            openDate && (
                                <div className="flex">
                                    aberto em:
                                    <Badge className="text-sm mx-2">
                                        {formatDate(new Date(openDate), "PPP", { locale: ptBR })}
                                    </Badge>
                                </div>
                            )
                        }
                        {
                            closeDate && (
                                <div className="flex">
                                    fechado em:
                                    <Badge className="text-sm mx-2">
                                        {formatDate(closeDate, "PPP", { locale: ptBR })}
                                    </Badge>
                                </div>

                            )
                        }
                    </div>
                    {
                        closedBy && (
                            <div className="flex">
                                fechado por:
                                <Badge className="text-sm mx-2 capitalize">
                                    {extractNameFromBlipIdentity(closedBy)}
                                </Badge>
                            </div>
                        )
                    }
                </div>
                <Card className="mx-4 h-full ">
                    <ScrollArea className={cn(
                        "flex-1 min-h-200 pb-6",
                        "@container/chat"
                    )}>
                        <ScrollBar />
                        <CardContent className={cn("space-y-2 px-2")}>
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
                                    : [...resource.items].reverse().map(
                                        ({ id, direction, content, date, metadata }, index, array) => {

                                            const currentDate = new Date(date)
                                            const previousDate =
                                                index > 0 ? new Date(array[index - 1].date) : null

                                            const showDateDivider =
                                                !previousDate || !isSameDay(currentDate, previousDate)

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
                                                    {showDateDivider && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs mx-auto py-2 px-4 mb-3"
                                                        >
                                                            {formatChatDate(currentDate)}
                                                        </Badge>
                                                    )}

                                                    {/* ===================== TEXT ===================== */}
                                                    {typeof content === "string" && (
                                                        <ContactMessage
                                                            date={date}
                                                            content={content}
                                                            direction={direction}
                                                            metadata={metadata}
                                                        />
                                                    )}

                                                    {(isLimeReplyToText(content)) && (
                                                        <Card className={cn(
                                                            "w-1/2 text-sm",
                                                            "@max-5xl/chat:w-9/10 py-1 gap-2",
                                                            direction === "sent"
                                                                ? "bg-message rounded-tr-none"
                                                                : "bg-message-foreground rounded-tl-none"
                                                        )}>
                                                            <CardHeader className="px-1">
                                                                <CardTitle className="bg-card/30 py-2.5 px-4 rounded-sm text-muted-foreground">
                                                                    {
                                                                        stringToHTML(content.inReplyTo.value)
                                                                    }
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardHeader className="px-1">
                                                                <CardTitle className="px-2 rounded-md">
                                                                    {
                                                                        stringToHTML(content.replied.value)
                                                                    }
                                                                </CardTitle>
                                                            </CardHeader>
                                                        </Card>
                                                    )}

                                                    {/* ===================== AUDIO ===================== */}
                                                    {isLimeMediaContent(content) &&
                                                        content.type === "audio/ogg" && (
                                                            <AudioPlayer
                                                                url={content.uri}
                                                                date={date}
                                                                direction={direction}
                                                            />
                                                        )
                                                    }

                                                    {/* ===================== EMOJI ===================== */}
                                                    {isLimeEmojiReaction(content) && (
                                                        <ContactMessage
                                                            date={date}
                                                            direction={direction}
                                                            content={renderEmoji(content.emoji)}
                                                        />
                                                    )}

                                                    {/* ===================== SELECT / SCOPE ===================== */}
                                                    {isLimeSelectContent(content) &&
                                                        !content.scope &&
                                                        direction === "sent" && (
                                                            <ContactScopeAvaliation
                                                                content={content}
                                                                date={date}
                                                                direction={direction}
                                                            />
                                                        )
                                                    }

                                                    {/* ===================== REPLY ===================== */}
                                                    {isLimeReplyContent(content) && (
                                                        <>
                                                            <ContactScopeTextResponse
                                                                date={date}
                                                                direction={direction}
                                                                title={content.replied.value}
                                                            />

                                                            {isLimeInteractiveList(
                                                                content.inReplyTo.value.interactive
                                                            ) && direction === "sent" && (
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
                                                                )}

                                                            {isLimeInteractiveButton(
                                                                content.inReplyTo.value.interactive
                                                            ) && direction === "sent" && (
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
                                                                )}
                                                        </>
                                                    )}

                                                    {/* ===================== INTERACTIVE (OUTBOUND) ===================== */}
                                                    {isLimeInteractiveMessage(content) &&
                                                        isLimeInteractiveList(content.interactive) && (
                                                            <ContactInterativeList
                                                                date={date}
                                                                direction={direction}
                                                                sections={content.interactive.action.sections}
                                                                title={content.interactive.body.text}
                                                            />
                                                        )
                                                    }

                                                    {isLimeInteractiveMessage(content) &&
                                                        isLimeInteractiveButton(content.interactive) && (
                                                            <ContactInterative
                                                                title={content.interactive.body.text}
                                                                buttons={content.interactive.action.buttons}
                                                                date={date}
                                                                direction={direction}
                                                            />
                                                        )
                                                    }

                                                    {isUnknownContent(content) && (
                                                        <pre>
                                                            {JSON.stringify(content, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            )
                                        }
                                    )
                            }
                        </CardContent>
                    </ScrollArea>
                </Card>
            </SheetContent>
        </Sheet>
    )
}

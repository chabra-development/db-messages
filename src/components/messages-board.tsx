import { AudioPlayer } from "@/components/audio-player"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ContactInterative } from "@/contacts/contact-interative"
import { ContactInterativeList } from "@/contacts/contact-interative-list"
import { ContactMessage } from "@/contacts/contact-message"
import { ContactScopeAvaliation } from "@/contacts/contact-scope-avaliation"
import {
    ContactScopeTextResponse
} from "@/contacts/contact-scope-text-response"
import { formatChatDate } from "@/functions/format-chat-date"
import {
    isLimeEmojiReaction,
    isLimeInteractiveButton,
    isLimeInteractiveList,
    isLimeInteractiveMessage,
    isLimeMediaContent,
    isLimeReplyContent,
    isLimeReplyToText,
    isLimeSelectContent,
    isLimeReplyTextContent,
    isLimeTicketContent,
    isUnknownContent,
    isLimeReplyToSelectContent,
} from "@/guards/lime-thread-messages.guards"
import { renderEmoji } from "@/functions/render-emoji"
import { stringToHTML } from "@/functions/string-to-HTML"
import { cn } from "@/lib/utils"
import {
    LimeThreadMessagesResource
} from "@/types/lime-thread-messages-response.types"
import { formatDate, isSameDay } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Loader } from "lucide-react"

export const MessagesBoard = ({
    resource
}: { resource: LimeThreadMessagesResource }) => {
    return (
        <ScrollArea className="flex-1 min-h-200 @container/chat">
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

                                if (isUnknownContent(content)) {
                                    console.log(content)
                                } else {
                                    console.log("todos os tipos tratados")
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
                                        {showDateDivider && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs mx-auto py-2 px-4 mb-3"
                                            >
                                                {formatChatDate(currentDate)}
                                            </Badge>
                                        )}

                                        {
                                            (isLimeReplyToSelectContent(content)) && (
                                                <Card className={cn(
                                                    "w-1/2 text-sm py-2 gap-2",
                                                    "@max-5xl/chat:w-9/10",
                                                    direction === "sent"
                                                        ? "bg-message rounded-tr-none"
                                                        : "bg-muted rounded-tl-none"
                                                )}>
                                                    <CardHeader className="px-1">
                                                        <CardTitle className="bg-card/30 py-2.5 px-4 rounded-sm text-muted-foreground">
                                                            {
                                                                stringToHTML(content.inReplyTo.value.text)
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
                                                    <CardFooter className="ml-auto">
                                                        <CardDescription>
                                                            {formatDate(date, "HH:mm")}
                                                        </CardDescription>
                                                    </CardFooter>
                                                </Card>
                                            )
                                        }

                                        {
                                            (isLimeTicketContent(content)) && (
                                                <Alert className="w-fit mx-auto my-4 flex flex-col bg-secondary">
                                                    <div className="w-fit flex items-center gap-2">
                                                        <AlertTitle>
                                                            Transferindo para atendente...
                                                        </AlertTitle>
                                                        <Loader />
                                                    </div>
                                                    <AlertDescription>
                                                        fila {content.team}
                                                    </AlertDescription>
                                                    <AlertDescription className="ml-auto">
                                                        {formatDate(content.storageDate, "HH:mm")}
                                                    </AlertDescription>
                                                </Alert>
                                            )

                                        }

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
                                                "@max-5xl/chat:w-9/10 pt-1 pb-2 gap-2",
                                                direction === "sent"
                                                    ? "bg-message rounded-tr-none"
                                                    : "bg-muted rounded-tl-none"
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
                                                <CardFooter className="ml-auto">
                                                    <CardDescription>
                                                        {formatDate(date, "HH:mm")}
                                                    </CardDescription>
                                                </CardFooter>
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
                                                    content={content}
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
                                            isLimeInteractiveButton(content.interactive)
                                            && (
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
    )
}

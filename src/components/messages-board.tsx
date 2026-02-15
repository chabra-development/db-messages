import { ContactMediaImage } from "@/app/(pages)/(private)/contacts/[contact]/contact-media-image"
import { SystemInfoDate } from "@/app/(pages)/(private)/contacts/[contact]/system-info-date"
import { AudioPlayer } from "@/components/audio-player"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription
} from "@/components/ui/card"
import { ContactInterative } from "@/contacts/contact-interative"
import { ContactInterativeList } from "@/contacts/contact-interative-list"
import { ContactMediaSticker } from "@/contacts/contact-media-sticker"
import { ContactMediaVideo } from "@/contacts/contact-media-video"
import { ContactMessage } from "@/contacts/contact-message"
import {
    ContactReplyToSelectResponse
} from "@/contacts/contact-reply-to-select"
import { ContactReplyToText } from "@/contacts/contact-reply-to-text"
import { ContactScopeAvaliation } from "@/contacts/contact-scope-avaliation"
import {
    ContactScopeTextResponse
} from "@/contacts/contact-scope-text-response"
import { SystemInfoAlert } from "@/contacts/system-info-alert"

import { renderEmoji } from "@/functions/render-emoji"
import {
    isLimeEmojiReaction,
    isLimeInteractiveButton,
    isLimeInteractiveList,
    isLimeInteractiveMessage,
    isLimeMediaContent,
    isLimeReplyContent,
    isLimeReplyToSelectContent,
    isLimeReplyToText,
    isLimeSelectContent,
    isLimeTicketContent,
    isUnknownContent
} from "@/guards/lime-thread-messages.guards"
import { cn } from "@/lib/utils"
import {
    LimeThreadMessagesResource
} from "@/types/lime-thread-messages-response.types"
import { isSameDay } from "date-fns"

type MessagesBoardProps = { resource: LimeThreadMessagesResource }

export const MessagesBoard = ({ resource }: MessagesBoardProps) => {
    return (
        <CardContent className={cn("space-y-2 px-2")}>
            {
                resource.items.length === 0
                    ? (
                        <Card className="flex-1 h-full bg-transparent border-none">
                            <CardContent className="size-full flex justify-center">
                                <CardDescription className="text-xl">
                                    Esse contato ainda não possui uma conversa
                                </CardDescription>
                            </CardContent>
                        </Card>
                    )
                    : [...resource.items].reverse().map(
                        ({
                            id, direction, content, date, metadata
                        }, index, array) => {

                            if (isLimeMediaContent(content)) {
                                console.log(content)
                            } else {
                                console.log("todos os tipos tratados")
                            }

                            return (
                                <div
                                    key={id}
                                    className={cn(
                                        "w-full max-w-full min-w-0 flex flex-col", // ⭐ Adicionado max-w-full min-w-0
                                        direction === "sent" ? "items-end" : "items-start"
                                    )}
                                >

                                    <SystemInfoDate 
                                        index={index}
                                        array={array}
                                        date={date}
                                    />

                                    {/* ===================== REPLY TO SELECT ===================== */}
                                    {isLimeReplyToSelectContent(content) && (
                                        <ContactReplyToSelectResponse
                                            date={date}
                                            direction={direction}
                                            response={content.replied.value}
                                            title={content.inReplyTo.value.text}
                                        />
                                    )}

                                    {/* ===================== TICKET ===================== */}
                                    {isLimeTicketContent(content) && (
                                        <SystemInfoAlert
                                            storageDate={content.storageDate}
                                            team={content.team}
                                        />
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

                                    {/* ===================== REPLY TO TEXT ===================== */}
                                    {isLimeReplyToText(content) && (
                                        <ContactReplyToText
                                            date={date}
                                            direction={direction}
                                            response={content.replied.value}
                                            title={content.inReplyTo.value}
                                        />
                                    )}

                                    {/* ===================== AUDIO ===================== */}
                                    {(isLimeMediaContent(content) &&
                                        content.type === "audio/ogg") && (
                                            <AudioPlayer
                                                url={content.uri}
                                                date={date}
                                                direction={direction}
                                            />
                                        )}

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
                                        )}

                                    {/* ===================== REPLY ===================== */}
                                    {isLimeReplyContent(content) && (
                                        <>
                                            <ContactScopeTextResponse
                                                date={date}
                                                direction={direction}
                                                title={content.replied.value}
                                                content={content}
                                            />

                                            {isLimeInteractiveList(content.inReplyTo.value.interactive) &&
                                                direction === "sent" && (
                                                    <ContactInterativeList
                                                        title={content.inReplyTo.value.interactive.body.text}
                                                        sections={
                                                            content.inReplyTo.value.interactive.action.sections
                                                        }
                                                        date={date}
                                                        direction={direction}
                                                    />
                                                )}

                                            {isLimeInteractiveButton(content.inReplyTo.value.interactive) &&
                                                direction === "sent" && (
                                                    <ContactInterative
                                                        title={content.inReplyTo.value.interactive.body.text}
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
                                        )}

                                    {isLimeInteractiveMessage(content) &&
                                        isLimeInteractiveButton(content.interactive) && (
                                            <ContactInterative
                                                title={content.interactive.body.text}
                                                buttons={content.interactive.action.buttons}
                                                date={date}
                                                direction={direction}
                                            />
                                        )}

                                    {/* ===================== UNKNOWN CONTENT ===================== */}
                                    {isUnknownContent(content) && (
                                        <pre className="text-xs w-fit">
                                            {JSON.stringify(content, null, 2)}
                                        </pre>
                                    )}

                                    {/* ===================== VIDEO ===================== */}
                                    {(isLimeMediaContent(content) &&
                                        content.type.includes("video/mp4")) && (
                                            <ContactMediaVideo
                                                date={date}
                                                direction={direction}
                                                uri={content.uri}
                                            />
                                        )}


                                    {isLimeMediaContent(content) && content.type.includes("sticker/webp") && (
                                        <ContactMediaSticker
                                            date={date}
                                            direction={direction}
                                            uri={content.uri}
                                            type={content.type}
                                        />
                                    )}

                                    {isLimeMediaContent(content) && content.type.includes("image/jpeg") && (
                                        <ContactMediaImage
                                            date={date}
                                            direction={direction}
                                            uri={content.uri}
                                            type={content.type}
                                        />
                                    )}
                                </div>
                            )
                        }
                    )
            }
        </CardContent>
    )
}

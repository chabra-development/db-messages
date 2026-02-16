import { AudioPlayer } from "@/components/audio-player"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { ContactInterative } from "@/contacts/contact-interative"
import { ContactInterativeList } from "@/contacts/contact-interative-list"
import { ContactMediaImage } from "@/contacts/contact-media-image"
import { ContactImageResponse } from "@/contacts/contact-media-image-response"
import { ContactMediaSticker } from "@/contacts/contact-media-sticker"
import { ContactMediaVideo } from "@/contacts/contact-media-video"
import { ContactMessage } from "@/contacts/contact-message"
import {
    ContactPhoneCard
} from "@/contacts/contact-phone-card"
import {
    ContactPhoneCardResponse
} from "@/contacts/contact-phone-card-response"
import {
    ContactReplyToSelectResponse
} from "@/contacts/contact-reply-to-select"
import { ContactReplyToText } from "@/contacts/contact-reply-to-text"
import { ContactScopeAvaliation } from "@/contacts/contact-scope-avaliation"
import {
    ContactScopeTextResponse
} from "@/contacts/contact-scope-text-response"
import { SystemInfoAlert } from "@/contacts/system-info-alert"
import { SystemInfoDate } from "@/contacts/system-info-date"
import { renderEmoji } from "@/functions/render-emoji"
import {
    isLimeContactContentResponse,
    isLimeContactPayload,
    isLimeEmojiReaction,
    isLimeInteractiveButton,
    isLimeInteractiveList,
    isLimeInteractiveMessage,
    isLimeMediaContent,
    isLimeMediaContentResponse,
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
import { useEffect, useRef } from "react"
import { ContactMessageWithLink } from "./contact-message-with-link"
import { isSafePublicUrl } from "@/functions/validate-url"

type MessagesBoardProps = { resource: LimeThreadMessagesResource }

export const MessagesBoard = ({ resource }: MessagesBoardProps) => {

    const itemsReversed = [...resource.items].reverse()

    const bottomRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({
                behavior: "instant",
                block: "end"
            })
        }
    }, [resource.items.length])

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
                    : itemsReversed.map(
                        ({
                            id, direction, content, date
                        }, index, array) => {

                            if (isUnknownContent(content)) {
                                console.log(content)
                            } else {
                                console.log("todos os tipos tratados")
                            }

                            return (
                                <div
                                    key={id}
                                    ref={containerRef}
                                    className={cn(
                                        "w-full max-w-full min-w-0 flex flex-col",
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
                                            response={content.inReplyTo.value.text}
                                            title={content.replied.value}
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
                                    {(typeof content === "string" &&
                                        !isSafePublicUrl(content)
                                    ) && (
                                            <ContactMessage
                                                date={date}
                                                content={content}
                                                direction={direction}
                                            />
                                        )}

                                    {(typeof content === "string" &&
                                        isSafePublicUrl(content)
                                    ) && (
                                            <ContactMessageWithLink
                                                date={date}
                                                content={content}
                                                direction={direction}
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
                                            id={id}
                                            date={date}
                                            direction={direction}
                                            uri={content.uri}
                                            type={content.type}
                                        />
                                    )}

                                    {isLimeMediaContentResponse(content) && (
                                        <ContactImageResponse
                                            date={date}
                                            direction={direction}
                                            uri={content.inReplyTo.value.uri}
                                            type={content.inReplyTo.value.type}
                                            response={content.replied.value}
                                            id={content.inReplyTo.id}
                                        />
                                    )
                                    }

                                    {isLimeContactPayload(content) && (
                                        <ContactPhoneCard
                                            content={content}
                                            date={date}
                                            direction={direction}
                                        />
                                    )}

                                    {isLimeContactContentResponse(content) && (
                                        <ContactPhoneCardResponse
                                            date={date}
                                            direction={direction}
                                            response={content.inReplyTo.value.name}
                                            title={content.replied.value}
                                        />
                                    )}
                                </div>
                            )
                        }
                    )
            }
            <div ref={bottomRef} className="h-1" />
        </CardContent>
    )
}

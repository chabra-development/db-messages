// message-renderer.tsx
import { AudioPlayer } from "@/components/audio-player"
import { ContactInterative } from "@/contacts/contact-interative"
import { ContactInterativeList } from "@/contacts/contact-interative-list"
import { ContactMediaImage } from "@/contacts/contact-media-image"
import { ContactImageResponse } from "@/contacts/contact-media-image-response"
import { ContactMediaSticker } from "@/contacts/contact-media-sticker"
import { ContactMediaVideo } from "@/contacts/contact-media-video"
import { ContactMessage } from "@/contacts/contact-message"
import { ContactMessageWithLink } from "./contact-message-with-link"
import { ContactPhoneCard } from "@/contacts/contact-phone-card"
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
import { renderEmoji } from "@/functions/render-emoji"
import { isSafePublicUrl } from "@/functions/validate-url"
import {
    isLimeContactPayload,
    isLimeEmojiReaction,
    isLimeInteractiveButton,
    isLimeInteractiveList,
    isLimeInteractiveMessage,
    isLimeMediaContent,
    isLimeReplyToContact,
    isLimeReplyToInteractive,
    isLimeReplyToMedia,
    isLimeReplyToSelect,
    isLimeReplyToText,
    isLimeSelectContent,
    isLimeTicketContent,
} from "@/guards/lime-thread-messages.guards"
import { LimeThreadMessage } from "@/types/lime-thread-messages-response.types"

export type MessageRendererProps = {
    message: LimeThreadMessage
}

export const MessageRenderer = ({ message }: MessageRendererProps) => {
    const { id, direction, content, date } = message

    // ── TEXT ──────────────────────────────────────────────
    if (typeof content === "string") {
        return isSafePublicUrl(content)
            ? <ContactMessageWithLink date={date} content={content} direction={direction} />
            : <ContactMessage date={date} content={content} direction={direction} />
    }

    // ── TICKET ────────────────────────────────────────────
    if (isLimeTicketContent(content)) {
        return (
            <SystemInfoAlert
                storageDate={content.storageDate}
                team={content.team ?? "Default"}
            />
        )
    }

    // ── EMOJI ─────────────────────────────────────────────
    if (isLimeEmojiReaction(content)) {
        return (
            <ContactMessage
                date={date}
                direction={direction}
                content={renderEmoji(content.emoji)}
            />
        )
    }

    // ── CONTACT ───────────────────────────────────────────
    if (isLimeContactPayload(content)) {
        return <ContactPhoneCard content={content} date={date} direction={direction} />
    }

    // ── MEDIA ─────────────────────────────────────────────
    if (isLimeMediaContent(content)) {
        if (content.type === "audio/ogg") {
            return <AudioPlayer url={content.uri} date={date} direction={direction} />
        }
        if (content.type.includes("video/mp4")) {
            return <ContactMediaVideo date={date} direction={direction} uri={content.uri} />
        }
        if (content.type.includes("image/jpeg")) {
            return (
                <ContactMediaImage
                    id={id}
                    date={date}
                    direction={direction}
                    uri={content.uri}
                    type={content.type}
                />
            )
        }
        if (content.type.includes("sticker/webp")) {
            return (
                <ContactMediaSticker
                    date={date}
                    direction={direction}
                    uri={content.uri}
                    type={content.type}
                />
            )
        }
    }

    // ── SELECT ────────────────────────────────────────────
    if (isLimeSelectContent(content) && !content.scope && direction === "sent") {
        return <ContactScopeAvaliation content={content} date={date} direction={direction} />
    }

    // ── INTERACTIVE (OUTBOUND) ────────────────────────────
    if (isLimeInteractiveMessage(content)) {
        if (isLimeInteractiveList(content.interactive)) {
            return (
                <ContactInterativeList
                    date={date}
                    direction={direction}
                    sections={content.interactive.action.sections}
                    title={content.interactive.body.text}
                />
            )
        }
        if (isLimeInteractiveButton(content.interactive)) {
            return (
                <ContactInterative
                    title={content.interactive.body.text}
                    buttons={content.interactive.action.buttons}
                    date={date}
                    direction={direction}
                />
            )
        }
    }

    // ── REPLY TO INTERACTIVE ──────────────────────────────
    if (isLimeReplyToInteractive(content)) {
        return (
            <>
                <ContactScopeTextResponse
                    date={date}
                    direction={direction}
                    title={content.replied.value}
                    content={content}
                />
                {isLimeInteractiveList(content.inReplyTo.value.interactive) && direction === "sent" && (
                    <ContactInterativeList
                        title={content.inReplyTo.value.interactive.body.text}
                        sections={content.inReplyTo.value.interactive.action.sections}
                        date={date}
                        direction={direction}
                    />
                )}
                {isLimeInteractiveButton(content.inReplyTo.value.interactive) && direction === "sent" && (
                    <ContactInterative
                        title={content.inReplyTo.value.interactive.body.text}
                        buttons={content.inReplyTo.value.interactive.action.buttons}
                        date={date}
                        direction={direction}
                    />
                )}
            </>
        )
    }

    // ── REPLY TO TEXT ─────────────────────────────────────
    if (isLimeReplyToText(content)) {
        return (
            <ContactReplyToText
                date={date}
                direction={direction}
                title={content.replied.value}
                response={content.inReplyTo.value}
            />
        )
    }

    // ── REPLY TO SELECT ───────────────────────────────────
    if (isLimeReplyToSelect(content)) {
        return (
            <ContactReplyToSelectResponse
                date={date}
                direction={direction}
                response={content.inReplyTo.value.text}
                title={content.replied.value}
            />
        )
    }

    // ── REPLY TO MEDIA ────────────────────────────────────
    if (isLimeReplyToMedia(content)) {
        return (
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

    // ── REPLY TO CONTACT ──────────────────────────────────
    if (isLimeReplyToContact(content)) {
        return (
            <ContactPhoneCardResponse
                date={date}
                direction={direction}
                response={content.inReplyTo.value.name}
                title={content.replied.value}
            />
        )
    }

    return null
}
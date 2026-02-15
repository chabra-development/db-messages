/* ======================================================
 * Helpers
 * ====================================================== */

import {
    LimeReplyTextContent,
    LimeTicketMessageContent,
    LimeReplyToSelectContent
} from "@/types/lime-thread-messages-response.types"

const KNOWN_CONTENT_GUARDS = [
    isLimeReplyTextContent,
    isLimeReplyToText,
    isLimeTicketContent,
    isLimeSelectContent,
    isLimeReplyContent,
    isLimeMediaContent,
    isLimeEmojiReaction,
    isLimeInteractiveButton,
    isLimeInteractiveList,
    isLimeInteractiveMessage,
    isLimeReplyToSelectContent
] as const

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

function isString(value: unknown): value is string {
    return typeof value === "string"
}

/* ======================================================
 * Media
 * ====================================================== */

export function isLimeMediaContent(value: unknown): value is {
    type: string
    uri: string
} {
    return (
        isObject(value) &&
        isString(value.type) &&
        isString(value.uri)
    )
}

/* ======================================================
 * Emoji
 * ====================================================== */

export function isLimeEmojiReaction(value: unknown): value is {
    emoji: { values: number[] }
} {
    return (
        isObject(value) &&
        isObject(value.emoji) &&
        Array.isArray(value.emoji.values)
    )
}

/* ======================================================
 * Select
 * ====================================================== */

export function isLimeSelectContent(value: unknown): value is {
    text: string
    options: { text: string }[]
    scope?: "immediate"
} {
    return (
        isObject(value) &&
        isString(value.text) &&
        Array.isArray(value.options)
    )
}

/* ======================================================
 * Interactive – Button
 * ====================================================== */

export function isLimeInteractiveButton(
    value: unknown
): value is {
    type: "button"
    body: { text: string }
    action: { buttons: unknown[] }
} {
    return (
        isObject(value) &&
        value.type === "button" &&
        isObject(value.body) &&
        isString(value.body.text) &&
        isObject(value.action) &&
        Array.isArray(value.action.buttons)
    )
}

/* ======================================================
 * Interactive – List
 * ====================================================== */

export function isLimeInteractiveList(
    value: unknown
): value is {
    type: "list"
    body: { text: string }
    action: { sections: unknown[] }
} {
    return (
        isObject(value) &&
        value.type === "list" &&
        isObject(value.body) &&
        isString(value.body.text) &&
        isObject(value.action) &&
        Array.isArray(value.action.sections)
    )
}

/* ======================================================
 * Interactive Message
 * ====================================================== */

export function isLimeInteractiveMessage(
    value: unknown
): value is {
    type: "interactive"
    recipient_type: "individual"
    interactive: unknown
} {
    return (
        isObject(value) &&
        value.type === "interactive" &&
        value.recipient_type === "individual" &&
        "interactive" in value
    )
}

/* ======================================================
 * Reply
 * ====================================================== */

export function isLimeReplyContent(
    value: unknown
): value is {
    replied: { value: string }
    inReplyTo: {
        value: {
            type: "interactive"
            interactive: unknown
        }
    }
} {
    return (
        isObject(value) &&
        isObject(value.replied) &&
        isString(value.replied.value) &&
        isObject(value.inReplyTo) &&
        isLimeInteractiveMessage(value.inReplyTo.value)
    )
}

export function isLimeReplyToText(
    value: unknown
): value is {
    replied: { value: string }
    inReplyTo: { value: string }
} {
    return (
        isObject(value) &&
        isObject(value.replied) &&
        isString(value.replied.value) &&
        isObject(value.inReplyTo) &&
        isString(value.inReplyTo.value)
    )
}

export function isLimeReplyTextContent(
    content: unknown
): content is LimeReplyTextContent {
    if (!content || typeof content !== "object") {
        return false;
    }

    const obj = content as Record<string, unknown>;

    // replied
    if (
        !obj.replied ||
        typeof obj.replied !== "object"
    ) {
        return false;
    }

    const replied = obj.replied as Record<string, unknown>;

    if (
        replied.type !== "text/plain" ||
        typeof replied.value !== "string"
    ) {
        return false;
    }

    // inReplyTo
    if (
        !obj.inReplyTo ||
        typeof obj.inReplyTo !== "object"
    ) {
        return false;
    }

    const inReplyTo = obj.inReplyTo as Record<string, unknown>;

    if (
        typeof inReplyTo.id !== "string" ||
        inReplyTo.type !== "text/plain" ||
        typeof inReplyTo.value !== "string" ||
        (inReplyTo.direction !== "sent" &&
            inReplyTo.direction !== "received")
    ) {
        return false;
    }

    return true;
}

export function isLimeTicketContent(
    content: unknown
): content is LimeTicketMessageContent {

    if (typeof content !== "object" || content === null) {
        return false
    }

    const c = content as Record<string, unknown>

    return (
        typeof c.id === "string" &&
        typeof c.sequentialId === "number" &&
        typeof c.ownerIdentity === "string" &&
        typeof c.customerIdentity === "string" &&
        typeof c.status === "string" &&
        typeof c.storageDate === "string" &&
        typeof c.rating === "number" &&
        typeof c.unreadMessages === "number" &&
        typeof c.closed === "boolean" &&
        typeof c.priority === "number"
    )
}

export function isLimeReplyToSelectContent(
    content: unknown
): content is LimeReplyToSelectContent {

    if (typeof content !== "object" || content === null) {
        return false
    }

    const obj = content as Record<string, unknown>

    // replied
    if (
        !obj.replied ||
        typeof obj.replied !== "object"
    ) {
        return false
    }

    const replied = obj.replied as Record<string, unknown>

    if (
        replied.type !== "text/plain" ||
        typeof replied.value !== "string"
    ) {
        return false
    }

    // inReplyTo
    if (
        !obj.inReplyTo ||
        typeof obj.inReplyTo !== "object"
    ) {
        return false
    }

    const inReplyTo = obj.inReplyTo as Record<string, unknown>

    if (
        typeof inReplyTo.id !== "string" ||
        inReplyTo.type !== "application/vnd.lime.select+json" ||
        (inReplyTo.direction !== "sent" &&
            inReplyTo.direction !== "received") ||
        !isLimeSelectContent(inReplyTo.value)
    ) {
        return false
    }

    return true
}

export function isUnknownContent(content: unknown): boolean {

    if (content == null) return true;

    if (typeof content === "string") return false;

    return !KNOWN_CONTENT_GUARDS.some(guard => guard(content))
}

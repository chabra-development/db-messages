/* ======================================================
 * Helpers
 * ====================================================== */

import { KNOWN_MEDIA_MIME_TYPES, LimeReplyTextContent } from "@/types/lime-thread-messages-response.types"

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

export function isUnknownContent(content: unknown): boolean {
    // 🛑 null, undefined, primitive inesperado
    if (content == null) {
        return true;
    }

    // 1️⃣ text/plain → string
    if (typeof content === "string") {
        return false;
    }

    // daqui pra frente precisa ser objeto
    if (typeof content !== "object") {
        return true;
    }

    const obj = content as Record<string, unknown>;

    if (isLimeReplyTextContent(content)) {
        return false; // conhecido
    }

    // 2️⃣ media-link
    if (
        typeof obj.type === "string" &&
        typeof obj.uri === "string"
    ) {
        const normalizedMime = obj.type.split(";")[0].trim();

        return !KNOWN_MEDIA_MIME_TYPES.includes(normalizedMime as any);
    }

    // 3️⃣ select
    if (
        typeof obj.text === "string" &&
        Array.isArray(obj.options)
    ) {
        return false;
    }

    // 4️⃣ reply
    if (
        typeof obj.replied === "object" &&
        obj.replied !== null &&
        typeof obj.inReplyTo === "object" &&
        obj.inReplyTo !== null
    ) {
        return false;
    }

    // ❌ não bateu com nenhum formato conhecido
    return true;
}

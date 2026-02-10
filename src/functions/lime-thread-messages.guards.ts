/* ======================================================
 * Helpers
 * ====================================================== */

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

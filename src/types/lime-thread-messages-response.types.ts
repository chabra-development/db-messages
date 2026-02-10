/* ======================================================
 * LIME Thread Messages – Response
 * ====================================================== */

export type LimeThreadMessagesResponse = {
    type: "application/vnd.lime.collection+json"
    method: "get"
    status: "success" | "failure"
    id: string
    from: string
    to: string
    resource: LimeThreadMessagesResource
}

/* ======================================================
 * Resource (Collection)
 * ====================================================== */

export type LimeThreadMessagesResource = {
    total: number
    itemType: "application/vnd.iris.thread-message+json"
    items: LimeThreadMessage[]
}

/* ======================================================
 * LIME Thread Message – Base
 * ====================================================== */

export type LimeThreadMessage = {
    id: string
    direction: "sent" | "received"
    type: string
    date: string // ISO string
    status: "consumed" | "dispatched"
    content: LimeMessageContent
    metadata?: LimeMetadata
}

export type LimeMetadata = {
    // Campos comuns (quando existirem)
    $elapsedTimeToStorage?: string
    $originator?: string
    $internalId?: string
    $claims?: string
    $originatorSessionRemoteNode?: string

    // Datas (geralmente como string numérica)
    date_created?: string
    "#date_processed"?: string

    // Mensagem / estado
    "#message.agentIdentity": string,
    "#message.ticketId": string,
    "#messageId"?: string
    "#messageKind"?: "Response" | "Notification" | string
    "#previousStateId"?: string
    "#previousStateName"?: string
    "#stateId"?: string
    "#stateName"?: string

    // Identificadores
    "#uniqueId"?: string
    "#inReplyToId"?: string
    "#messageReferenceInternalID"?: string

    // WhatsApp (quando canal = WA)
    "#wa.timestamp"?: string
    "#wa.context.from"?: string
    "#wa.context.id"?: string
    "#wa.message.id"?: string
    "#wa.interactive.list.id"?: string
    "#wa.interactive.button.id"?: string
    "#wa.forwarded"?: boolean | null
    "#wa.frequently_forwarded"?: boolean | null
    "#wa.context.group_id"?: string | null

    // Tunnel / roteamento
    "#tunnel.owner"?: string
    "#tunnel.originator"?: string
    "#tunnel.originalFrom"?: string
    "#tunnel.originalTo"?: string

    // Tracing
    traceparent?: string

    // Permite QUALQUER outro metadata que o BLiP mandar
    [key: string]: unknown
}


/* ======================================================
 * Content Union
 * ====================================================== */

export type LimeMessageContent =
    | LimeTextContent
    | LimeMediaContent
    | LimeSelectContent
    | LimeReplyContent
    | LimeTemplateContent
    | LimeTicketContent
    | LimeInteractiveMessage
    | LimeEmojiReaction

/* ======================================================
 * Text
 * ====================================================== */

export type LimeTextContent = string

/* ======================================================
 * Media
 * ====================================================== */

export type LimeMediaContent = {
    type: string
    uri: string
}

/* ======================================================
 * Select
 * ====================================================== */

export type LimeSelectContent = {
    scope?: "immediate"
    text: string
    options: Array<{
        text: string
    }>
}

/* ======================================================
 * Reply
 * ====================================================== */

export type LimeReplyContent = {
    replied: {
        type: string
        value: string
    }
    inReplyTo: {
        id: string
        type: string
        direction: "sent" | "received"
        value: LimeInteractiveMessage
    }
}

export type LimeEmojiReaction = {
    emoji: {
        values: number[]
    }
    inReactionTo: {
        id: string
        type: string
        value: string
        direction: "sent" | "received"
    }
}


export type LimeReceivedInteractiveObject = {
    direction: "received" | "sent"
    object: LimeInteractiveList
}

export type LimeInteractiveMessage = {
    recipient_type: "individual"
    type: "interactive"
    interactive: LimeInteractiveContent
}

export type LimeInteractiveContent =
    | LimeInteractiveList
    | LimeInteractiveButton
    | LimeReceivedInteractiveObject


/* ======================================================
 * Template (WhatsApp)
 * ====================================================== */

export type LimeTemplateContent = {
    type: "template"
    template: {
        name: string
        language: {
            code: string
            policy: string
        }
        components: Array<{
            type: string
            parameters: Array<{
                type: string
                text?: string
            }>
        }>
    }
}

/* ======================================================
 * Ticket (Iris)
 * ====================================================== */

export type LimeTicketContent = {
    id: string
    sequentialId: number
    ownerIdentity: string
    customerIdentity: string
    customerDomain: string
    provider: string
    status: string
    storageDate: string
    externalId: string
    rating: number
    team: string
    unreadMessages: number
    closed: boolean
    priority: number
    customerInput?: {
        type: string
        value: string
    }
}

/* ======================================================
 * Interactive (WhatsApp)
 * ====================================================== */

export type LimeInteractive =
    | LimeInteractiveButton
    | LimeInteractiveList

/* ---------- Button ---------- */

export type LimeInteractiveButton = {
    type: "button"
    body: {
        text: string
    }
    action: {
        buttons: LimeInteractiveReplyButton[]
    }
}

export type LimeInteractiveReplyButton = {
    type: "reply"
    reply: {
        id: number | string
        title: string
    }
}

/* ---------- List ---------- */

export type LimeInteractiveList = {
    type: "list"
    body: {
        text: string
    }
    action: {
        button: string
        sections: Array<{
            title: string
            rows: Array<{
                id: string
                title: string
                description?: string
            }>
        }>
    }
}
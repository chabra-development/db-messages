import { stringToHTML } from "@/functions/string-to-HTML"
import { Prisma } from "@prisma/client"
import type { ComponentProps } from "react"

function getContentPreview(content: Prisma.JsonValue): string {
    if (typeof content === "string") return content

    if (typeof content === "object" && content !== null) {
        const obj = content as Record<string, unknown>

        if (obj.replied && typeof (obj.replied as Record<string, unknown>).value === "string")
            return (obj.replied as Record<string, unknown>).value as string

        if (obj.body && typeof (obj.body as Record<string, unknown>).text === "string")
            return (obj.body as Record<string, unknown>).text as string

        if (typeof obj.text === "string") return obj.text

        if (typeof obj.type === "string" && obj.uri) return `[${obj.type}]`

        if (obj.sequentialId) return `[Ticket #${obj.sequentialId}]`

        if (obj.emoji) return "[Reação]"
    }

    return "[Mensagem]"
}

type Props = Omit<ComponentProps<"div">, "children" | "content"> & {
    content: Prisma.JsonValue
}

export function MessageContentPreview({ content, ...props }: Props) {
    return stringToHTML(getContentPreview(content), props)
}

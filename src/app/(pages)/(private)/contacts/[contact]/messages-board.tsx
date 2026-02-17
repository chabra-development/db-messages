import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { isUnknownContent } from "@/guards/lime-thread-messages.guards"
import { cn } from "@/lib/utils"
import { useRef, useEffect } from "react"
import { MessageRenderer } from "./message-renderer"
import { SystemInfoDate } from "./system-info-date"
import { 
    LimeThreadMessagesResource 
} from "@/types/lime-thread-messages-response.types"

type MessagesBoardProps = { resource: LimeThreadMessagesResource }

// messages-board.tsx
export const MessagesBoard = ({ resource }: MessagesBoardProps) => {

    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant", block: "end" })
    }, [resource.items.length])

    if (resource.items.length === 0) {
        return (
            <Card className="flex-1 h-full bg-transparent border-none">
                <CardContent className="size-full flex justify-center">
                    <CardDescription className="text-xl">
                        Esse contato ainda não possui uma conversa
                    </CardDescription>
                </CardContent>
            </Card>
        )
    }

    // ✅ valida uma vez, fora do map
    const unknownMessage = resource.items.find(
        ({ content }) => isUnknownContent(content)
    )

    if (unknownMessage) {

        console.log(unknownMessage)

        throw new Error(`tipo não tratado: ${JSON.stringify(unknownMessage.content)}`)
    }

    // ✅ toReversed() não muta o original
    const itemsReversed = resource.items.toReversed()

    return (
        <CardContent className="space-y-2 px-2">
            {itemsReversed.map((message, index, array) => (
                <div
                    key={message.id}
                    className={cn(
                        "w-full max-w-full min-w-0 flex flex-col",
                        message.direction === "sent" ? "items-end" : "items-start"
                    )}
                >
                    <SystemInfoDate index={index} array={array} date={message.date} />
                    <MessageRenderer message={message} />
                </div>
            ))}
            <div ref={bottomRef} className="h-1" />
        </CardContent>
    )
}
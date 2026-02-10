import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
    extractNameFromBlipIdentity 
} from "@/functions/extract-name-from-blip-identity"
import { stringToHTML } from "@/functions/string-to-HTML"
import { cn } from "@/lib/utils"
import { LimeMetadata } from "@/types/lime-thread-messages-response.types"
import { formatDate } from "date-fns"

export const ContactMessage = ({
    direction,
    content,
    date,
    metadata
}: {
    direction: "sent" | "received"
    content: string
    date: string
    metadata?: LimeMetadata
}) => {
    return (
        <Alert className={cn(
            "max-w-[70%] w-fit text-sm text-foreground shadow-2xl space-y-2",
            "@max-5xl/chat:max-w-9/10",
            direction === "sent"
                ? "dark:bg-[#144d37] bg-[#d9fdd3] rounded-tr-none"
                : "dark:bg-muted bg-zinc-100 rounded-tl-none"
        )}>
            {
                metadata?.["#message.agentIdentity"] && (
                    <AlertTitle className="capitalize">
                        {extractNameFromBlipIdentity(metadata?.["#message.agentIdentity"])}
                    </AlertTitle>
                )
            }
            <AlertTitle className="tracking-normal leading-normal break-words whitespace-pre-wrap block">
                {stringToHTML(content)}
            </AlertTitle>
            <AlertDescription className="ml-auto">
                {formatDate(date, "HH:mm")}
            </AlertDescription>
        </Alert>
    )
}

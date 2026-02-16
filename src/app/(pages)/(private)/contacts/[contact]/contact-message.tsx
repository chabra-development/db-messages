import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { stringToHTML } from "@/functions/string-to-HTML"
import { cn } from "@/lib/utils"
import { formatDate } from "date-fns"

export const ContactMessage = ({
    direction,
    content,
    date,
}: {
    direction: "sent" | "received"
    content: string
    date: string
}) => {
    return (
        <Alert className={cn(
            "max-w-[70%] w-fit text-sm text-foreground shadow-2xl space-y-2",
            "@max-5xl/chat:max-w-9/10",
            direction === "sent"
                ? "bg-message rounded-tr-none"
                : "dark:bg-muted bg-zinc-100 rounded-tl-none"
        )}>
            <AlertTitle className="tracking-normal leading-normal wrap-break-word whitespace-pre-wrap block">
                {stringToHTML(content)}
            </AlertTitle>
            <AlertDescription className="ml-auto">
                {formatDate(date, "HH:mm")}
            </AlertDescription>
        </Alert>
    )
}

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { stringToHTML } from "@/functions/string-to-HTML"
import { cn } from "@/lib/utils"
import { formatDate } from "date-fns"

export const ContactScopeTextResponse = ({
    direction,
    date,
    title
}: {
    direction: "sent" | "received"
    title: string
    date: string
}) => {
    return (
        <Alert className={cn(
            "max-w-[70%] w-fit text-sm text-foreground shadow-2xl space-y-2",
            "@max-5xl/chat:max-w-9/10",
            direction === "sent"
                ? "dark:bg-[#144d37] bg-[#d9fdd3] rounded-tr-none"
                : "dark:bg-muted bg-zinc-100 rounded-tl-none"
        )}>
            <AlertTitle className="tracking-normal leading-normal break-words whitespace-pre-wrap block">
                {stringToHTML(title)}
            </AlertTitle>
            <AlertDescription className="ml-auto">
                {formatDate(date, "HH:mm")}
            </AlertDescription>
        </Alert>
    )
}

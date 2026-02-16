import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { stringToHTML } from "@/functions/string-to-HTML"
import { cn } from "@/lib/utils"
import { formatDate } from "date-fns"

export const ContactReplyToSelectResponse = ({
    direction,
    date,
    response,
    title
}: {
    direction: "sent" | "received"
    date: string
    response: string
    title: string
}) => {
    return (
        <Card
            className={cn(
                "w-full max-w-md text-sm py-2 gap-2", // ⭐ w-1/2 → w-full max-w-md
                "@max-5xl/chat:max-w-[90%]", // ⭐ w-9/10 → max-w-[90%]
                direction === "sent"
                    ? "bg-message rounded-tr-none"
                    : "bg-muted rounded-tl-none"
            )}
        >
            <CardHeader className="px-1">
                <CardTitle className="max-h-8 h-fit bg-card/30 py-2.5 px-4 rounded-sm text-muted-foreground truncate">
                    {stringToHTML(response)}
                </CardTitle>
            </CardHeader>
            <CardHeader className="px-1">
                <CardTitle className="px-2 rounded-md wrap-break-word">
                    {stringToHTML(title)}
                </CardTitle>
            </CardHeader>
            <CardFooter className="ml-auto">
                <CardDescription>
                    {formatDate(date, "HH:mm")}
                </CardDescription>
            </CardFooter>
        </Card>
    )
}

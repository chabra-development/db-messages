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

export const ContactScopeTextResponse = ({
    direction,
    date,
    title,
    content
}: {
    direction: "sent" | "received"
    title: string
    date: string,
    content: any
}) => {

    const response = content.inReplyTo.value.interactive.body.text

    return (
        <Card className={cn(
            "w-1/2 text-sm",
            "@max-5xl/chat:w-9/10 py-1 gap-2",
            direction === "sent"
                ? "bg-message rounded-tr-none"
                : "bg-muted rounded-tl-none"
        )}>
            <CardHeader className="px-1">
                <CardTitle className="bg-card/30 py-2.5 px-4 rounded-sm text-muted-foreground">
                    {
                        stringToHTML(response)
                    }
                </CardTitle>
            </CardHeader>
            <CardHeader className="px-1">
                <CardTitle className="px-2 rounded-md">
                    {
                        stringToHTML(title)
                    }
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



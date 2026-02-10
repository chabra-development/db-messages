import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDate } from "date-fns"
import { ContactInterativeListRow } from "./contact-interative-list-row"
import { stringToHTML } from "@/functions/string-to-HTML"

type ContactInterativeListProps = {
    direction: "sent" | "received"
    title: string
    date: string
    sections: {
        title: string;
        rows: {
            id: string;
            title: string;
            description?: string | undefined;
        }[];
    }[]
}

export const ContactInterativeList = ({
    direction,
    title,
    date,
    sections
}: ContactInterativeListProps) => {
    return (
        <Card className={cn(
            "w-1/2 text-sm",
            "@max-5xl/chat:w-9/10",
            direction === "sent"
                ? "dark:bg-[#144d37] bg-[#d9fdd3] rounded-tr-none"
                : "dark:bg-muted bg-zinc-100 rounded-tl-none"
        )}>
            <CardHeader>
                <CardTitle>
                    {stringToHTML(title)}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-4">
                {
                    sections.map(({ title, rows }) => (
                        <Card
                            key={title}
                            className={cn(
                                "w-full text-sm",
                                direction === "sent"
                                    ? "dark:bg-[#144d37] bg-[#d9fdd3]"
                                    : "dark:bg-muted bg-zinc-100"
                            )}
                        >
                            <CardContent className="space-y-1.5">
                                {
                                    rows.map((row) => (
                                        <ContactInterativeListRow
                                            key={row.id}
                                            row={row}
                                        />
                                    ))
                                }
                            </CardContent>
                        </Card>
                    ))
                }
            </CardContent>
            <CardFooter>
                <CardDescription className="ml-auto">
                    {formatDate(date, "HH:mm")}
                </CardDescription>
            </CardFooter>
        </Card>
    )
}

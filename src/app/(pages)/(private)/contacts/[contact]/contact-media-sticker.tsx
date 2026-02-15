import { Card, CardDescription, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDate } from "date-fns"
import Image from "next/image"

export const ContactMediaSticker = ({
    direction,
    date,
    uri,
    type
}: {
    direction: "sent" | "received"
    date: string
    uri: string
    type: string
}) => {
    return (
        <Card className="bg-transparent border-none shadow-none gap-1">
            <Image
                src={uri}
                width={200}
                height={200}
                alt={`figurinha ${type}`}
                className="relative size-32"
            />
            <CardFooter
                className={cn(
                    "w-fit ml-auto rounded-sm p-1",
                    direction === "sent"
                        ? "bg-message"
                        : "dark:bg-muted bg-zinc-100"
                )}
            >
                <CardDescription>
                    {formatDate(date, "HH:mm")}
                </CardDescription>
            </CardFooter>
        </Card>
    )
}

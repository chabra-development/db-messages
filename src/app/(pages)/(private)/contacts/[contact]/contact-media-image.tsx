import { Card, CardDescription, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDate } from "date-fns"
import Image from "next/image"

export const ContactMediaImage = ({
    direction,
    date,
    uri,
    type,
    id
}: {
    direction: "sent" | "received"
    date: string
    uri: string
    type: string
    id: string
}) => {
    return (
        <Card
            id={id}
            className={cn(
                "relative w-full max-w-xs bg-transparent border-none shadow-none gap-1 p-2",
                direction === "sent"
                    ? "bg-message"
                    : "dark:bg-muted bg-zinc-100"
            )}
        >
            <Image
                src={uri}
                width={400}
                height={400}
                alt={`imagem ${type}`}
                className="rounded-md size-full relative"
            />
            <CardFooter className="w-fit ml-auto rounded-sm p-1 absolute bottom-2.5 right-2.5">
                <CardDescription className="text-primary">
                    {formatDate(date, "HH:mm")}
                </CardDescription>
            </CardFooter>
        </Card>
    )
}

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
import { FileImage, Sticker } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export const ContactImageResponse = ({
    direction,
    date,
    uri,
    type,
    response,
    id
}: {
    direction: "sent" | "received"
    date: string
    uri: string
    type: string
    response: string
    id: string
}) => {

    const isSticker = type.includes("sticker")

    const Icon = isSticker ? Sticker : FileImage

    return (
        <a
            href={`#${id}`}
            className={cn(
                "w-1/4", "@max-5xl/chat:w-9/10"
            )}
        >
            <Card className={cn(
                "w-full text-sm",
                "py-1 gap-1.5",
                direction === "sent"
                    ? "bg-message rounded-tr-none"
                    : "bg-muted rounded-tl-none"
            )}>
                <CardHeader className="w-[97%] self-center bg-card/30 px-1.5 rounded-sm">
                    <div className="w-full flex justify-between">
                        <div className="w-fit px-1.5 flex items-center justify-center gap-2 text-muted-foreground">
                            <Icon className="size-4" />
                            {
                                isSticker ? "Figurinha" : "Foto"
                            }
                        </div>
                        <div className={cn(isSticker ? "size-16" : "size-24")}>
                            <Image
                                src={uri}
                                width={100}
                                height={100}
                                quality={40}
                                alt={`imagem ${type}`}
                                className="object-cover size-full rounded-tr-md"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardHeader className="px-1 pt-2">
                    <CardTitle className="px-2 rounded-md">
                        {stringToHTML(response)}
                    </CardTitle>
                </CardHeader>
                <CardFooter className="ml-auto pb-2 px-2">
                    <CardDescription>
                        {formatDate(date, "HH:mm")}
                    </CardDescription>
                </CardFooter>
            </Card>
        </a>
    )
}



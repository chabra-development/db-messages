import { Card, CardDescription, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDate } from "date-fns"
import Image from "next/image"
import { useState } from "react"

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

    const [loaded, setLoaded] = useState(false)

    return (
        <Card
            id={id}
            className={cn(
                "relative w-full max-w-xs overflow-hidden border-none shadow-none p-2",
                direction === "sent"
                    ? "bg-message"
                    : "dark:bg-muted bg-zinc-100"
            )}
        >
            {/* Container da imagem com aspect ratio */}
            <div className="relative w-full aspect-square rounded-md overflow-hidden">
                {/* Placeholder blur */}
                {!loaded && (
                    <div className="absolute inset-0 bg-linear-to-br from-muted via-muted-foreground/10 to-muted animate-pulse" />
                )}

                {/* Imagem principal */}
                <Image
                    src={uri}
                    fill
                    alt={`imagem ${type}`}
                    className={cn(
                        "object-cover rounded-md transition-opacity duration-500",
                        loaded ? "opacity-100" : "opacity-0"
                    )}
                    sizes="(max-width: 768px) 100vw, 320px"
                    onLoad={() => setLoaded(true)}
                />
            </div>
            <CardFooter className="w-fit ml-auto rounded-sm p-1 absolute bottom-2.5 right-2.5 bg-transparent backdrop-blur-sm">
                <CardDescription className="text-white font-medium">
                    {formatDate(date, "HH:mm")}
                </CardDescription>
            </CardFooter>
        </Card>
    )
}
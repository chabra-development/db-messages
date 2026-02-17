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
    const [dimensions, setDimensions] = useState({ width: 400, height: 400 })

    return (
        <Card
            id={id}
            className={cn(
                "relative w-full max-w-1/2 border-none shadow-none p-2",
                direction === "sent"
                    ? "bg-message"
                    : "dark:bg-muted bg-zinc-100"
            )}
        >
            {/* Container com aspect ratio dinâmico */}
            <div
                className="relative w-full rounded-md overflow-hidden"
                style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
            >
                {/* Placeholder blur */}
                {!loaded && (
                    <div className="absolute inset-0 bg-linear-to-br from-muted via-muted-foreground/10 to-muted animate-pulse" />
                )}

                {/* Imagem principal */}
                <Image
                    src={uri}
                    width={dimensions.width}
                    height={dimensions.height}
                    alt={`imagem ${type}`}
                    className={cn(
                        "w-full h-auto rounded-md transition-opacity duration-500",
                        loaded ? "opacity-100" : "opacity-0"
                    )}
                    sizes="(max-width: 768px) 100vw, 320px"
                    onLoad={(e) => {
                        const img = e.currentTarget
                        setDimensions({
                            width: img.naturalWidth,
                            height: img.naturalHeight
                        })
                        setLoaded(true)
                    }}
                />
            </div>
            <CardFooter className="w-fit ml-auto rounded-sm p-1 absolute bottom-2.5 right-2.5 bg-black/30 backdrop-blur-sm">
                <CardDescription className="text-white font-medium">
                    {formatDate(date, "HH:mm")}
                </CardDescription>
            </CardFooter>
        </Card>
    )
}
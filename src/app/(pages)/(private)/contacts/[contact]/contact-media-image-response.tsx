"use client"

import { useEffect, useState, useTransition } from "react"
import { generateVideoThumbnail } from "@/functions/generate-video-thumbnail"
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
import { FileImage, Sticker, FileVideo } from "lucide-react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

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

    const [thumb, setThumb] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {

        let isMounted = true

        if (!type.includes("video")) return 

        generateVideoThumbnail(uri).then((image) => {

            if (!isMounted) return

            startTransition(() => {
                setThumb(image)
            })
        })

        return () => {
            isMounted = false
        }
    }, [uri])

    const [typeSplited] = type.split("/")

    const Icon = typeSplited === "video" ? FileVideo : FileImage

    console.log(typeSplited)

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
                            {typeSplited}
                        </div>
                        <div className={cn("size-24")}>
                            {
                                isPending && (
                                    <Skeleton className="size-full rounded-tr-md" />
                                )
                            }
                            {
                                thumb
                                    ? (
                                        <Image
                                            src={thumb}
                                            width={100}
                                            height={100}
                                            quality={40}
                                            alt={`imagem ${type}`}
                                            className="object-cover size-full rounded-tr-md"
                                        />
                                    )
                                    : (
                                        <Image
                                            src={uri}
                                            width={100}
                                            height={100}
                                            quality={40}
                                            alt={`imagem ${type}`}
                                            className="object-cover size-full rounded-tr-md"
                                        />
                                    )
                            }
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
        </a >
    )
}



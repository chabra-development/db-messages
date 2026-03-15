"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function ContactCardSkeleton({ opacity }: { opacity: string }) {
    return (
        <Card className={cn("w-full", opacity)}>
            <CardHeader>
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-3 w-1/2 rounded-full mt-1" />
            </CardHeader>
        </Card>
    )
}

function MessageCardSkeleton({ opacity }: { opacity: string }) {
    return (
        <div className={cn("flex flex-col gap-2 rounded-lg px-3 py-2.5 bg-muted/50", opacity)}>
            <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-2/5 rounded-full" />
                <Skeleton className="h-3 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-3/4 rounded-full" />
        </div>
    )
}

const opacities = ["", "opacity-70", "opacity-45", "opacity-25"]

export function ContactSearchSkeleton() {
    return (
        <CardContent className="px-2 pt-4 pb-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <ContactCardSkeleton key={i} opacity={opacities[i] ?? "opacity-10"} />
            ))}
        </CardContent>
    )
}

export function MessageSearchSkeleton() {
    return (
        <CardContent className="px-2 pt-4 pb-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <MessageCardSkeleton key={i} opacity={opacities[i] ?? "opacity-10"} />
            ))}
        </CardContent>
    )
}

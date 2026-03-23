"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Ellipsis } from "lucide-react"

export const TagClientLoading = () => {
    return (
        <Card className="w-full border-none shadow-none rounded-none">
            <CardHeader>
                <CardTitle className="text-2xl">
                    Tags
                </CardTitle>
                <CardDescription className="text-base">
                    Adicione, atualize e exclua tags para os contatos
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 grid grid-cols-2 gap-2">
                {
                    Array.from({ length: 12 }).map((_, index) => (
                        <Card
                            key={index}
                            className="text-sm gap-2 bg-background"
                        >
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    <Skeleton className="rounded-full" />
                                </CardTitle>
                                <CardAction>
                                    <Button disabled variant={"ghost"}>
                                        <Ellipsis />
                                    </Button>
                                </CardAction>
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-2/3 rounded-full" />
                            </CardContent>
                        </Card>
                    ))
                }
            </CardContent>
        </Card>
    )
}
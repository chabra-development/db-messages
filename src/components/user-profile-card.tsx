"use client"

import { findUserByUser } from "@/actions/users/find-user-by-id"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { getInitials } from "@/functions/get-initials"
import { useQuery } from "@tanstack/react-query"
import { Ellipsis } from "lucide-react"
import Image from "next/image"
import { Skeleton } from "./ui/skeleton"

export function UserProfileCard({ id }: { id: string }) {

    const { data: user, isLoading } = useQuery({
        queryKey: ["find-user-by-id", id],
        queryFn: () => findUserByUser(id)
    })

    if (!user || isLoading) {
        return (
            <Card className="w-1/2 rounded-2xl pt-0 overflow-hidden">
                <div className="w-full h-64 border-b flex relative">
                    <div className="size-full bg-secondary" />
                </div>
                <div className="size-full gap-0 -translate-y-16 px-6 space-y-4">
                    <Avatar className="size-20 border">
                        <AvatarImage />
                        <AvatarFallback className="scale-100">
                            <Ellipsis />
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                        <CardTitle className="capitalize">
                            <Skeleton className="h-6"/>
                        </CardTitle>
                        <CardDescription>
                            <Skeleton className="h-4 w-2/3"/>
                        </CardDescription>
                    </div>
                </div>
            </Card>
        )
    }

    const { banner, image, name, email } = user

    return (
        <Card className="w-1/2 rounded-2xl pt-0 overflow-hidden">
            <div className="w-full h-64 border-b flex relative">
                {
                    banner
                        ? (
                            <Image
                                src={banner}
                                alt="Banner"
                                fill
                                className="object-cover"
                                priority
                            />
                        )
                        : (
                            <div className="size-full bg-secondary" />
                        )
                }
            </div>
            <div className="size-full gap-0 -translate-y-16 px-6 space-y-4">
                <Avatar className="size-20 border">
                    <AvatarImage
                        src={image || undefined}
                        alt={`Avatar de ${name}`}
                        className="object-cover"
                    />
                    <AvatarFallback className="scale-250">
                        {getInitials(name)}
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                    <CardTitle className="capitalize">
                        {name}
                    </CardTitle>
                    <CardDescription>
                        {email}
                    </CardDescription>
                </div>
            </div>
        </Card>
    )
}

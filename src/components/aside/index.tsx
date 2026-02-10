"use client"

import { findManyContacts } from "@/actions/blip/find-many-contacts"
import { SearchInput } from "@/components/seach-input"
import { toast } from "@/components/toast"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { normalizeWhatsAppIdentify } from "@/functions/validate-identify"
import { LimeContact } from "@/types/lime-collection-response.types"
import { useQuery } from "@tanstack/react-query"
import { Contact } from "lucide-react"
import { AsideLoading } from "./aside-loading"
import { ContactCardItem } from "./contact-card-item"

export const Aside = () => {

    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ["find-many-contacts"],
        queryFn: () => findManyContacts()
    })

    if (isLoading || !data) {
        return (
            <AsideLoading />
        )
    }

    if (error) {
        return (
            toast({
                title: error.name,
                duration: Infinity,
                description: error.message,
                variant: "destructive",
                action: {
                    label: "Tentar novamente",
                    onClick: () => refetch()
                }
            })
        )
    }

    const { resource } = data

    function removeDuplicatedIdentities<
        T extends { identity: string }
    >(items: T[]) {

        const seen = new Set<string>()

        return items.filter(item => {

            if (seen.has(normalizeWhatsAppIdentify(item.identity))) {
                return false
            }

            seen.add(item.identity)

            return true
        })
    }

    const items = removeDuplicatedIdentities(resource.items)

    console.log(items)

    return (
        <Card className="size-full rounded-none">
            <CardHeader>
                <SearchInput />
            </CardHeader>
            <ScrollArea className="min-h-200 size-full border-t pt-4">
                <ScrollBar />
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Contact className="size-6" />
                        Contatos
                        <Badge className="h-full">
                            {resource.total}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="px-2 size-full pt-4">
                    {
                        items.map((limeContact, index) => {

                            if (limeContact.phoneNumber) {
                                console.log(limeContact)
                            } else {
                                console.log("nao tem nao")
                            }

                            return (
                                <ContactCardItem
                                    key={`${limeContact.identity}-${index}`}
                                    limeContact={limeContact}
                                />
                            )
                        })
                    }
                </CardContent>
            </ScrollArea>
        </Card>
    )
}

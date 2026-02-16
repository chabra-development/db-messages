"use client"

import {
    findContactIdByNumberPhone
} from "@/actions/blip/find-contact-id-by-number-phone"
import {
    findMessagesByIdentifyContact
} from "@/actions/blip/find-messages-by-identify-contact"
import { MessagesBoard } from "@/app/(pages)/(private)/contacts/[contact]/messages-board"
import { toast } from "@/components/toast"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
    normalizeWhatsAppIdentify
} from "@/functions/normalize-whatsapp-identify"
import { useQuery } from "@tanstack/react-query"
import { ContactsQueryLoading } from "./contacts-query-loading"

export const ContactsQuery = ({ identity }: { identity: string }) => {

    const numberPhone = normalizeWhatsAppIdentify(identity).slice(0, 13)

    const {
        data: contact,
        isLoading: contactIsLoading
    } = useQuery({
        queryKey: ["find-contact-id-by-number-phone", identity],
        queryFn: () => findContactIdByNumberPhone(numberPhone),
        staleTime: 1000 * 60 * 5,
    })

    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ["find-many-messages-by-identify", identity],
        queryFn: () => findMessagesByIdentifyContact(identity),
    })

    if (error) {
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

        return null
    }

    if (isLoading || !data) {
        return <ContactsQueryLoading />
    }

    const { resource } = data

    return (
        <Card className="size-full border-none rounded-none gap-0">
            {contact && (
                <CardHeader className="border-b pb-3 gap-0">
                    <CardTitle className="text-2xl mb-1.25 truncate">
                        {contactIsLoading ? (
                            <Skeleton className="h-8 w-full rounded-full" />
                        ) : (
                            contact.resource.fullName
                        )}
                    </CardTitle>
                    <CardDescription className="truncate">
                        {contactIsLoading ? (
                            <Skeleton className="h-6 w-full rounded-full" />
                        ) : (
                            contact.resource.phoneNumber
                        )}
                    </CardDescription>
                </CardHeader>
            )}
            <ScrollArea className="flex-1 min-h-1 py-8">
                <ScrollBar />
                <MessagesBoard resource={resource} />
            </ScrollArea>
        </Card>
    )
}
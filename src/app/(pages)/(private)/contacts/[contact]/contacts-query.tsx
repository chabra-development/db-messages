"use client"

import { findContactById } from "@/actions/contacts/find-contact-by-id"
import { toast } from "@/components/toast"
import {
    Card,
    CardAction,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { MessagesBoard } from "@/contacts/messages-board"
import { useQuery } from "@tanstack/react-query"
import { ContactHeaderDropMenu } from "./contact-header-drop-menu"
import { ContactHeaderSearch } from "./contact-header-search"
import { ContactsQueryLoading } from "./contacts-query-loading"
import { Prisma } from "@prisma/client"

export type ContactWithRelations = Prisma.ContactGetPayload<{
    include: {
        messages: true
        tags: true
    }
}>

export const ContactsQuery = ({ id }: { id: string }) => {

    const {
        error,
        data: contact,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ["find-many-contacts", id],
        queryFn: () => findContactById<ContactWithRelations>(id, {
            include: {
                messages: true,
                tags: true,
            }
        }),
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

        return
    }

    if (isLoading || !contact) {
        return <ContactsQueryLoading />
    }

    const { name, phoneNumber, messages } = contact

    return (
        <Card className="size-full border-none rounded-none gap-0">
            {contact && (
                <CardHeader className="border-b pb-3 gap-0">
                    <CardTitle className="text-2xl mb-1.25 truncate">
                        {name}
                    </CardTitle>
                    <CardDescription className="truncate">
                        {phoneNumber && phoneNumber}
                    </CardDescription>
                    <CardAction className="flex items-center gap-2">
                        <ContactHeaderSearch />
                        <ContactHeaderDropMenu contactId={id} />
                    </CardAction>
                </CardHeader>
            )}
            <ScrollArea className="flex-1 min-h-1 py-8">
                <ScrollBar />
                <MessagesBoard messages={messages} />
            </ScrollArea>
        </Card>
    )
}
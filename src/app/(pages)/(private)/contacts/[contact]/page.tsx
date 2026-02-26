import {
    findContactIdByNumberPhone
} from "@/actions/blip/find-contact-id-by-number-phone"
import { ContactsQuery } from "./contacts-query"
import { prisma } from "@/lib/prisma"

type ContactParams = {
    params: Promise<{ contact: string }>
}

export async function generateMetadata({ params }: ContactParams) {

    const { contact } = await params

    const contactData = await prisma.contact.findUnique({
        where: {
            id: contact
        },
        select: {
            name: true
        }
    })

    const name = contactData?.name ?? ""

    return {
        title: `conversa com ${name} | db-message`
    }
}

export default async function Contact({ params }: ContactParams) {

    const contact = decodeURIComponent((await params).contact)

    return (
        <ContactsQuery id={contact} />
    )
}
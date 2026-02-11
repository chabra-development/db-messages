import {
    findContactIdByNumberPhone
} from "@/actions/blip/find-contact-id-by-number-phone"
import { ContactsQuery } from "./contacts-query"

type ContactParams = {
    params: Promise<{ contact: string }>
}

export async function generateMetadata({ params }: ContactParams) {

    const { contact } = await params

    const numberPhone = contact.slice(0, 13)

    const data = await findContactIdByNumberPhone(numberPhone)

    const name = data.resource.fullName

    return {
        title: `conversa com ${name} | db-message`
    }
}

export default async function Contact({ params }: ContactParams) {

    const contact = decodeURIComponent((await params).contact)

    return (
        <ContactsQuery identity={contact} />
    )
}
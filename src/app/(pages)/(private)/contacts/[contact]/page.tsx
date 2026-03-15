import { findContactById } from "@/actions/contacts/find-contact-by-id"
import { Suspense } from "react"
import { ContactsQuery } from "./contacts-query"
import { ContactsQueryLoading } from "./contacts-query-loading"

type ContactParams = {
    params: Promise<{ contact: string }>
}

export async function generateMetadata({ params }: ContactParams) {

    const { contact } = await params

    const contactData = await findContactById<{ name: string }>(contact, {
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
        <Suspense fallback={<ContactsQueryLoading />}>
            <ContactsQuery id={contact} />
        </Suspense>
    )
}
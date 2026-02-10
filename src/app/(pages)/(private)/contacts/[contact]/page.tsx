import {
    findContactIdByNumberPhone
} from "@/actions/blip/find-contact-id-by-number-phone"
import { ContactsQuery } from "./contacts-query"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Aside } from "@/components/aside"

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
        <>
            <ResizablePanelGroup
                direction="horizontal"
                className="min-h-[200px] md:min-w-[450px] flex-1"
            >
                <ResizablePanel
                    defaultSize={25}
                    minSize={15}
                >
                    <Aside />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel
                    defaultSize={75}
                    minSize={40}
                    className="flex"
                >
                    <ContactsQuery identity={contact} />
                </ResizablePanel>
            </ResizablePanelGroup>
        </>
    )
}
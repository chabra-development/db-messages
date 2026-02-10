import { Aside } from "@/components/aside"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: `contatos | db-message`
}

export default async function Contact() {
    return (
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
            />
        </ResizablePanelGroup>
    )
}
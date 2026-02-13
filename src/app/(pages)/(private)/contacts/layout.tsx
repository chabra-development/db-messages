import { Aside } from "@/components/aside"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { MessageCircleX } from "lucide-react"
import { Metadata } from "next"
import { LayoutProps } from "@/types/index.types"

export const metadata: Metadata = {
    title: `contatos | db-message`
}

export default async function LayoutContact({ children }: LayoutProps) {
    return (
        <ResizablePanelGroup
            direction="horizontal"
            className="flex-1"
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
                className="flex items-center justify-center"
            >
                {children}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
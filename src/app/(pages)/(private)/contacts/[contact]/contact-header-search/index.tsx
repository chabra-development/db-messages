import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetContent,
    SheetTrigger
} from "@/components/ui/sheet"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Images, Search } from "lucide-react"
import { usePathname } from "next/navigation"
import { MediaTabs } from "./media-tabs"
import { SearchTab } from "./search-tab"

export const ContactHeaderSearch = () => {

    const pathname = usePathname()

    const [, , contactId] = pathname.split("/")

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant={"ghost"}>
                    <Search className="size-5" />
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-card pt-8">
                <Tabs
                    defaultValue="search"
                    className="size-full"
                >
                    <TabsList
                        variant="line"
                        className="w-full transition-all"
                    >
                        <TabsTrigger value="search">
                            <Search />
                            Pesquisa
                        </TabsTrigger>
                        <TabsTrigger value="midias">
                            <Images />
                            Midias
                        </TabsTrigger>
                    </TabsList>
                    <Separator className="-translate-y-2" />
                    <TabsContent value="search">
                        <SearchTab />
                    </TabsContent>
                    <TabsContent
                        value="midias"
                        className="h-full flex flex-col justify-baseline pt-4"
                    >
                        <MediaTabs contactId={contactId} />
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}

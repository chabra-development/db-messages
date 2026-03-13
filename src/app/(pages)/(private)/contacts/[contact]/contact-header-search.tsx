import { findMessagesMediaByContactId } from "@/actions/messages/find-messages-media-by-contact-id"
import { CaledarRange } from "@/components/caledar-range"
import { SearchInput } from "@/components/seach-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet"
import { useQuery } from "@tanstack/react-query"
import { Calendar, Images, Search } from "lucide-react"
import { AccordeonSheetContact } from "./accordion-sheet-contact"

export const ContactHeaderSearch = ({ contactId }: { contactId: string }) => {

    const { data: messagesWithMedia, isLoading } = useQuery({
        queryKey: ["find-many-media-by-contact-id", contactId],
        queryFn: () => findMessagesMediaByContactId(contactId)
    })

    if (!messagesWithMedia || isLoading) {
        return (
            <Button
                disabled
                variant={"ghost"}
            >
                <Search className="size-5" />
            </Button>
        )
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant={"ghost"}>
                    <Search className="size-5" />
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-card">
                <SheetHeader className="flex-row items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size={"icon"}
                                variant="outline"
                            >
                                <Calendar />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="-translate-x-10 bg-card"
                        >
                            <DropdownMenuGroup>
                                <DropdownMenuItem asChild>
                                    <CaledarRange />
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <SheetTitle>
                        Pesquisar mensagens
                    </SheetTitle>
                </SheetHeader>
                <div className="px-4">
                    <SearchInput
                        type="search"
                        className="rounded-full"
                    />
                </div>
                <Separator />
                <Card className="mx-4">
                    <CardHeader>
                        <CardTitle>
                            <div className="flex items-center gap-2">
                                <Images />
                                Medias, links e docs ({messagesWithMedia.length})
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AccordeonSheetContact messages={messagesWithMedia as any} />
                    </CardContent>
                </Card>
                <SheetFooter>
                    <Button variant={"secondary"}>
                        <Images />
                        Mostrar todas as midias
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

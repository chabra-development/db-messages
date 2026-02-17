import { CaledarRange } from "@/components/caledar-range"
import { SearchInput } from "@/components/seach-input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet"
import { Calendar, Search } from "lucide-react"

export const ContactHeaderSearch = () => {
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
                    <SearchInput className="rounded-full" />
                </div>
            </SheetContent>
        </Sheet>
    )
}

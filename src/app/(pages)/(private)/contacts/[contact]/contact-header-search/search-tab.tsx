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
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet"
import { Calendar } from "lucide-react"

export const SearchTab = () => {
    return (
        <>
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
        </>
    )
}

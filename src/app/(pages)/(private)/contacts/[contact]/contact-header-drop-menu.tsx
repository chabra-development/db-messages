import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Heart, MoreVertical, Pin, RefreshCcw } from "lucide-react"

export const ContactHeaderDropMenu = () => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size={"icon"}
                    variant="ghost"
                >
                    <MoreVertical className="size-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="bg-card"
            >
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <Heart />
                        Adicionar aos favoritos
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <RefreshCcw />
                        Sincronizar mensagens
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Pin />
                        Fixar contato
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

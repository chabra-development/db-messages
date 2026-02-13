import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Ellipsis } from "lucide-react"
import { useRouter } from "next/navigation"

export const ChangeRoleUserDialog = () => {

    const { push } = useRouter()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={"ghost"}>
                    <Ellipsis />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="start">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>
                        Opções
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenu>
                        <DropdownMenuItem onClick={() => push("/change-role-attendants")}>
                            Alterar cargo do atendente
                        </DropdownMenuItem>
                    </DropdownMenu>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
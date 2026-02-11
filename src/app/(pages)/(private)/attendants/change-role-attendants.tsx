import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Role } from "@prisma/client"
import { Ellipsis } from "lucide-react"

export const ChangeRoleUserDialog = () => {

    const roles: Role[] = ["ADMIN", "SUPERVISOR", "USER"]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
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
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            Alterar cargo do atendente
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                {
                                    roles.map(role => (
                                        <DropdownMenuItem key={role}>
                                            {role}
                                        </DropdownMenuItem>
                                    ))
                                }
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
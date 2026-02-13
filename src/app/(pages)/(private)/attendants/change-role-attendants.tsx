import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Ellipsis } from "lucide-react"
import { DropdownMenuItemAlert } from "./dropdown-menu-item-alert"
import { User } from "@prisma/client"
import { useState } from "react"

export const ChangeRoleUserDialog = ({ user }: { user: User }) => {

    const [open, setOpen] = useState(false)
    const { name } = user

    return (
        <DropdownMenu
            open={open}
            onOpenChange={setOpen}
        >
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
                        <DropdownMenuItemAlert
                            title={`Alterar cargo do atendente "${name}"`}
                            description=""
                            user={user}
                            setDropdownOpen={setOpen}
                        >
                            Alterar cargo do atendente
                        </DropdownMenuItemAlert>
                    </DropdownMenu>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 
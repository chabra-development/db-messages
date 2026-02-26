import { FormCreateContactTags } from "@/components/forms/form-create-contact-tags"
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Bookmark,
    Heart,
    MoreVertical,
    Pin,
    RefreshCcw
} from "lucide-react"
import { useState } from "react"

export const ContactHeaderDropMenu = ({ contactId }: { contactId: string }) => {

    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <>
            <AlertDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            >
                <AlertDialogContent className="w-1/3 bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Adicionar tags
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <Card className="pt-4">
                        <CardContent className="px-4">
                            <FormCreateContactTags contactId={contactId} />
                        </CardContent>
                    </Card>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            type="button"
                            variant="destructive"
                            className="w-1/3"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <Button
                            form="form-create-contact-tags"
                            type="submit"
                            className="w-1/3"
                        >
                            Salvar
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <DropdownMenu
                open={dropdownOpen}
                onOpenChange={setDropdownOpen}
            >
                <DropdownMenuTrigger asChild>
                    <Button
                        size={"icon"}
                        variant="ghost"
                    >
                        <MoreVertical className="size-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card">
                    <DropdownMenu
                        open={dropdownOpen}
                        onOpenChange={setDropdownOpen}
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
                            <DropdownMenuItem onSelect={e => {
                                e.preventDefault()
                                setDialogOpen(true)
                            }}>
                                <Bookmark />
                                Adicionar tag
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <RefreshCcw />
                                Importar mensagens
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenu>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
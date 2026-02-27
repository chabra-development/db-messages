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
import { Spinner } from "@/components/ui/spinner"
import { useMutationState } from "@tanstack/react-query"
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

    const [status] = useMutationState({
        filters: { mutationKey: ["create-contact-tag"] },
        select: (mutation) => mutation.state.status
    })

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
                            disabled={status === "pending"}
                            className="w-1/3"
                        >
                            {
                                status === "pending"
                                    ? (
                                        <Spinner />
                                    )
                                    : "Salvar"
                            }
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
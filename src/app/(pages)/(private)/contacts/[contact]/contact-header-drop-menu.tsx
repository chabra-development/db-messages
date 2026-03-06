import {
    findManyContactsTagByContactId
} from "@/actions/contact-tag/find-many-contacts-tag-by-contact-id"
import { toggleFavoriteContact } from "@/actions/user-preference/toggle-favorite-contact"
import { FormCreateContactTags } from "@/components/forms/form-create-contact-tags"
import { toast } from "@/components/toast"
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
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { queryClient } from "@/providers/theme-provider"
import { ContactUserPreference } from "@prisma/client"
import { useMutation, useMutationState, useQuery } from "@tanstack/react-query"
import {
    Bookmark,
    Heart,
    HeartMinus,
    MoreVertical,
    Pin,
    RefreshCcw
} from "lucide-react"
import { useState } from "react"

type ContactHeaderDropMenuProps = {
    contactId: string
    preferences: ContactUserPreference[]
}

export const ContactHeaderDropMenu = ({
    contactId, preferences
}: ContactHeaderDropMenuProps) => {

    const { data: session } = authClient.useSession()

    const { data: tags, isLoading } = useQuery({
        queryKey: ["find-many-contacts-tag-by-contact-id", contactId],
        queryFn: () => findManyContactsTagByContactId(contactId)
    })

    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    const [status] = useMutationState({
        filters: { mutationKey: ["create-contact-tag"] },
        select: (mutation) => mutation.state.status
    })

    const { mutate } = useMutation({
        mutationKey: ["toggle-favorite-contact"],
        mutationFn: toggleFavoriteContact,
        onSuccess: ({ favorite }) => {
            toast({
                title: `Contato ${favorite
                    ? "retirado dos"
                    : "adicionado aos"} 
                    favoritos`
            })

            queryClient.invalidateQueries({
                queryKey: ["find-contact-by-id", contactId]
            })
        }
    })

    if (!tags || isLoading || !session) {
        return
    }

    const { user } = session

    const myPreferences = preferences.find(preference => preference.userId === user.id)
    const myPreferencesExist = (myPreferences && myPreferences.favorite) ?? false

    const IconHeart = myPreferencesExist ? HeartMinus : Heart

    function handleToggleFavoriteContact() {
        mutate(contactId)
    }

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
                            <FormCreateContactTags
                                contactId={contactId}
                                tags={tags.map(({ tag }) => tag)}
                                setDialogOpen={setDialogOpen}
                                setDropdownOpen={setDropdownOpen}
                            />
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
                            <DropdownMenuItem onClick={handleToggleFavoriteContact}>
                                <IconHeart className={cn(
                                    "text-red-500",
                                    !myPreferencesExist && "fill-red-500"
                                )} />
                                {
                                    myPreferencesExist
                                        ? "Remover dos favoritos"
                                        : "Adicionar aos favoritos"
                                }
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
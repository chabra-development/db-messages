"use client"

import { findManyContactsTagByContactId } from "@/actions/contact-tag/find-many-contacts-tag-by-contact-id"
import { FavoriteContactButton } from "@/app/(pages)/(private)/contacts/[contact]/contact-header-drop-menu/favorite-contact-button"
import { ImportMessagesByContactIdButton } from "@/app/(pages)/(private)/contacts/[contact]/contact-header-drop-menu/import-messages-by-contact-id-button"
import { PinnedButton } from "@/app/(pages)/(private)/contacts/[contact]/contact-header-drop-menu/pinned-button"
import { FormCreateContactTags } from "@/components/forms/form-create-contact-tags"
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { ContactUserPreference } from "@prisma/client"
import { useMutationState, useQuery } from "@tanstack/react-query"
import { Bookmark, MoreVertical } from "lucide-react"
import { useRef, useState } from "react"

type ContactCardDropMenuProps = {
    contactId: string
    preference: ContactUserPreference | null | undefined
}

export function ContactCardDropMenu({ contactId, preference }: ContactCardDropMenuProps) {
    
    const { data: session } = authClient.useSession()
    const isFirstLoad = useRef(true)

    const { data: tags, isLoading: isLoadingTags } = useQuery({
        queryKey: ["find-many-contacts-tag-by-contact-id", contactId],
        queryFn: () => findManyContactsTagByContactId(contactId),
    })

    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    const [status] = useMutationState({
        filters: { mutationKey: ["create-contact-tag"] },
        select: (mutation) => mutation.state.status,
    })

    if (isLoadingTags || !session) {
        return (
            <Button size="icon" variant="ghost" disabled className="size-7">
                <MoreVertical className="size-4" />
            </Button>
        )
    }

    const isAdmin = session.user.role === "ADMIN"

    return (
        <>
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent className="w-1/3 bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Adicionar tags</AlertDialogTitle>
                    </AlertDialogHeader>
                    <Card className="pt-4">
                        <CardContent className="px-4">
                            <FormCreateContactTags
                                contactId={contactId}
                                tags={tags?.map(({ tag }) => tag) ?? []}
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
                            {status === "pending" ? <Spinner /> : "Salvar"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={(e) => e.preventDefault()}
                    >
                        <MoreVertical className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card">
                    <DropdownMenuGroup>
                        <FavoriteContactButton
                            contactId={contactId}
                            preference={preference ?? null}
                        />
                        <PinnedButton
                            contactId={contactId}
                            preference={preference ?? null}
                        />
                        <ImportMessagesByContactIdButton
                            contactId={contactId}
                            isFirstLoad={isFirstLoad}
                        />
                    </DropdownMenuGroup>
                    {isAdmin && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-muted-foreground">
                                    Admin
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onSelect={(e) => {
                                        e.preventDefault()
                                        setDialogOpen(true)
                                    }}
                                >
                                    <Bookmark />
                                    Adicionar tag
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}

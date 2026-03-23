"use client"

import { deleteTag } from "@/actions/tags/delete-tag"
import { toast } from "@/components/toast"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { queryClient } from "@/providers/theme-provider"
import { useMutation } from "@tanstack/react-query"

type DeleteTagDialogProps = {
    id: string
    name: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const DeleteTagDialog = ({ id, name, open, onOpenChange }: DeleteTagDialogProps) => {

    const { mutate, isPending } = useMutation({
        mutationKey: ["delete-tag", id],
        mutationFn: deleteTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["find-many-tags"] })
            onOpenChange(false)
        },
        onError: error => {
            toast({
                title: error.name,
                description: error.message,
                variant: "destructive",
            })
        },
    })

    return (
        <AlertDialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Excluir tag
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir a tag
                        <strong className="ml-2">
                            {name}
                        </strong>
                        ? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel variant={"destructive"}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={isPending}
                        onClick={() => mutate(id)}
                    >
                        Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

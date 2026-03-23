"use client"

import { updateNameTag } from "@/actions/tags/update-name-tag"
import { toast } from "@/components/toast"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { queryClient } from "@/providers/theme-provider"
import { RenameTagSchema, renameTagSchema } from "@/schemas/rename-tag-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"

type RenameTagDialogProps = {
    id: string
    name: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const RenameTagDialog = ({ id, name, open, onOpenChange }: RenameTagDialogProps) => {

    const form = useForm<RenameTagSchema>({
        resolver: zodResolver(renameTagSchema),
        defaultValues: { name },
    })

    const { mutate, isPending } = useMutation({
        mutationKey: ["rename-tag", id],
        mutationFn: updateNameTag,
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

    function onSubmit({ name: newName }: RenameTagSchema) {
        mutate({ id, name: newName })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-1/3">
                <DialogHeader>
                    <DialogTitle>Renomear tag</DialogTitle>
                    <DialogDescription>
                        Altere o nome da tag <strong>{name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        id="form-rename-tag"
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>
                <DialogFooter>
                    <Button
                        variant="destructive"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="form-rename-tag"
                        disabled={isPending || !form.formState.isDirty}
                    >
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

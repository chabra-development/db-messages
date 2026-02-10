import { ImportProgressBar } from "@/components/import-progress-bar"
import { SpanErrorMessage } from "@/components/span-error"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
    extractNameFromBlipIdentity
} from "@/functions/extract-name-from-blip-identity"
import { Import, ListChecks, ListX, X } from "lucide-react"
import { useFormImportAttendants } from "./use-form-import-attendants"

export type ImportFailedItem = {
    identity: string
    email: string
    reason: string
}

export const ImportAttendantsForm = () => {

    const {
        open,
        setOpen,
        selected,
        total,
        isPending,
        allSelected,
        toggleAllAttendants,
        isChecked,
        handleSubmit,
        onSubmit,
        indexByIdentity,
        append,
        remove,
        errors,
        job,
        items,
        attendants,
        isLoading
    } = useFormImportAttendants()

    if (!attendants || isLoading) {
        return (
            <div>
                {
                    Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} />
                    ))
                }
            </div>
        )
    }

    return (
        <AlertDialog
            open={open}
            onOpenChange={setOpen}
        >
            <AlertDialogTrigger asChild>
                <Button>
                    <Import />
                    Importar atendentes
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-4/5">
                <AlertDialogHeader className="flex justify-between">
                    <div>
                        <AlertDialogTitle>
                            Importar atendentes
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {selected} de {total} atendentes selecionados
                        </AlertDialogDescription>
                    </div>
                    <Button
                        className="w-1/3"
                        disabled={isPending}
                        variant={allSelected ? "destructive" : "default"}
                        onClick={toggleAllAttendants}
                    >
                        {
                            allSelected ? <ListX /> : <ListChecks />
                        }
                        {
                            allSelected ? "Remover todos" : "Selecionar todos"
                        }
                    </Button>
                </AlertDialogHeader>
                <ScrollArea className="h-100">
                    <ScrollBar />
                    <form
                        id="import-attendants"
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4 grid grid-cols-2 gap-2"
                    >
                        {
                            items.map(({
                                identity, email, teams
                            }) => {
                                return (
                                    <Card key={identity}>
                                        <CardHeader>
                                            <CardTitle className="capitalize">
                                                {
                                                    extractNameFromBlipIdentity(identity)
                                                }
                                            </CardTitle>
                                            <CardDescription>
                                                {email}
                                            </CardDescription>
                                            <CardAction>
                                                <Checkbox
                                                    checked={isChecked(identity)}
                                                    onCheckedChange={(checked) => {
                                                        const index = indexByIdentity(identity)

                                                        if (checked && index === -1) {
                                                            append({ identity, email, teams })
                                                        }

                                                        if (!checked && index !== -1) {
                                                            remove(index)
                                                        }
                                                    }}
                                                />
                                            </CardAction>
                                        </CardHeader>
                                    </Card>
                                )
                            })
                        }
                    </form>
                </ScrollArea>
                {
                    errors.attendents &&
                    <SpanErrorMessage message={errors.attendents.message} />
                }
                {
                    job && (
                        <ImportProgressBar jobId={job.id} />
                    )
                }
                <AlertDialogFooter>
                    <AlertDialogCancel
                        type="button"
                        variant={"destructive"}
                        className="w-1/4"
                        disabled={isPending}
                    >
                        <X />
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        type="submit"
                        form="import-attendants"
                        disabled={isPending}
                        className="w-1/4"
                        onClick={(e) => {
                            e.preventDefault()

                            handleSubmit(onSubmit)()
                        }}
                    >
                        {
                            isPending
                                ?
                                (
                                    <Spinner />
                                )
                                : (
                                    <>
                                        <Import />
                                        Importar
                                    </>
                                )
                        }
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

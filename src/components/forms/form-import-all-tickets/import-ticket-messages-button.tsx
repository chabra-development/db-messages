"use client"

import {
    importAllTicketMessages,
    importDeferredTicketMessages,
    type ImportTicketMessagesDeferred,
} from "@/actions/tickets/import-ticket-messages"
import { ImportProgressToast } from "@/components/import-data-toast"
import { BrailleSpinner } from "@/components/ui/braille-spinner"
import { Button } from "@/components/ui/button"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MessageSquareMore } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function ImportTicketMessagesButton() {
    const queryClient = useQueryClient()
    const [jobId, setJobId] = useState<string | null>(null)

    const { mutate, isPending } = useMutation({
        mutationFn: importAllTicketMessages,
        onSuccess: (data) => {
            if (data.success && data.jobId) {
                setJobId(data.jobId)
                toast.success(data.message)
            }
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Erro ao importar mensagens")
        },
    })

    const { mutate: mutateDeferred } = useMutation({
        mutationFn: (tickets: ImportTicketMessagesDeferred[]) => importDeferredTicketMessages(tickets),
        onSuccess: (data) => {
            if (data.success && data.jobId) {
                setJobId(data.jobId)
                toast.info(data.message)
            }
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Erro ao reprocessar tickets adiados")
        },
    })

    return (
        <>
            <Button onClick={() => mutate()} disabled={isPending} variant="outline" size="sm">
                {isPending ? (
                    <BrailleSpinner name="braille">Iniciando...</BrailleSpinner>
                ) : (
                    <>
                        <MessageSquareMore className="size-4" />
                        Importar Mensagens
                    </>
                )}
            </Button>

            {jobId && (
                <ImportProgressToast
                    message="mensagens de tickets"
                    jobId={jobId}
                    onComplete={() => {
                        setJobId(null)
                        queryClient.invalidateQueries({ queryKey: ["find-many-tickets"] })
                        queryClient.invalidateQueries({ queryKey: ["link-statistics"] })
                        toast.success("Importação de mensagens concluída!")
                    }}
                    onDeferred={(deferred) => {
                        toast.info(`${deferred.length} ticket(s) adiado(s) serão reprocessados automaticamente.`)
                        mutateDeferred(deferred as ImportTicketMessagesDeferred[])
                    }}
                />
            )}
        </>
    )
}

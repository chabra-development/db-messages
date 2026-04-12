"use client"

import { linkAllMessagesToTickets } from "@/actions/tickets/link-messages-by-date"
import { ImportProgressToast } from "@/components/import-data-toast"
import { BrailleSpinner } from "@/components/ui/braille-spinner"
import { Button } from "@/components/ui/button"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function LinkMessagesButton() {
    const queryClient = useQueryClient()
    const [jobId, setJobId] = useState<string | null>(null)

    const { mutate, isPending } = useMutation({
        mutationFn: linkAllMessagesToTickets,
        onSuccess: (data) => {
            if (data.success && data.jobId) {
                setJobId(data.jobId)
                toast.success(data.message)
            }
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Erro ao vincular mensagens")
        },
    })

    return (
        <>
            <Button onClick={() => mutate()} disabled={isPending} variant="outline" size="sm">
                {isPending ? (
                    <BrailleSpinner name="braille">Iniciando...</BrailleSpinner>
                ) : (
                    <>
                        <Link2 className="size-4" />
                        Vincular Mensagens
                    </>
                )}
            </Button>

            {jobId && (
                <ImportProgressToast
                    message="tickets"
                    jobId={jobId}
                    onComplete={() => {
                        setJobId(null)
                        queryClient.invalidateQueries({ queryKey: ["link-statistics"] })
                        toast.success("Mensagens vinculadas com sucesso!")
                    }}
                />
            )}
        </>
    )
}

"use client"

import { syncTicketMessages } from "@/actions/tickets/sync-ticket-messages"
import { BrailleSpinner } from "@/components/ui/braille-spinner"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Copy, MoreHorizontal, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { TicketRow } from "./columns"

interface TicketActionsMenuProps {
    ticket: TicketRow
}

export function TicketActionsMenu({ ticket }: TicketActionsMenuProps) {
    const queryClient = useQueryClient()

    const syncMutation = useMutation({
        mutationFn: () => syncTicketMessages(ticket.id, ticket.blipId),
        onSuccess: ({ synced, alreadyLinked, notFound, deferred }) => {
            queryClient.invalidateQueries({ queryKey: ["find-many-tickets"] })

            if (deferred) {
                toast.warning("Ticket com muitas mensagens — vinculação parcial.", {
                    description: `Processadas as primeiras 10.000 mensagens. ${synced} vinculada(s). Este ticket foi adicionado à fila para processamento posterior.`,
                })
                return
            }

            if (synced === 0 && alreadyLinked === 0) {
                toast.warning("Nenhuma mensagem encontrada no banco para este ticket.", {
                    description: `${notFound} mensagem(s) do Blip não estão importadas.`,
                })
                return
            }

            toast.success(
                synced > 0
                    ? `${synced} mensagem(s) vinculada(s) ao ticket.`
                    : "Mensagens já estavam vinculadas.",
                {
                    description: [
                        alreadyLinked > 0 && `${alreadyLinked} já vinculada(s)`,
                        notFound > 0 && `${notFound} não encontrada(s) no banco`,
                    ]
                        .filter(Boolean)
                        .join(" · ") || undefined,
                },
            )
        },
        onError: (error) => {
            toast.error("Erro ao sincronizar mensagens", {
                description: error instanceof Error ? error.message : "Erro desconhecido",
            })
        },
    })

    const isPending = syncMutation.isPending

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={isPending}
                    onClick={(e) => e.stopPropagation()}
                >
                    {isPending ? (
                        <BrailleSpinner name="braille" />
                    ) : (
                        <MoreHorizontal className="size-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    #{ticket.sequentialId}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => syncMutation.mutate()}
                    disabled={isPending}
                >
                    <RefreshCw className="size-4" />
                    Sincronizar mensagens
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => {
                        navigator.clipboard.writeText(ticket.blipId)
                        toast.success("Blip ID copiado.")
                    }}
                >
                    <Copy className="size-4" />
                    Copiar Blip ID
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => {
                        navigator.clipboard.writeText(ticket.id)
                        toast.success("ID copiado.")
                    }}
                >
                    <Copy className="size-4" />
                    Copiar ID interno
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

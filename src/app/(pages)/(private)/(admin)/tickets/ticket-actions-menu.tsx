"use client";

import { syncTicketMessages } from "@/actions/tickets/sync-ticket-messages";
import { BrailleSpinner } from "@/components/ui/braille-spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, MoreHorizontal, RefreshCw } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import type { TicketRow } from "./columns";

interface TicketActionsMenuProps {
  ticket: TicketRow;
}

function formatElapsed(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function TicketActionsMenu({ ticket }: TicketActionsMenuProps) {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  function startTimer() {
    elapsedRef.current = 0;
    const toastId = `sync-${ticket.id}`;

    const estimated =
      ticket.messageCount > 0
        ? `~${formatElapsed(Math.ceil(ticket.messageCount / 100))}`
        : null;

    const updateToast = () => {
      elapsedRef.current++;
      toast.loading(
        `Sincronizando mensagens... ${formatElapsed(elapsedRef.current)}`,
        {
          id: toastId,
          description: [
            ticket.messageCount > 0 &&
              `${ticket.messageCount.toLocaleString()} mensagens no ticket`,
            estimated && `Estimativa: ${estimated}`,
          ]
            .filter(Boolean)
            .join(" · "),
        },
      );
    };

    toast.loading(`Sincronizando mensagens... 0s`, {
      id: toastId,
      description:
        [
          ticket.messageCount > 0 &&
            `${ticket.messageCount.toLocaleString()} mensagens no ticket`,
          estimated && `Estimativa: ${estimated}`,
        ]
          .filter(Boolean)
          .join(" · ") ||
        "Tickets com muitas mensagens podem levar alguns minutos.",
    });

    timerRef.current = setInterval(updateToast, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    toast.dismiss(`sync-${ticket.id}`);
  }

  const syncMutation = useMutation({
    mutationFn: () => syncTicketMessages(ticket.id, ticket.blipId),
    onMutate: startTimer,
    onSuccess: ({ synced, alreadyLinked, notFound, elapsedSeconds }) => {
      stopTimer();
      queryClient.invalidateQueries({ queryKey: ["find-many-tickets"] });

      const timeLabel = formatElapsed(elapsedSeconds);

      if (synced === 0 && alreadyLinked === 0) {
        toast.warning(
          "Nenhuma mensagem encontrada no banco para este ticket.",
          {
            description: `${notFound} mensagem(s) do Blip não estão importadas. Tempo: ${timeLabel}.`,
          },
        );
        return;
      }

      toast.success(
        synced > 0
          ? `${synced} mensagem(s) vinculada(s) ao ticket.`
          : "Mensagens já estavam vinculadas.",
        {
          description: [
            alreadyLinked > 0 && `${alreadyLinked} já vinculada(s)`,
            notFound > 0 && `${notFound} não encontrada(s) no banco`,
            `Tempo: ${timeLabel}`,
          ]
            .filter(Boolean)
            .join(" · "),
        },
      );
    },
    onError: (error) => {
      stopTimer();
      toast.error("Erro ao sincronizar mensagens", {
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    },
  });

  const isPending = syncMutation.isPending;

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
            navigator.clipboard.writeText(ticket.blipId);
            toast.success("Blip ID copiado.");
          }}
        >
          <Copy className="size-4" />
          Copiar Blip ID
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard.writeText(ticket.id);
            toast.success("ID copiado.");
          }}
        >
          <Copy className="size-4" />
          Copiar ID interno
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client"

import { getLinkStatistics } from "@/actions/tickets/link-messages-by-date"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useQuery } from "@tanstack/react-query"
import { BarChart3 } from "lucide-react"
import { useState } from "react"

export function LinkStatsButton() {
    const [open, setOpen] = useState(false)

    const { data: stats } = useQuery({
        queryKey: ["link-statistics"],
        queryFn: getLinkStatistics,
        enabled: open,
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <BarChart3 className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="w-1/2">
                <DialogHeader>
                    <DialogTitle>Estatísticas de Vinculação</DialogTitle>
                    <DialogDescription>
                        Status atual das mensagens vinculadas aos tickets
                    </DialogDescription>
                </DialogHeader>

                {stats && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">Mensagens</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 rounded-lg border">
                                    <p className="text-sm text-muted-foreground">Vinculadas</p>
                                    <p className="text-2xl font-bold text-green-700">
                                        {stats.messages.linked.toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg border">
                                    <p className="text-sm text-muted-foreground">Não vinculadas</p>
                                    <p className="text-2xl font-bold text-gray-700">
                                        {stats.messages.unlinked.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-2 p-3 rounded-lg border">
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {stats.messages.total.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stats.messages.linkedPercentage}% vinculadas
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Tickets</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 rounded-lg border">
                                    <p className="text-sm text-muted-foreground">Com mensagens</p>
                                    <p className="text-2xl font-bold text-purple-700">
                                        {stats.tickets.withMessages.toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg border">
                                    <p className="text-sm text-muted-foreground">Total</p>
                                    <p className="text-2xl font-bold text-gray-700">
                                        {stats.tickets.total.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

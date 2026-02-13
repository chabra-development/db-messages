"use client"

/**
 * Componente de feedback visual para importação de atendentes
 * Seguindo o padrão do projeto (attendants-query.tsx)
 */

import {
    useImportProgress, formatTimeRemaining
} from "@/hooks/use-import-progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Clock,
    Users,
    AlertTriangle,
    X
} from "lucide-react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { cn } from "@/lib/utils"

interface ImportProgressDisplayProps {
    jobId: string | null
    onComplete?: () => void
    onClose?: () => void
}

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        scale: 0.95,
        transition: { duration: 0.2 }
    }
}

export const ImportProgressDisplay = ({
    jobId,
    onComplete,
    onClose
}: ImportProgressDisplayProps) => {

    const {
        data,
        progress,
        isComplete,
        hasError,
        isRunning,
        isPending,
        estimatedTimeRemaining,
        isLoading
    } = useImportProgress({ jobId })

    // Chama callback quando completo
    if (isComplete && onComplete) {
        onComplete()
    }

    if (!jobId || isLoading || !data) {
        return null
    }

    const { total, processed, succeeded, failedCount, failed, metadata } = data

    return (
        <AnimatePresence mode="wait">
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full shadow-2xl"
            >
                <Card className="border-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {isPending && (
                                        <>
                                            <Clock className="size-5 text-muted-foreground animate-pulse" />
                                            <span>
                                                Preparando importação...
                                            </span>
                                        </>
                                    )}
                                    {isRunning && (
                                        <>
                                            <Loader2 className="size-5 text-primary animate-spin" />
                                            <span>
                                                Importando atendentes
                                            </span>
                                        </>
                                    )}
                                    {isComplete && (
                                        <>
                                            <CheckCircle2 className="size-5 text-green-500" />
                                            <span>Importação concluída!</span>
                                        </>
                                    )}
                                    {hasError && (
                                        <>
                                            <XCircle className="size-5 text-destructive" />
                                            <span>Erro na importação</span>
                                        </>
                                    )}
                                </CardTitle>

                                {metadata?.deduplicatedCount && metadata.deduplicatedCount > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {metadata.deduplicatedCount} duplicata(s) removida(s)
                                    </p>
                                )}
                            </div>

                            {(isComplete || hasError) && onClose && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="h-8 w-8 p-0 shrink-0"
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Barra de progresso */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {processed} de {total}
                                </span>
                                <span className="font-medium">{progress}%</span>
                            </div>

                            <Progress value={progress} className="h-2" />

                            {isRunning && estimatedTimeRemaining && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="size-3" />
                                    Tempo estimado: {formatTimeRemaining(estimatedTimeRemaining)}
                                </p>
                            )}
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-2 gap-2">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                            >
                                <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                                <div className="text-sm min-w-0">
                                    <p className="font-medium text-green-700 tabular-nums">
                                        {succeeded}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        Sucesso
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                            >
                                <XCircle className="size-4 text-destructive shrink-0" />
                                <div className="text-sm min-w-0">
                                    <p className="font-medium text-destructive tabular-nums">
                                        {failedCount}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        Falhas
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Lista de erros (similar ao filtro de teams) */}
                        {failed && failed.length > 0 && (
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="errors" className="border rounded-lg px-3">
                                    <AccordionTrigger className="py-2 hover:no-underline">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="size-4 text-destructive" />
                                            <span className="text-sm font-medium">
                                                Ver erros ({failed.length})
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <ScrollArea className="h-40 pr-3">
                                            <div className="space-y-2 pt-2">
                                                {failed.map((error, index) => (
                                                    <motion.div
                                                        key={`${error.identity}-${index}`}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className={cn(
                                                            "p-3 rounded-md",
                                                            "bg-destructive/5 border border-destructive/20",
                                                            "hover:bg-destructive/10 transition-colors"
                                                        )}
                                                    >
                                                        <p className="text-xs font-medium text-destructive truncate">
                                                            {error.email}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {error.reason}
                                                        </p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        )}

                        {/* Mensagem final - sucesso */}
                        {isComplete && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 25
                                }}
                                className={cn(
                                    "p-3 rounded-lg",
                                    "bg-green-500/10 border border-green-500/20"
                                )}
                            >
                                <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                                    <Users className="size-4" />
                                    {succeeded} atendente(s) importado(s) com sucesso!
                                </p>
                                {failedCount > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {failedCount} falha(s) durante o processo
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {/* Mensagem final - erro */}
                        {hasError && metadata?.error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 25
                                }}
                                className={cn(
                                    "p-3 rounded-lg",
                                    "bg-destructive/10 border border-destructive/20"
                                )}
                            >
                                <p className="text-sm text-destructive font-medium flex items-center gap-2">
                                    <XCircle className="size-4" />
                                    Erro: {metadata.error}
                                </p>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    )
}
"use client"

import { createTag } from "@/actions/tags/create-tag"
import { deleteTag } from "@/actions/tags/delete-tag"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Tag, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

type TagWithCount = {
    id: string
    name: string
    color: string | null
    _count: { contacts: number }
}

interface TagsManagerProps {
    initialTags: TagWithCount[]
}

export function TagsManager({ initialTags }: TagsManagerProps) {
    const router = useRouter()
    const [tags, setTags] = useState(initialTags)
    const [name, setName] = useState("")
    const [color, setColor] = useState("#6366f1")
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const nameRef = useRef<HTMLInputElement>(null)

    function handleCreate() {
        if (!name.trim()) return

        startTransition(async () => {
            try {
                const tag = await createTag({ name: name.trim(), color })
                setTags((prev) => [...prev, { ...tag, _count: { contacts: 0 } }])
                setName("")
                setColor("#6366f1")
                nameRef.current?.focus()
                toast.success(`Tag "${tag.name}" criada`)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erro ao criar tag")
            }
        })
    }

    function handleDelete(id: string, tagName: string) {
        setDeletingId(id)
        startTransition(async () => {
            try {
                await deleteTag(id)
                setTags((prev) => prev.filter((t) => t.id !== id))
                toast.success(`Tag "${tagName}" removida`)
                router.refresh()
            } catch {
                toast.error("Erro ao remover tag")
            } finally {
                setDeletingId(null)
            }
        })
    }

    return (
        <div className="space-y-4">
            {/* Formulário de criação */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        ref={nameRef}
                        placeholder="Nome da tag"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        maxLength={32}
                        disabled={isPending}
                    />
                </div>
                <div className="relative h-9 w-9 shrink-0">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        disabled={isPending}
                        title="Escolher cor"
                        className="absolute inset-0 h-full w-full cursor-pointer rounded-md border border-input opacity-0"
                    />
                    <div
                        className="h-9 w-9 rounded-md border border-input pointer-events-none"
                        style={{ backgroundColor: color }}
                    />
                </div>
                <Button
                    onClick={handleCreate}
                    disabled={!name.trim() || isPending}
                    size="sm"
                    className="shrink-0"
                >
                    {isPending && deletingId === null ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        "Criar"
                    )}
                </Button>
            </div>

            {/* Lista de tags */}
            {tags.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Tag className="h-8 w-8 opacity-30" />
                    <p className="text-sm">Nenhuma tag criada ainda</p>
                </div>
            ) : (
                <ul className="space-y-1.5">
                    {tags.map((tag) => (
                        <li
                            key={tag.id}
                            className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
                        >
                            <span
                                className="h-3 w-3 shrink-0 rounded-full"
                                style={{ backgroundColor: tag.color ?? "#6366f1" }}
                            />
                            <span className="flex-1 truncate text-sm font-medium">
                                {tag.name}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                                {tag._count.contacts}{" "}
                                {tag._count.contacts === 1 ? "contato" : "contatos"}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                disabled={isPending}
                                onClick={() => handleDelete(tag.id, tag.name)}
                            >
                                {deletingId === tag.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

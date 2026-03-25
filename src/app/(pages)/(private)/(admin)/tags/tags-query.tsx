"use client"

import { findManyTags } from "@/actions/tags/find-many-tags"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import { ChangeColorDialog } from "./change-color-dialog"
import { TagsCardOptions } from "./tags-card-options"
import { TagClienFooter } from "./tags-query-footer"
import { TagClientLoading } from "./tags-query-loading"

export const TagClient = () => {

    const [search, setSearch] = useState("")

    const { data: tags, isLoading: tagsLoading } = useQuery({
        queryKey: ["find-many-tags"],
        queryFn: () => findManyTags({
            orderBy: {
                name: "asc"
            },
        })
    })

    const filteredTags = tags?.filter(tag =>
        tag.name.toLowerCase().includes(search.toLowerCase())
    )

    if (!tags || tagsLoading) {
        return (
            <TagClientLoading />
        )
    }

    return (
        <Card className="w-full border-none shadow-none rounded-none">
            <CardHeader>
                <CardTitle className="text-2xl">
                    Tags
                </CardTitle>
                <CardDescription className="text-base">
                    Adicione, atualize e exclua tags para os contatos
                </CardDescription>
                <Input
                    type="search"
                    placeholder="Pesquisar tags..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </CardHeader>
            <ScrollArea className="flex-1 min-h-200">
                <CardContent className="space-y-1.5 grid grid-cols-2 gap-1.5">
                    <AnimatePresence mode="popLayout">
                        {
                            filteredTags!.length === 0
                                ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <div className="w-fit">
                                            <CardDescription className="text-xl italic">
                                                Sem tags adicionadas
                                            </CardDescription>
                                        </div>
                                    </motion.div>
                                )
                                : filteredTags!.map(({ id, name, color, createdById }) => (
                                    <motion.div
                                        key={id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <Card className="text-sm gap-2 bg-background">
                                            <CardHeader>
                                                <CardTitle className="text-lg">
                                                    {name}
                                                </CardTitle>
                                                <CardAction>
                                                    <TagsCardOptions id={id} name={name} />
                                                </CardAction>
                                            </CardHeader>
                                            <CardContent>
                                                <ChangeColorDialog
                                                    id={id}
                                                    color={color}
                                                />
                                            </CardContent>
                                            <TagClienFooter createdById={createdById} />
                                        </Card>
                                    </motion.div>
                                ))
                        }
                    </AnimatePresence>
                </CardContent>
            </ScrollArea>
        </Card>
    )
}
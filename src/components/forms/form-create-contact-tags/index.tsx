import { createContactTags } from "@/actions/contact-tag/create-contact-tag"
import { toast } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createTagsObjetc, CreateTagsProps, createTagsSchema } from "@/schemas/create-tags-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { X } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"
import { useFieldArray, useForm } from "react-hook-form"

export const FormCreateContactTags = ({ contactId }: { contactId: string }) => {

    const { mutate } = useMutation({
        mutationKey: ["create-contact-tag"],
        mutationFn: createContactTags,
        onSuccess: () => {
            toast({
                title: "Tag adicionada com sucesso"
            })
        },
        onError: (error) => {
            toast({
                title: "Erro ao adicionar tag",
                description: error.message,
                variant: "destructive"
            })
        }
    })

    const [
        currentContactTag,
        setCurrentContactTag
    ] = useQueryState("name", parseAsString.withDefault(''))

    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<CreateTagsProps>({
        resolver: zodResolver(createTagsSchema),
        defaultValues: {
            tags: []
        }
    })

    const {
        fields,
        append,
        remove
    } = useFieldArray<CreateTagsProps>({
        name: "tags",
        control
    })

    if (errors.tags) {
        console.log(errors.tags)
    }

    function addContactTag(contactTag: string) {

        const result = createTagsObjetc.safeParse({ name: contactTag })

        if (!result.success) return

        if (contactTag.includes(",")) {
            contactTag.split(",")
                .map(tag => tag.trim())
                .filter(Boolean)
                .forEach(tag => {

                    const tagResult = createTagsObjetc.safeParse({ name: tag })

                    if (tagResult.success) append({ name: tag })
                })

            setCurrentContactTag("")
            return
        }

        append(result.data)
        setCurrentContactTag("")
    }

    function onSubmit({ tags }: CreateTagsProps) {
        mutate({ tags, contactId })
    }

    return (
        <form
            id="form-create-contact-tags"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
        >
            <Card className="py-4 rounded-sm">
                <ScrollArea
                    type="always"
                    className="h-32"
                >
                    <CardContent className="p-4 flex items-center flex-wrap gap-2">
                        {
                            fields.length === 0
                                ? (
                                    <CardDescription className="text-base">
                                        Nenhuma tag adicionada
                                    </CardDescription>
                                )
                                : fields.map(({ id, name }, i) => (
                                    <Card
                                        key={id}
                                        className="w-fit bg-primary text-primary-foreground py-1.5 flex flex-row rounded-full gap-0 items-center"
                                    >
                                        <CardContent className="px-2.5">
                                            <CardTitle className="capitalize">
                                                {name}
                                            </CardTitle>
                                        </CardContent>
                                        <CardFooter className="px-1.5">
                                            <Button
                                                size={"icon-xs"}
                                                onClick={() => remove(i)}
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                        }
                    </CardContent>
                </ScrollArea>
            </Card>
            <Input
                placeholder="Adicione uma tag..."
                className="rounded-sm"
                onChange={e => setCurrentContactTag(e.target.value)}
                value={currentContactTag}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        addContactTag(currentContactTag)
                    }
                }}
            />
        </form>
    )
}
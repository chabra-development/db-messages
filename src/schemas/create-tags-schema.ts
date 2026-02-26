import z from "zod"

export const createTagsObjetc = z
    .object({
        name: z
            .string()
            .nonempty("O nome da tag é obrigatório")
            .trim(),
    })

export const createTagsSchema = z.object({
    tags: z
        .array(createTagsObjetc)
        .min(1, "Adicione pelo menos uma tag")
})

export type CreateTagsProps = z.infer<typeof createTagsSchema>
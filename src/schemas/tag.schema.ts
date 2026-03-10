import { z } from "zod"

export const createTagSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(32, "Nome deve ter no máximo 32 caracteres").trim(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida").optional().default("#6366f1"),
})

export const assignTagSchema = z.object({
    contactIdentity: z.string().min(1, "Identity do contato é obrigatória"),
    tagId: z.string().uuid("Tag inválida"),
})

export const unassignTagSchema = z.object({
    contactIdentity: z.string().min(1, "Identity do contato é obrigatória"),
    tagId: z.string().uuid("Tag inválida"),
})

export type CreateTagInput = z.infer<typeof createTagSchema>
export type AssignTagInput = z.infer<typeof assignTagSchema>
export type UnassignTagInput = z.infer<typeof unassignTagSchema>

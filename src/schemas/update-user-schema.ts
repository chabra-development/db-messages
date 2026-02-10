import z from "zod"

export const formUpdateUserSchema = z
    .object({
        name: z.string().toLowerCase(),
        newPassword: z
            .string()
            .min(1, "A nova senha deve ter no minimo 6 caracteres"),
        currentPassword: z
            .string()
            .min(6, "A senha atual deve ter no minimo 6 caracteres"),
    })
    .refine(
        ({ currentPassword, newPassword }) => currentPassword !== newPassword,
        {
            error: "As senhas devem ser diferentes.",
            path: ["newPassword"],
        }
    )

export type FormUpdateUserProps = z.infer<typeof formUpdateUserSchema>
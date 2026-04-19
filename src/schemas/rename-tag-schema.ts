import z from "zod";

export const renameTagSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

export type RenameTagSchema = z.infer<typeof renameTagSchema>;

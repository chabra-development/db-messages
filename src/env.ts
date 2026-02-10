import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.url("DATABASE_URL deve ser uma URL válida"),
  DIRECT_URL: z.url("DIRECT_URL deve ser uma URL válida"),

  // Better Auth
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET deve ter no mínimo 32 caracteres"),

  // Supabase
  SUPABASE_URL: z
    .url("SUPABASE_URL deve ser uma URL válida"),
  SUPABASE_KEY: z
    .string()
    .min(1, "SUPABASE_KEY é obrigatória")
    .startsWith("sb_", "SUPABASE_KEY deve começar com 'sb_'"),

  // Blip Keys
  ROUTER_API_KEY: z
    .string()
    .min(1, "ROUTER_API_KEY é obrigatória"),
  BLIP_DESK_API_KEY: z
    .string()
    .min(1, "BLIP_DESK_API_KEY é obrigatória"),

  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Validação das variáveis de ambiente
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Erro de validação das variáveis de ambiente:");

      for (const issue of error.issues) {
        console.error(`  • ${issue.path.join(".")}: ${issue.message}`);
      }

      throw new Error("Configuração de ambiente inválida");
    }
    throw error;
  }
};

export const env = parseEnv();

// Type-safe para autocompletar
export type Env = z.infer<typeof envSchema>;

import { z } from "zod";

export const createApiKeySchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(60, "Nome muito longo"),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

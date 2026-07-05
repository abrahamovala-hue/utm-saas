import { z } from "zod";

// Validação de entrada — toda fronteira externa passa por aqui.
// Mensagens em PT (idioma padrão do produto).

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo"),
  email: z
    .string({ required_error: "E-mail é obrigatório" })
    .trim()
    .toLowerCase()
    .email("E-mail inválido"),
  password: z
    .string({ required_error: "Senha é obrigatória" })
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(72, "Senha muito longa"), // 72 = limite do bcrypt
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

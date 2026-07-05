import { z } from "zod";

export const TIMEZONES = [
  "America/Sao_Paulo",
  "America/New_York",
  "Europe/Lisbon",
  "Asia/Jerusalem",
  "UTC",
] as const;

export const CURRENCIES = ["BRL", "USD", "EUR", "ILS"] as const;

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(80, "Nome muito longo"),
  timezone: z.enum(TIMEZONES).default("America/Sao_Paulo"),
  currency: z.enum(CURRENCIES).default("BRL"),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

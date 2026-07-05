import { z } from "zod";

// Schema do endpoint genérico de conversões (API pública documentada).
export const conversionInputSchema = z.object({
  external_id: z
    .string({ required_error: "external_id é obrigatório" })
    .trim()
    .min(1)
    .max(191),
  event_name: z.string().trim().min(1).max(60).default("purchase"),
  value: z.coerce.number().min(0).optional(),
  currency: z.string().trim().length(3).toUpperCase().default("BRL"),
  visitor_id: z.string().trim().max(191).optional().nullable(),
  status: z.enum(["PENDING", "APPROVED", "REFUNDED", "REJECTED"]).default("APPROVED"),
  converted_at: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ConversionInput = z.infer<typeof conversionInputSchema>;

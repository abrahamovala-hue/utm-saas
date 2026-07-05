import { z } from "zod";

export const createLinkSchema = z.object({
  destinationUrl: z
    .string({ required_error: "URL de destino é obrigatória" })
    .trim()
    .url("Informe uma URL válida (com https://)"),
  campaignId: z.string().optional().nullable(),
  // UTMs fixas de reserva — usadas quando o clique NÃO traz UTMs na URL.
  // Parâmetros dinâmicos (ex: do Meta) sempre têm prioridade sobre estas.
  utmSource: z.string().trim().min(1).max(100).default("facebook"),
  utmMedium: z.string().trim().min(1).max(100).default("cpc"),
  utmCampaign: z.string().trim().min(1).max(150).default("sem-campanha"),
  utmTerm: z.string().trim().max(150).optional().nullable(),
  utmContent: z.string().trim().max(150).optional().nullable(),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;

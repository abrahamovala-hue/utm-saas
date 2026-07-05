import { randomBytes } from "crypto";
import { linksRepository } from "./links.repository";
import { projectsService } from "@/modules/projects/projects.service";
import { siteConfig } from "@/config/site";
import type { CreateLinkInput } from "./links.schemas";

// Alfabeto sem caracteres ambíguos (0/O, 1/l/I) — slugs legíveis.
const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function generateSlug(length = siteConfig.slugLength): string {
  const bytes = randomBytes(length);
  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return slug;
}

export const linksService = {
  async listLinks(userId: string, projectId: string) {
    await projectsService.getProject(userId, projectId);
    return linksRepository.listByProject(projectId);
  },

  async createLink(userId: string, projectId: string, input: CreateLinkInput) {
    await projectsService.getProject(userId, projectId);

    // Colisão de slug é raríssima (31^7 combinações), mas tratamos mesmo assim.
    let slug = generateSlug();
    for (let attempt = 0; attempt < 3; attempt++) {
      const existing = await linksRepository.findBySlug(slug);
      if (!existing) break;
      slug = generateSlug();
    }

    return linksRepository.create(projectId, {
      slug,
      destinationUrl: input.destinationUrl,
      campaignId: input.campaignId ?? null,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      utmTerm: input.utmTerm ?? null,
      utmContent: input.utmContent ?? null,
    });
  },
};

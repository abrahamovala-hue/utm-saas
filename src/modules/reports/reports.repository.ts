import { prisma } from "@/lib/prisma";

// Camada de dados dos relatórios.
// NOTA DE ESCALA: agregação em memória no MVP; daily_stats assume depois.

export const reportsRepository = {
  findClicksSince(projectId: string, since: Date) {
    return prisma.click.findMany({
      where: { projectId, clickedAt: { gte: since }, isBot: false },
      select: {
        clickedAt: true,
        utmLinkId: true,
        utmLink: { select: { utmCampaign: true, utmSource: true } },
      },
    });
  },

  findConversionsSince(projectId: string, since: Date) {
    return prisma.conversion.findMany({
      where: { projectId, convertedAt: { gte: since } },
      select: {
        convertedAt: true,
        status: true,
        value: true,
        metadata: true,
        click: {
          select: {
            utmLink: { select: { utmCampaign: true, utmSource: true } },
          },
        },
      },
    });
  },
};

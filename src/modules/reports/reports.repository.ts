import { prisma } from "@/lib/prisma";

// Camada de dados dos relatórios.
// NOTA DE ESCALA: no MVP agregamos em memória (volumes pequenos).
// Quando o volume crescer, a tabela daily_stats (já criada na Fase 0)
// assume via agregação incremental — sem mudar nenhuma interface daqui.

export const reportsRepository = {
  findClicksSince(projectId: string, since: Date) {
    return prisma.click.findMany({
      where: { projectId, clickedAt: { gte: since }, isBot: false },
      select: {
        clickedAt: true,
        utmLinkId: true,
        utmLink: { select: { utmCampaign: true } },
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
        click: {
          select: { utmLink: { select: { utmCampaign: true } } },
        },
      },
    });
  },
};

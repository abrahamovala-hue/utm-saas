import { prisma } from "@/lib/prisma";
import type { ConversionStatus, Prisma } from "@prisma/client";

export const conversionsRepository = {
  /** Clique mais recente de um visitante neste projeto — base da atribuição. */
  findLatestClickByVisitor(projectId: string, visitorId: string) {
    return prisma.click.findFirst({
      where: { projectId, visitorId, isBot: false },
      orderBy: { clickedAt: "desc" },
      select: { id: true, utmLinkId: true },
    });
  },

  findByExternalId(projectId: string, externalId: string) {
    return prisma.conversion.findUnique({
      where: { projectId_externalId: { projectId, externalId } },
    });
  },

  create(data: {
    projectId: string;
    externalId: string;
    clickId: bigint | null;
    visitorId: string | null;
    eventName: string;
    value: number | null;
    currency: string;
    status: ConversionStatus;
    metadata: Prisma.InputJsonValue;
    convertedAt: Date;
  }) {
    return prisma.conversion.create({ data });
  },

  updateStatus(id: string, status: ConversionStatus) {
    return prisma.conversion.update({ where: { id }, data: { status } });
  },

  listByProject(projectId: string, limit = 20) {
    return prisma.conversion.findMany({
      where: { projectId },
      orderBy: { convertedAt: "desc" },
      take: limit,
      include: {
        click: {
          select: {
            utmLink: { select: { utmCampaign: true, slug: true } },
          },
        },
      },
    });
  },
};

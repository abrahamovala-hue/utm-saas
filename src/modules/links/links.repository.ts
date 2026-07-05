import { prisma } from "@/lib/prisma";

export const linksRepository = {
  listByProject(projectId: string) {
    return prisma.utmLink.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { clicks: true } } },
    });
  },

  findBySlug(slug: string) {
    return prisma.utmLink.findUnique({ where: { slug } });
  },

  create(
    projectId: string,
    data: {
      slug: string;
      destinationUrl: string;
      campaignId?: string | null;
      utmSource: string;
      utmMedium: string;
      utmCampaign: string;
      utmTerm?: string | null;
      utmContent?: string | null;
    }
  ) {
    return prisma.utmLink.create({ data: { projectId, ...data } });
  },
};

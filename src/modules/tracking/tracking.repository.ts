import { prisma } from "@/lib/prisma";

export const trackingRepository = {
  recordClick(data: {
    utmLinkId: string;
    projectId: string;
    visitorId: string;
    ipHash: string | null;
    userAgent: string | null;
    deviceType: string;
    os: string;
    browser: string;
    country: string | null;
    referer: string | null;
    isBot: boolean;
  }) {
    return prisma.click.create({ data, select: { id: true } });
  },
};

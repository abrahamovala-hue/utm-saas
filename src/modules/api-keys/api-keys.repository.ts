import { prisma } from "@/lib/prisma";

export const apiKeysRepository = {
  listByProject(projectId: string) {
    return prisma.apiKey.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
        // keyHash NUNCA sai do banco para a UI
      },
    });
  },

  create(projectId: string, data: { name: string; keyHash: string; keyPrefix: string }) {
    return prisma.apiKey.create({
      data: { projectId, ...data },
      select: { id: true, name: true, keyPrefix: true, createdAt: true },
    });
  },

  findByIdAndProject(id: string, projectId: string) {
    return prisma.apiKey.findFirst({ where: { id, projectId } });
  },

  revoke(id: string) {
    return prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },
};

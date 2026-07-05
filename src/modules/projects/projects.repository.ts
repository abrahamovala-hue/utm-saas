import { prisma } from "@/lib/prisma";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.schemas";

// Todas as consultas são escopadas pelo userId via ProjectMember.
// Isolamento multi-tenant acontece AQUI, na camada de dados —
// nenhuma rota consegue "esquecer" de filtrar por dono.

export const projectsRepository = {
  listByUser(userId: string) {
    return prisma.project.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { utmLinks: true } } },
    });
  },

  findByIdForUser(projectId: string, userId: string) {
    return prisma.project.findFirst({
      where: { id: projectId, members: { some: { userId } } },
    });
  },

  // Projeto + membership OWNER nascem juntos, atomicamente.
  create(userId: string, data: CreateProjectInput) {
    return prisma.project.create({
      data: {
        ...data,
        members: { create: { userId, role: "OWNER" } },
      },
    });
  },

  update(projectId: string, data: UpdateProjectInput) {
    return prisma.project.update({ where: { id: projectId }, data });
  },

  logActivity(userId: string, projectId: string, action: string) {
    return prisma.activityLog.create({ data: { userId, projectId, action } });
  },
};

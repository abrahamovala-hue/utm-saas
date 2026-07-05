import { prisma } from "@/lib/prisma";

// Única camada do módulo que toca o banco.

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  createUser(data: { name: string; email: string; passwordHash: string }) {
    return prisma.user.create({
      data,
      select: { id: true, name: true, email: true, createdAt: true },
    });
  },

  logActivity(userId: string, action: string) {
    return prisma.activityLog.create({
      data: { userId, action },
    });
  },
};

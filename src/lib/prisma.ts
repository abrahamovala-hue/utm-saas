import { PrismaClient } from "@prisma/client";

// Singleton do Prisma Client.
// Em desenvolvimento, o hot-reload do Next.js recriaria o client a cada
// mudança de arquivo, esgotando o pool de conexões do PostgreSQL.
// Este padrão garante uma única instância viva.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

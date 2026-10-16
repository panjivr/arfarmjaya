import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Only create a client when a database is configured. When DATABASE_URL is
// absent, protected storage requests fail closed instead of uploading cache.
export const prisma: PrismaClient | null = process.env.DATABASE_URL
  ? globalForPrisma.prisma ?? new PrismaClient()
  : null;

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}

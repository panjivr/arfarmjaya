import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Only create a client when a database is configured. When DATABASE_URL is
// absent (e.g. local dev without a DB) the API routes fall back gracefully
// and the app keeps working from the browser cache.
export const prisma: PrismaClient | null = process.env.DATABASE_URL
  ? globalForPrisma.prisma ?? new PrismaClient()
  : null;

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}

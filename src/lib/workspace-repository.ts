import type { Prisma, PrismaClient } from "@prisma/client";
import type { AppRole } from "./rbac";
import type { WorkspaceData } from "./workspace-data";
import { writeWorkspace } from "./workspace-write";

export async function savePrismaWorkspace(prisma: PrismaClient, data: WorkspaceData, expected: string, role: AppRole) {
  return prisma.$transaction(async (tx) => writeWorkspace({
    // All writes to main must acquire this same lock before reading revision.
    lock: async () => { await tx.$queryRaw`SELECT pg_advisory_xact_lock(172936, 1)::text`; },
    read: () => tx.workspace.findUnique({ where: { id: "main" } }),
    save: async (row) => {
      const values = { data: row.data as Prisma.InputJsonValue, updatedAt: row.updatedAt };
      await tx.workspace.upsert({ where: { id: "main" }, update: values, create: { id: "main", ...values } });
    },
    backup: async (row) => { await tx.workspace.create({ data: { id: row.id, data: row.data as Prisma.InputJsonValue, updatedAt: row.updatedAt } }); },
    pruneBackups: async (keep) => {
      const expired = await tx.workspace.findMany({ where: { id: { startsWith: "backup:" } }, orderBy: { updatedAt: "desc" }, skip: keep, select: { id: true } });
      if (expired.length) await tx.workspace.deleteMany({ where: { id: { in: expired.map((r) => r.id) } } });
    },
  }, data, expected, role), { timeout: 30_000 });
}

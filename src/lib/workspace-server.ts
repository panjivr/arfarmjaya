import { externalizeImages } from "@/lib/object-storage";
import { createHash, randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { COLLECTIONS, records, readable, writable, recordKey, type Operation, type Snapshot, type Versions } from "@/lib/workspace-protocol";
import { validateBusinessRecord } from "@/lib/workspace-validation";
import type { SessionPayload } from "@/lib/session";

export class WorkspaceError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
const json = (value: unknown) => value as Prisma.InputJsonValue;
// Serialize migration and batches across all Vercel instances, not just one process.
async function locked<T>(run: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  if (process.env.WORKSPACE_RECORDS_ENABLED !== "true") throw new WorkspaceError(503, "storage_upgrade_pending");
  if (!prisma) throw new WorkspaceError(503, "database_unavailable");
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(72438192)`;
    await migrate(tx);
    return run(tx);
  }, { maxWait: 10000, timeout: 30000 });
}
async function migrate(tx: Prisma.TransactionClient) {
  if (await tx.workspace.findUnique({ where: { id: "records:v1" } })) return;
  const legacy = await tx.workspace.findUnique({ where: { id: "main" } });
  if (!legacy || !legacy.data || typeof legacy.data !== "object" || Array.isArray(legacy.data)) {
    throw new WorkspaceError(503, "workspace_not_initialized");
  }
  const source = legacy.data as Snapshot;
  // Validate the complete source before creating any migrated records.
  const rows = COLLECTIONS.flatMap(collection => [...records(collection, source[collection] ?? (collection === "settings" ? {} : []))].map(([recordId, data], position) => ({ collection, recordId, data: json(data), position })));
  for (const row of rows) validateBusinessRecord(row.collection, row.recordId, row.data);
  await tx.workspaceBackup.create({ data: { id: "before-record-migration-v1", payload: gzipSync(Buffer.from(JSON.stringify(legacy.data))) } });
  if (rows.length) await tx.workspaceRecord.createMany({ data: rows });
  await tx.workspace.create({ data: { id: "records:v1", data: { migratedAt: new Date().toISOString(), count: rows.length } } });
  // The original main document remains intact for rollback/export. Never overwritten.
}
export async function readWorkspace(session: SessionPayload) {
  return locked(async tx => {
    const allowed = readable(session.role);
    const rows = await tx.workspaceRecord.findMany({ where: { collection: { in: allowed } }, orderBy: [{ position: "asc" }, { recordId: "asc" }] });
    const data: Snapshot = {};
    const versions: Versions = {};
    for (const key of allowed) data[key] = key === "settings" ? {} : [];
    let updatedAt: Date | null = null;
    for (const row of rows) {
      versions[recordKey(row.collection, row.recordId)] = row.version;
      if (!updatedAt || row.updatedAt > updatedAt) updatedAt = row.updatedAt;
      if (row.deleted) continue;
      const key = row.collection as keyof Snapshot;
      if (key === "settings") data.settings = row.data;
      else (data[key] as unknown[]).push(row.data);
    }
    return { data, versions, updatedAt, writable: writable(session.role), protocol: 2, db: true };
  });
}
export async function applyBatch(session: SessionPayload, requestId: string, operations: Operation[]) {
  if (process.env.WORKSPACE_RECORDS_ENABLED !== "true") throw new WorkspaceError(503, "storage_upgrade_pending");
  const allowed = writable(session.role);
  const seen = new Set<string>();
  for (const op of operations) {
    if (!allowed.includes(op.collection)) throw new WorkspaceError(403, "forbidden_collection");
    const key = recordKey(op.collection, op.id);
    if (seen.has(key)) throw new WorkspaceError(400, "duplicate_operation");
    seen.add(key);
    if (op.data !== null) {
      try { validateBusinessRecord(op.collection, op.id, op.data); } catch { throw new WorkspaceError(400, "invalid_record"); }
    }
  }
  const digest = createHash("sha256").update(JSON.stringify(operations)).digest("hex");
  if (!prisma) throw new WorkspaceError(503, "database_unavailable");
  const completed = await prisma.workspaceChange.findUnique({ where: { id: requestId } });
  if (completed) {
    if (completed.actorId !== session.uid || completed.digest !== digest) throw new WorkspaceError(409, "request_id_reused");
    return completed.result;
  }
  const assets = new Map<string, Set<string>>();
  const prepared: Operation[] = [];
  for (const op of operations) {
    const digests = new Set<string>();
    const references = new Set<string>();
    const data = op.data === null ? null : await externalizeImages(op.data, digests, references);
    for (const digest of references) {
      const refs = await prisma!.workspaceAsset.findMany({ where: { digest, collection: { in: readable(session.role) } } });
      if (!refs.length) throw new WorkspaceError(403, "forbidden_attachment");
    }
    assets.set(recordKey(op.collection, op.id), digests);
    prepared.push({ ...op, data: data as Operation["data"] });
  }
  return locked(async tx => {
    const previous = await tx.workspaceChange.findUnique({ where: { id: requestId } });
    if (previous) {
      if (previous.actorId !== session.uid || previous.digest !== digest) throw new WorkspaceError(409, "request_id_reused");
      return previous.result;
    }
    const current = await tx.workspaceRecord.findMany({ where: { OR: operations.map(op => ({ collection: op.collection, recordId: op.id })) } });
    const byKey = new Map(current.map(row => [recordKey(row.collection, row.recordId), row]));
    for (const op of operations) {
      if ((byKey.get(recordKey(op.collection, op.id))?.version ?? 0) !== op.expectedVersion) throw new WorkspaceError(409, "record_conflict");
    }
    const changes = [];
    const versions: Versions = {};
    const at = new Date();
    for (const op of prepared) {
      const key = recordKey(op.collection, op.id), old = byKey.get(key);
      const version = (old?.version ?? 0) + 1;
      // Newest records sort first, preserving the application's existing feeds.
      const position = old?.position ?? -Math.floor(at.getTime() / 1000);
      await tx.workspaceRecord.upsert({
        where: { collection_recordId: { collection: op.collection, recordId: op.id } },
        create: { collection: op.collection, recordId: op.id, data: op.data === null ? Prisma.JsonNull : json(op.data), deleted: op.data === null, version, position },
        update: { data: op.data === null ? Prisma.JsonNull : json(op.data), deleted: op.data === null, version },
      });
      await tx.workspaceAsset.deleteMany({ where: { collection: op.collection, recordId: op.id } });
      const digests = assets.get(key)!;
      if (digests.size) await tx.workspaceAsset.createMany({ data: [...digests].map(digest => ({ collection: op.collection, recordId: op.id, digest })) });
      changes.push({ collection: op.collection, id: op.id, before: old?.data ?? null, after: op.data, version });
      versions[key] = version;
    }
    const auditId = randomUUID();
    await tx.workspaceRecord.create({ data: { collection: "auditLog", recordId: auditId, position: -Math.floor(at.getTime() / 1000), data: { id: auditId, actor: session.name, action: "Simpan", entity: "Server", detail: `${operations.length} perubahan (${requestId})`, createdAt: at.toISOString() } } });
    const result = { ok: true, versions, updatedAt: at.toISOString(), db: true };
    await tx.workspaceChange.create({ data: { id: requestId, actorId: session.uid, digest, changes: json(changes), result: json(result) } });
    return result;
  });
}

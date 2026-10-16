import { after, test } from "node:test";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { readWorkspace, applyBatch, WorkspaceError } from "../src/lib/workspace-server";
import { COLLECTIONS } from "../src/lib/workspace-protocol";
import { useUiStore } from "../src/lib/store";
import type { SessionPayload } from "../src/lib/session";

assert(prisma && new URL(process.env.DATABASE_URL!).hostname === "127.0.0.1", "Integration tests require disposable local database");
const db = prisma!;
const admin: SessionPayload = { uid: "admin-test", username: "admin", name: "Admin", role: "ADMIN_UTAMA", exp: 9999999999 };
const staff: SessionPayload = { ...admin, uid: "staff-test", role: "STAFF_LELE" };
const original = JSON.parse(JSON.stringify(Object.fromEntries(COLLECTIONS.map(k => [k, useUiStore.getState()[k]]))));
after(async () => { await db.$disconnect(); });

test("migrate existing data without touching original; create recoverable backup", async () => {
  await db.workspace.create({ data: { id: "main", data: original } });
  const result = await readWorkspace(admin);
  assert.equal((result.data.products as unknown[]).length, original.products.length);
  assert.equal((result.data.ponds as unknown[]).length, original.ponds.length);
  assert.deepEqual((await db.workspace.findUniqueOrThrow({ where: { id: "main" } })).data, original);
  const backup = await db.workspaceBackup.findUniqueOrThrow({ where: { id: "before-record-migration-v1" } });
  assert.deepEqual(JSON.parse(gunzipSync(backup.payload).toString()), original);
  const count = await db.workspaceRecord.count();
  await readWorkspace(admin);
  assert.equal(await db.workspaceRecord.count(), count);
});
test("concurrent edits to SAME record: one succeeds and one conflicts, without lost updates", async () => {
  const pond = original.ponds[0];
  const results = await Promise.allSettled([
    applyBatch(admin, randomUUID(), [{ collection: "ponds", id: pond.id, expectedVersion: 1, data: { ...pond, name: "Editor A" } }]),
    applyBatch(admin, randomUUID(), [{ collection: "ponds", id: pond.id, expectedVersion: 1, data: { ...pond, name: "Editor B" } }]),
  ]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  const rejected = results.find(r => r.status === "rejected") as PromiseRejectedResult;
  assert(rejected.reason instanceof WorkspaceError);
  assert.equal(rejected.reason.code, "record_conflict");
  assert.equal((await db.workspaceRecord.findUniqueOrThrow({ where: { collection_recordId: { collection: "ponds", recordId: pond.id } } })).version, 2);
});
test("different records persist independently; retrying a request is idempotent", async () => {
  const p1 = { ...original.ponds[0], id: randomUUID(), code: "TEST-A" };
  const p2 = { ...original.ponds[0], id: randomUUID(), code: "TEST-B" };
  const requestId = randomUUID();
  const op = { collection: "ponds" as const, id: p1.id, expectedVersion: 0, data: p1 };
  await Promise.all([
    applyBatch(admin, requestId, [op]),
    applyBatch(admin, randomUUID(), [{ collection: "ponds", id: p2.id, expectedVersion: 0, data: p2 }]),
  ]);
  const before = await db.workspaceChange.count();
  await applyBatch(admin, requestId, [op]);
  assert.equal(await db.workspaceChange.count(), before);
  assert.equal(await db.workspaceRecord.count({ where: { recordId: { in: [p1.id, p2.id] } } }), 2);
  await assert.rejects(applyBatch(staff, requestId, [op]), /request_id_reused/);
});
test("conflict in one operation rolls back the entire batch", async () => {
  const pond = original.ponds[0];
  const freshId = randomUUID();
  await assert.rejects(applyBatch(admin, randomUUID(), [
    { collection: "ponds", id: freshId, expectedVersion: 0, data: { ...pond, id: freshId } },
    { collection: "ponds", id: pond.id, expectedVersion: 1, data: pond },
  ]), /record_conflict/);
  assert.equal(await db.workspaceRecord.count({ where: { recordId: freshId } }), 0);
});
test("server enforces permissions, shapes, private attachment references, and immutable audit", async () => {
  assert(!("products" in (await readWorkspace(staff)).data));
  assert(!("users" in (await readWorkspace(staff)).data));
  await assert.rejects(applyBatch(staff, randomUUID(), [{ collection: "settings", id: "singleton", expectedVersion: 1, data: original.settings }]), /forbidden_collection/);
  await assert.rejects(applyBatch(admin, randomUUID(), [{ collection: "ponds", id: "bad", expectedVersion: 0, data: { id: "bad", name: 3 } }]), /invalid_record/);
  await assert.rejects(applyBatch(admin, randomUUID(), [{ collection: "auditLog", id: "a", expectedVersion: 0, data: null }]), /forbidden_collection/);
  const id = randomUUID();
  await assert.rejects(applyBatch(admin, randomUUID(), [{ collection: "ponds", id, expectedVersion: 0, data: { ...original.ponds[0], id, note: `/api/files/${"a".repeat(64)}` } }]), /forbidden_attachment/);
});
test("deletion tombstones reject stale resurrection and remain in history", async () => {
  const pond = original.ponds[1];
  const id = randomUUID();
  await applyBatch(admin, id, [{ collection: "ponds", id: pond.id, expectedVersion: 1, data: null }]);
  const result = await readWorkspace(admin);
  assert(!(result.data.ponds as { id: string }[]).some(p => p.id === pond.id));
  assert.equal(result.versions[`ponds:${pond.id}`], 2);
  await assert.rejects(applyBatch(admin, randomUUID(), [{ collection: "ponds", id: pond.id, expectedVersion: 1, data: pond }]), /record_conflict/);
  assert(await db.workspaceChange.findUnique({ where: { id } }));
});
test("invalid legacy data fails atomically; never initializes from browser cache", async () => {
  await db.workspaceAsset.deleteMany(); await db.workspaceChange.deleteMany(); await db.workspaceRecord.deleteMany(); await db.workspaceBackup.deleteMany(); await db.workspace.deleteMany();
  await assert.rejects(readWorkspace(admin), /workspace_not_initialized/);
  await db.workspace.create({ data: { id: "main", data: { ...original, ponds: [{ id: "invalid", name: 5 }] } } });
  await assert.rejects(readWorkspace(admin));
  assert.equal(await db.workspaceRecord.count(), 0);
  assert.equal(await db.workspaceBackup.count(), 0);
  assert.equal(await db.workspace.count({ where: { id: "records:v1" } }), 0);
});

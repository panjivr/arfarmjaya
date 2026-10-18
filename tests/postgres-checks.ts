import assert from "node:assert/strict";
import type { PrismaClient } from "@prisma/client";
import { savePrismaWorkspace } from "../src/lib/workspace-repository";
import { workspaceRevision } from "../src/lib/workspace-write";
import { WORKSPACE_KEYS } from "../src/lib/workspace-data";

// Run exclusively against an empty disposable database, never company data.
export async function runPostgresChecks(client: PrismaClient) {
  await client.$executeRaw`CREATE TABLE IF NOT EXISTS "Workspace" ("id" TEXT PRIMARY KEY, "data" JSONB NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL)`;
  assert.equal(await client.workspace.count(), 0, "Test requires an empty disposable database");
  const data = Object.fromEntries(WORKSPACE_KEYS.map((key) => [key, key === "settings" ? { companyName: "AR", address: "", phone: "", taxNumber: "", currency: "IDR", lowStockThreshold: 1, expiryWarningDays: 30 } : []]));
  let row = await savePrismaWorkspace(client, data, "empty", "ADMIN_UTAMA");
  assert.equal(await client.workspace.count(), 1);
  console.log("PASS database initialization");
  const revision = workspaceRevision(row);
  const results = await Promise.allSettled([
    savePrismaWorkspace(client, { ...data, ponds: [{ id: "a" }] }, revision, "ADMIN_UTAMA"),
    savePrismaWorkspace(client, { ...data, ponds: [{ id: "b" }] }, revision, "ADMIN_UTAMA"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason.status, 409);
  assert.equal(await client.workspace.count({ where: { id: { startsWith: "backup:" } } }), 1);
  assert.deepEqual((await client.workspace.findFirst({ where: { id: { startsWith: "backup:" } } }))?.data, data);
  console.log("PASS concurrent transactions and previous-data backup");
  row = (await client.workspace.findUniqueOrThrow({ where: { id: "main" } }));
  await assert.rejects(savePrismaWorkspace(client, { ...data, users: [{ id: "unauthorized" }] }, workspaceRevision(row), "STAFF_GUDANG"));
  assert.equal(workspaceRevision(await client.workspace.findUnique({ where: { id: "main" } })), workspaceRevision(row));
  console.log("PASS authorization failure rolls back");
  // Inject a database-level failure at the final write. The earlier backup
  // insertion must roll back with it, preserving both main and backup history.
  await client.$executeRawUnsafe(`ALTER TABLE "Workspace" ADD CONSTRAINT "audit_failure" CHECK (id <> 'main' OR NOT (data ? 'failTest'))`);
  const count = await client.workspace.count();
  await assert.rejects(savePrismaWorkspace(client, { ...data, failTest: true }, workspaceRevision(row), "ADMIN_UTAMA"));
  assert.equal(await client.workspace.count(), count);
  assert.equal(workspaceRevision(await client.workspace.findUnique({ where: { id: "main" } })), workspaceRevision(row));
  await client.$executeRawUnsafe(`ALTER TABLE "Workspace" DROP CONSTRAINT "audit_failure"`);
  console.log("PASS backup and main write roll back together on SQL failure");
  for (let n = 0; n < 23; n++) row = await savePrismaWorkspace(client, { ...data, ponds: [{ id: `pond-${n}` }] }, workspaceRevision(row), "ADMIN_UTAMA");
  assert.equal(await client.workspace.count({ where: { id: { startsWith: "backup:" } } }), 20);
  console.log("PASS rolling retention of 20 previous versions");
}

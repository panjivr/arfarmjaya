import { test } from "node:test";
import assert from "node:assert/strict";
import { writeWorkspace, workspaceRevision, authorizeWorkspaceWrite, type WorkspaceTransaction, type WorkspaceRow } from "../src/lib/workspace-write";

function database() {
  let row: WorkspaceRow | null = { id: "main", data: { products: ["original"] }, updatedAt: new Date(0) };
  let backups: WorkspaceRow[] = [];
  let lockTail = Promise.resolve();
  return {
    get row() { return row; }, get backups() { return backups; },
    async transaction(data: Record<string, unknown>, revision: string, failBackup = false) {
      let release!: () => void;
      const previous = lockTail;
      lockTail = new Promise<void>((resolve) => { release = resolve; });
      const tx: WorkspaceTransaction = {
        lock: () => previous,
        read: async () => row,
        backup: async (saved) => { if (failBackup) throw new Error("disk full"); backups.push(saved); },
        save: async (saved) => { row = saved; },
        pruneBackups: async (keep) => { backups = backups.slice(-keep); },
      };
      try { return await writeWorkspace(tx, data, revision, "ADMIN_UTAMA"); } finally { release(); }
    },
  };
}

test("simultaneous devices: exactly one write commits; stale device cannot overwrite", async () => {
  const db = database(), revision = workspaceRevision(db.row);
  const results = await Promise.allSettled([db.transaction({ products: ["A"] }, revision), db.transaction({ products: ["B"] }, revision)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
  assert.equal(rejected.reason.status, 409);
  assert.deepEqual(db.row?.data, { products: ["A"] });
  assert.deepEqual(db.backups[0].data, { products: ["original"] });
});
test("backup failure aborts replacement; retries with same acknowledged data are idempotent", async () => {
  const db = database(), before = db.row;
  await assert.rejects(db.transaction({ products: ["new"] }, workspaceRevision(before), true));
  assert.equal(db.row, before);
  await db.transaction(before!.data as Record<string, unknown>, workspaceRevision(before));
  assert.equal(db.backups.length, 0);
});
test("retain latest 20 pre-write snapshots and strictly advance revision", async () => {
  const db = database();
  for (let n = 0; n < 25; n++) {
    const before = db.row;
    await db.transaction({ products: [n] }, workspaceRevision(before));
    assert.notEqual(workspaceRevision(db.row), workspaceRevision(before));
    assert.ok(db.row!.updatedAt > before!.updatedAt);
  }
  assert.equal(db.backups.length, 20);
  assert.deepEqual(db.backups.at(-1)?.data, { products: [23] });
});
test("staff cannot replace another department's data or initialize a database", () => {
  const before = { products: [], ponds: [], settings: { companyName: "AR" } };
  assert.throws(() => authorizeWorkspaceWrite("STAFF_LELE", before, { ...before, products: ["changed"] }), /forbidden_workspace_change/);
  assert.throws(() => authorizeWorkspaceWrite("STAFF_GUDANG", before, { ...before, settings: { companyName: "changed" } }));
  assert.throws(() => authorizeWorkspaceWrite("STAFF_GUDANG", null, before));
  assert.doesNotThrow(() => authorizeWorkspaceWrite("STAFF_LELE", before, { ...before, ponds: ["changed"] }));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeOperations, records, writable, readable, batchSchema } from "../src/lib/workspace-protocol";
import { validateBusinessRecord } from "../src/lib/workspace-validation";
import { useUiStore } from "../src/lib/store";
import { readDraft, writeDraft } from "../src/lib/workspace-draft";
import "fake-indexeddb/auto";

test("one edited record never includes unchanged records or hidden collections", () => {
  const a = { id: "a", amount: 10 }, b = { id: "b", amount: 20 };
  const ops = makeOperations({ financeTx: [a, b] }, { financeTx: [{ ...a, amount: 12 }, b], products: [] }, { "financeTx:a": 4 }, ["financeTx"]);
  assert.deepEqual(ops, [{ collection: "financeTx", id: "a", expectedVersion: 4, data: { ...a, amount: 12 } }]);
});
test("delete includes expected revision; reorder creates no writes", () => {
  const a = { id: "a" }, b = { id: "b" };
  assert.deepEqual(makeOperations({ ponds: [a, b] }, { ponds: [b, a] }, {}, ["ponds"]), []);
  assert.deepEqual(makeOperations({ ponds: [a] }, { ponds: [] }, { "ponds:a": 2 }, ["ponds"]), [{ collection: "ponds", id: "a", expectedVersion: 2, data: null }]);
});
test("staff cannot modify other modules, settings or immutable audit", () => {
  assert(!writable("STAFF_LELE").includes("products"));
  assert(!readable("STAFF_LELE").includes("users"));
  assert(!writable("STAFF_REPORTING").includes("pondLogs"));
  assert(!writable("ADMIN_UTAMA").includes("auditLog"));
});
test("malformed backups, duplicate IDs and mismatched field types fail", () => {
  assert.throws(() => records("ponds", [{ id: "x" }, { id: "x" }]));
  assert.throws(() => records("ponds", "oops"));
  assert.throws(() => validateBusinessRecord("weeklyReports", "r", { id: "r", activities: "oops" }));
  assert.throws(() => validateBusinessRecord("settings", "singleton", {}));
  assert(!batchSchema.safeParse({ requestId: "no", operations: [] }).success);
});
test("SKU duplication and invalid quantities cannot create partial sales", () => {
  const state = useUiStore.getState(), p = state.products[0];
  useUiStore.setState({ products: [{ ...p, currentStock: 10 }], movements: [], posSales: [] });
  const line = { sku: p.sku, name: p.name, quantity: 6, price: 100, unit: p.unit };
  assert.equal(state.createSale({ lines: [line, line], discount: 0, payment: "Tunai", paid: 1200 }).ok, false);
  assert.equal(useUiStore.getState().products[0].currentStock, 10);
  assert.equal(useUiStore.getState().posSales.length, 0);
  assert.equal(state.recordMovement({ type: "out", sku: p.sku, quantity: NaN }).ok, false);
  assert.equal(state.recordMovement({ type: "adjust", sku: p.sku, quantity: 0 }).ok, true);
  assert.equal(useUiStore.getState().products[0].currentStock, 0);
});
test("durable drafts survive reload, preserve request ID and are isolated by user", async () => {
  const draft = { base: { ponds: [] }, next: { ponds: [{ id: "a" }] }, versions: {}, at: "now", request: { requestId: crypto.randomUUID(), operations: [] } };
  await writeDraft("admin", draft);
  assert.deepEqual(await readDraft("admin"), draft);
  assert.equal(await readDraft("staff"), undefined);
  await writeDraft("admin");
  assert.equal(await readDraft("admin"), undefined);
});

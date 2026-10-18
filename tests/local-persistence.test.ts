import { test } from "node:test";
import assert from "node:assert/strict";
import { safeStorage, preserveLocalSnapshot, readLocalBackup, useStorageHealth } from "../src/lib/local-persistence";

const values = new Map<string, string>();
let quotaFull = false;
const storage = {
  get length() { return values.size; },
  clear() { values.clear(); },
  key(i: number) { return [...values.keys()][i] ?? null; },
  getItem(key: string) { return values.get(key) ?? null; },
  setItem(key: string, value: string) { if (quotaFull) throw new Error("QuotaExceededError"); values.set(key, value); },
  removeItem(key: string) { values.delete(key); },
};
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "window", { value: {}, configurable: true });

test("quota errors are visible and old local persistence is not erased", () => {
  storage.setItem("state", "original");
  quotaFull = true;
  safeStorage.setItem("state", "new");
  assert.equal(storage.getItem("state"), "original");
  assert.match(useStorageHealth.getState().error!, /Gagal menyimpan/);
  quotaFull = false;
  safeStorage.setItem("state", "new");
  assert.equal(useStorageHealth.getState().error, undefined);
});
test("local replacements preserve earlier recovery snapshots; full quota blocks replacement", () => {
  values.clear();
  assert.equal(preserveLocalSnapshot({ data: "first" }), true);
  assert.equal(preserveLocalSnapshot({ data: "second" }), true);
  assert.equal(readLocalBackup()?.data.data, "second");
  assert.ok([...values.entries()].some(([k, v]) => k.startsWith("arfarmjaya-local-backup:") && JSON.parse(v).data.data === "first"));
  quotaFull = true;
  assert.equal(preserveLocalSnapshot({ data: "third" }), false);
  assert.equal(readLocalBackup()?.data.data, "second");
  quotaFull = false;
});
test("real store backup round-trips; malformed imports and failed safety backup cannot replace data", async () => {
  const { useUiStore } = await import("../src/lib/store");
  const before = useUiStore.getState().exportBackup();
  assert.equal(useUiStore.getState().importBackup(before).ok, true);
  const products = useUiStore.getState().products;
  const malformed = { ...JSON.parse(before), products: null };
  assert.equal(useUiStore.getState().importBackup(JSON.stringify(malformed)).ok, false);
  assert.equal(useUiStore.getState().products, products);
  quotaFull = true;
  assert.equal(useUiStore.getState().importBackup(before).ok, false);
  assert.equal(useUiStore.getState().products, products);
  assert.throws(() => useUiStore.getState().resetData(), /Reset dibatalkan/);
  assert.equal(useUiStore.getState().products, products);
  quotaFull = false;
});
test("business history is not silently truncated at the previous retention limits", async () => {
  const { useUiStore } = await import("../src/lib/store");
  const store = useUiStore.getState();
  const product = store.products[0];
  store.recordMovement({ type: "in", sku: product.sku, quantity: 1 });
  const movement = useUiStore.getState().movements[0];
  const audit = useUiStore.getState().auditLog[0];
  useUiStore.setState({
    movements: Array.from({ length: 1000 }, (_, i) => ({ ...movement, id: `old-${i}` })),
    auditLog: Array.from({ length: 500 }, (_, i) => ({ ...audit, id: `old-${i}` })),
  });
  store.recordMovement({ type: "in", sku: product.sku, quantity: 1 });
  assert.equal(useUiStore.getState().movements.length, 1001);
  assert.equal(useUiStore.getState().movements.at(-1)?.id, "old-999");
  assert.equal(useUiStore.getState().auditLog.length, 501);
  const [from, to] = store.ponds;
  const base = { id: "old", date: "2026-10-18", type: "TRANSFER_MASUK" as const, pondId: from.id, pondCode: from.code, qtyKg: 1, actor: "test", createdAt: "2026-10-18" };
  useUiStore.setState({ leleMovements: Array.from({ length: 5000 }, (_, i) => ({ ...base, id: `old-${i}` })) });
  assert.equal(store.transferLele({ date: "2026-10-18", fromPondId: from.id, toPondId: to.id, qtyKg: 1 }).ok, true);
  assert.equal(useUiStore.getState().leleMovements.length, 5002);
  assert.equal(useUiStore.getState().leleMovements.at(-1)?.id, "old-4999");
});
test("corrupt persisted JSON cannot be overwritten with empty defaults", () => {
  storage.setItem("corrupt", "{broken");
  assert.throws(() => safeStorage.getItem("corrupt"));
  safeStorage.setItem("corrupt", '{"state":{}}');
  assert.equal(storage.getItem("corrupt"), "{broken");
});

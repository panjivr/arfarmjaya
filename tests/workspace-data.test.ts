import { test } from "node:test";
import assert from "node:assert/strict";
import { parseWorkspace, WORKSPACE_KEYS, canonicalJson } from "../src/lib/workspace-data";

export function fixture() {
  return Object.fromEntries(WORKSPACE_KEYS.map((key) => [key, key === "settings" ? { companyName: "Perusahaan", address: "", phone: "", taxNumber: "", currency: "IDR", lowStockThreshold: 5, expiryWarningDays: 30 } : []]));
}

test("complete snapshots round-trip; backup metadata cannot become store actions", () => {
  const data = fixture();
  assert.deepEqual(parseWorkspace(data, true), data);
  assert.equal("resetData" in parseWorkspace({ ...data, resetData: "malicious", __backup: "arfarmjaya" }), false);
});
test("reject partial/corrupt backups, duplicate identities and non-finite amounts", () => {
  for (const bad of [null, [], {}, { products: [] }, { ...fixture(), settings: null }, { ...fixture(), invoices: "broken" }, { ...fixture(), ponds: [{ id: "1" }, { id: "1" }] }, { ...fixture(), financeTx: [{ id: "1", amount: Infinity }] }, { ...fixture(), products: [{ sku: "x", name: "x", unit: "kg", currentStock: "10", purchasePrice: 1, retailPrice: 2 }] }, JSON.parse('{"__proto__": {"polluted":true}}')]) {
    assert.throws(() => parseWorkspace(bad));
  }
});
test("legacy complete core backups supported; full writes require every collection", () => {
  const { products, movements, settings } = fixture();
  assert.doesNotThrow(() => parseWorkspace({ products, movements, settings }));
  assert.throws(() => parseWorkspace({ products, movements, settings }, true));
});
test("canonical snapshots compare equally after PostgreSQL JSONB reorders keys", () => {
  assert.equal(canonicalJson({ a: 1, b: [{ c: 2, d: 3 }] }), canonicalJson({ b: [{ d: 3, c: 2 }], a: 1 }));
});
test("canonical serialization preserves JSON rules for optional fields and array entries", () => {
  const data = { note: undefined, amount: 1, nested: [{ reference: undefined, id: "one" }, undefined] };
  assert.deepEqual(JSON.parse(canonicalJson(data)), JSON.parse(JSON.stringify(data)));
  assert.equal(canonicalJson({ note: undefined, amount: 1 }), canonicalJson({ amount: 1 }));
});

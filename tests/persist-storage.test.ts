import { test } from "node:test";
import assert from "node:assert/strict";
import { createPersistStorage, readPersistedMirror } from "../src/lib/persist-storage";
import { useStorageHealth } from "../src/lib/local-persistence";
import type { KvBackend } from "../src/lib/idb-storage";

const validPayload = (company = "PT Uji") => JSON.stringify({
  state: {
    products: [],
    movements: [],
    settings: { companyName: company, address: "", phone: "", taxNumber: "", currency: "IDR", lowStockThreshold: 0, expiryWarningDays: 0 },
  },
  version: 0,
});

function mapBackend(): KvBackend & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    get: async (k) => map.get(k) ?? null,
    set: async (k, v) => { map.set(k, v); },
    remove: async (k) => { map.delete(k); },
  };
}

function fakeLegacy(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    removeItem: (k: string) => { map.delete(k); },
  };
}

test("round-trip: values written to the backend are read back and mirrored", async () => {
  const backend = mapBackend();
  const storage = createPersistStorage(backend, null);
  assert.equal(await storage.getItem("arfarmjaya-wms"), null);
  await storage.setItem("arfarmjaya-wms", validPayload());
  assert.equal(await storage.getItem("arfarmjaya-wms"), validPayload());
  assert.equal(readPersistedMirror(), validPayload());
  await storage.removeItem("arfarmjaya-wms");
  assert.equal(await storage.getItem("arfarmjaya-wms"), null);
});

test("first read migrates a valid legacy localStorage value into IndexedDB", async () => {
  const backend = mapBackend();
  const legacy = fakeLegacy({ "arfarmjaya-wms": validPayload("PT Lama") });
  const storage = createPersistStorage(backend, legacy);
  assert.equal(await storage.getItem("arfarmjaya-wms"), validPayload("PT Lama"));
  assert.equal(backend.map.get("arfarmjaya-wms"), validPayload("PT Lama"));
  assert.equal(legacy.map.has("arfarmjaya-wms"), false);
});

test("an existing IndexedDB value wins; the legacy copy is left untouched", async () => {
  const backend = mapBackend();
  backend.map.set("arfarmjaya-wms", validPayload("PT Baru"));
  const legacy = fakeLegacy({ "arfarmjaya-wms": validPayload("PT Lama") });
  const storage = createPersistStorage(backend, legacy);
  assert.equal(await storage.getItem("arfarmjaya-wms"), validPayload("PT Baru"));
  assert.equal(legacy.map.get("arfarmjaya-wms"), validPayload("PT Lama"));
});

test("a corrupt stored payload blocks writes instead of being overwritten", async () => {
  const backend = mapBackend();
  backend.map.set("arfarmjaya-wms", "{broken json");
  const storage = createPersistStorage(backend, null);
  await assert.rejects(() => storage.getItem("arfarmjaya-wms"));
  assert.match(useStorageHealth.getState().error ?? "", /tidak dapat dibaca/);
  await storage.setItem("arfarmjaya-wms", validPayload());
  assert.equal(backend.map.get("arfarmjaya-wms"), "{broken json");
  useStorageHealth.setState({ error: undefined });
});

test("a corrupt legacy payload is neither migrated nor deleted", async () => {
  const backend = mapBackend();
  const legacy = fakeLegacy({ "arfarmjaya-wms": JSON.stringify({ state: { products: "bukan-array" } }) });
  const storage = createPersistStorage(backend, legacy);
  await assert.rejects(() => storage.getItem("arfarmjaya-wms"));
  assert.equal(legacy.map.has("arfarmjaya-wms"), true);
  assert.equal(backend.map.has("arfarmjaya-wms"), false);
  useStorageHealth.setState({ error: undefined });
});

test("backend write failures surface on the storage health indicator", async () => {
  const failing: KvBackend = {
    get: async () => null,
    set: async () => { throw new Error("QuotaExceededError"); },
    remove: async () => {},
  };
  const storage = createPersistStorage(failing, null);
  await storage.setItem("arfarmjaya-wms", validPayload());
  assert.match(useStorageHealth.getState().error ?? "", /Gagal menyimpan di perangkat/);
  useStorageHealth.setState({ error: undefined });
});

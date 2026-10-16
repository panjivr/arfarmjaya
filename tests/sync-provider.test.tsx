import React, { act } from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { SyncProvider, syncNow, useSyncStatus } from "../src/components/sync-provider";
import { useUiStore } from "../src/lib/store";
import { readDraft, writeDraft } from "../src/lib/workspace-draft";
import "fake-indexeddb/auto";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, React });
const events = new EventTarget();
Object.assign(globalThis, { window: events });
const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => memory.set(k, v), removeItem: (k: string) => memory.delete(k) } });
const held = new Set<string>();
Object.defineProperty(navigator, "locks", { configurable: true, value: {
  request: async (key: string, _options: unknown, callback: (lock: object | null) => Promise<void>) => {
    if (held.has(key)) return callback(null);
    held.add(key); try { return await callback({ name: key }); } finally { held.delete(key); }
  },
} });
const original = useUiStore.getState();
const initialPond = { ...original.ponds[0], id: "server-pond", name: "Server pond" };
const server = () => ({ protocol: 2, db: true, data: { ponds: [initialPond], settings: original.settings }, versions: { "ponds:server-pond": 1 }, writable: ["ponds"], updatedAt: "2026-10-16T00:00:00Z" });
const uid = "client-test";
async function tick() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); }); }
async function mount(path = "/lele") {
  useUiStore.setState({ ...original, hasHydrated: true, user: { id: uid, username: "staff", name: "Staff", role: "STAFF_LELE", label: "Lele" } });
  useSyncStatus.setState({ status: "idle", message: undefined });
  let root!: ReactTestRenderer;
  await act(async () => { root = create(<PathnameContext.Provider value={path}><SyncProvider /></PathnameContext.Provider>); });
  await tick(); return root;
}
async function unmount(root: ReactTestRenderer) { await act(async () => root.unmount()); await tick(); }

test("failed initial read never sends local data and blocks editing", async () => {
  await writeDraft(uid);
  const methods: string[] = [];
  globalThis.fetch = async (_url, init) => { methods.push(init?.method ?? "GET"); return Response.json({ error: "database_unavailable" }, { status: 503 }); };
  const root = await mount();
  assert.equal(useSyncStatus.getState().status, "error");
  assert.equal((await syncNow()).ok, false);
  assert.deepEqual(methods, ["GET"]);
  assert(root.toJSON());
  await unmount(root);
});
test("successful load adopts server; only edited record is sent and confirmed", async () => {
  await writeDraft(uid);
  const bodies: { requestId: string; operations: { collection: string; id: string; expectedVersion: number }[] }[] = [];
  globalThis.fetch = async (_url, init) => {
    if (init?.method === "PATCH") { bodies.push(JSON.parse(String(init.body))); return Response.json({ ok: true, versions: { "ponds:server-pond": 2 }, updatedAt: "later" }); }
    return Response.json(server());
  };
  const root = await mount();
  assert.equal(useUiStore.getState().ponds[0].name, "Server pond");
  assert.equal(useSyncStatus.getState().status, "saved");
  assert.equal(bodies.length, 0);
  await act(async () => { useUiStore.setState({ ponds: [{ ...initialPond, name: "Edited" }] }); });
  await act(async () => { assert.equal((await syncNow()).ok, true); });
  assert.equal(bodies.length, 1);
  assert.equal(bodies[0].operations.length, 1);
  assert.equal(bodies[0].operations[0].expectedVersion, 1);
  assert.equal(await readDraft(uid), undefined);
  assert.equal(useSyncStatus.getState().status, "saved");
  await unmount(root);
});
test("lost response retries same request ID and preserves draft across reload", async () => {
  await writeDraft(uid);
  let loseResponse = true;
  const requests: string[] = [];
  globalThis.fetch = async (_url, init) => {
    if (init?.method === "PATCH") {
      requests.push(JSON.parse(String(init.body)).requestId);
      if (loseResponse) throw new TypeError("offline");
      return Response.json({ ok: true, versions: { "ponds:server-pond": 2 }, updatedAt: "later" });
    }
    return Response.json(server());
  };
  let root = await mount();
  await act(async () => useUiStore.setState({ ponds: [{ ...initialPond, name: "Offline draft" }] }));
  await act(async () => { assert.equal((await syncNow()).ok, false); });
  assert((await readDraft(uid))?.request);
  assert.equal(useSyncStatus.getState().status, "error");
  await unmount(root);
  loseResponse = false;
  root = await mount();
  await tick();
  assert.equal(useUiStore.getState().ponds[0].name, "Offline draft");
  assert.equal(requests.length, 2);
  assert.equal(requests[0], requests[1]);
  assert.equal(await readDraft(uid), undefined);
  await unmount(root);
});
test("conflict retains draft; login-to-app navigation starts synchronization", async () => {
  await writeDraft(uid);
  let reads = 0;
  globalThis.fetch = async (_url, init) => {
    if (init?.method === "PATCH") return Response.json({ error: "record_conflict" }, { status: 409 });
    reads++; return Response.json(server());
  };
  const root = await mount("/login");
  assert.equal(reads, 0);
  await act(async () => root.update(<PathnameContext.Provider value="/lele"><SyncProvider /></PathnameContext.Provider>));
  await tick(); assert.equal(reads, 1);
  await act(async () => useUiStore.setState({ ponds: [{ ...initialPond, name: "Conflict" }] }));
  await act(async () => { assert.equal((await syncNow()).ok, false); });
  assert((await readDraft(uid))?.request);
  assert.match(useSyncStatus.getState().message ?? "", /perangkat lain/);
  await unmount(root); await writeDraft(uid);
});

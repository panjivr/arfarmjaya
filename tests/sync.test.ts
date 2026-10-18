import { test } from "node:test";
import assert from "node:assert/strict";
import { decideSync, type SyncInputs } from "../src/lib/sync-decide";
import { SyncQueue, type SaveReply } from "../src/lib/sync-queue";
const input: SyncInputs = { localStr: "local", baseline: "local", hasServerData: true, serverUpdatedAt: "v2", metaSyncedAt: "v1", metaSig: "old", localSig: "new" };

test("offline edits with a newer server are conflicts, even if edited during load", () => {
  assert.equal(decideSync(input), "conflict");
  assert.equal(decideSync({ ...input, baseline: "before" }), "conflict");
});
test("a clean browser adopts the newer server instead of applying a record-count heuristic", () => {
  assert.equal(decideSync({ ...input, localSig: "old" }), "adopt-server");
  assert.equal(decideSync({ ...input, metaSig: undefined, metaSyncedAt: undefined }), "adopt-server");
});
test("only a matching server version permits offline edits; database disappearance conflicts", () => {
  assert.equal(decideSync({ ...input, serverUpdatedAt: "v1" }), "push-local");
  assert.equal(decideSync({ ...input, hasServerData: false }), "conflict");
  assert.equal(decideSync({ ...input, hasServerData: false, metaSyncedAt: undefined }), "push-local");
});
test("an older browser cache after a failed local write cannot replace the acknowledged server on reload", () => {
  assert.equal(decideSync({ ...input, serverUpdatedAt: "v1", metaCacheFailed: true }), "conflict");
  assert.equal(decideSync({ ...input, serverUpdatedAt: "v1", metaCacheFailed: true, localSig: "old" }), "adopt-server");
});
test("matching server data recovers a lost acknowledgement or another tab's save without a false conflict", () => {
  assert.equal(decideSync({ ...input, serverStr: input.localStr }), "adopt-server");
  assert.equal(decideSync({ ...input, serverStr: input.localStr, metaCacheFailed: true }), "adopt-server");
});
const reply = (revision: string): SaveReply => ({ status: 200, json: { ok: true, revision, updatedAt: revision } });

test("writes cannot run before initial read succeeds", async () => {
  let calls = 0;
  const queue = new SyncQueue(async () => { calls++; return reply("v1"); }, () => {});
  assert.equal((await queue.save("local")).ok, false);
  assert.equal(calls, 0);
});
test("automatic and manual writes are serialized and use the previous acknowledgement", async () => {
  const sent: string[][] = [];
  let release!: (value: SaveReply) => void;
  const queue = new SyncQueue(async (data, version) => {
    sent.push([data, version]);
    if (data === "A") return new Promise<SaveReply>((resolve) => { release = resolve; });
    return reply("v2");
  }, () => {});
  queue.initialize("v0");
  const a = queue.save("A"), b = queue.save("B");
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(sent, [["A", "v0"]]);
  release(reply("v1"));
  assert.equal((await a).ok, true);
  assert.equal((await b).ok, true);
  assert.deepEqual(sent, [["A", "v0"], ["B", "v1"]]);
  assert.equal(queue.acknowledgedSnapshot, "B");
});
test("conflict freezes writes and never acknowledges rejected local data", async () => {
  let calls = 0, acknowledgements = 0;
  const queue = new SyncQueue(async () => { calls++; return { status: 409, json: { ok: false } }; }, () => { acknowledgements++; });
  queue.initialize("v0", "original");
  assert.equal((await queue.save("A")).ok, false);
  assert.equal((await queue.save("B")).ok, false);
  assert.equal(calls, 1);
  assert.equal(acknowledgements, 0);
  assert.equal(queue.acknowledgedSnapshot, "original");
});
test("partial uploads, false HTTP successes, and network failures never mean saved", async () => {
  for (const response of [{ status: 200, json: { ok: true, partial: true } }, { status: 503, json: { ok: true } }, { status: 200, json: { ok: false, db: false } }]) {
    const queue = new SyncQueue(async () => response, () => assert.fail("must not acknowledge"));
    queue.initialize("v0");
    assert.equal((await queue.save("A")).ok, false);
  }
  const queue = new SyncQueue(async () => { throw new Error("offline"); }, () => assert.fail());
  queue.initialize("v0");
  assert.equal((await queue.save("A")).ok, false);
});
test("late response after unmount/logout cannot advance metadata", async () => {
  let release!: (v: SaveReply) => void;
  const queue = new SyncQueue(() => new Promise((resolve) => { release = resolve; }), () => assert.fail("late acknowledgment"));
  queue.initialize("v0");
  const saving = queue.save("A");
  await new Promise((resolve) => setImmediate(resolve));
  queue.stop();
  release(reply("v1"));
  assert.equal((await saving).ok, false);
});

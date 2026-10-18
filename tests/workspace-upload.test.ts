import { test } from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { uploadParameters, assembleUpload, decodeWorkspace } from "../src/lib/workspace-upload";
import { WORKSPACE_KEYS } from "../src/lib/workspace-data";
const prefix = "upload:owner:abcdefghijklmnop:";
function chunk(i: number, content: string) { return { id: `${prefix}${String(i).padStart(5, "0")}`, data: { b64: Buffer.from(content).toString("base64"), total: 2, gzip: false, expected: "v1" } }; }

test("missing, extra, unordered, inconsistent and foreign chunks cannot be committed", () => {
  const a = chunk(0, '{"a":'), b = chunk(1, '1}');
  assert.equal(assembleUpload([a, b], prefix, 2, false, "v1").toString(), '{"a":1}');
  for (const rows of [[b], [a, a], [b, a], [a, { ...b, id: "upload:other:00001" }], [a, { ...b, data: { ...b.data, expected: "v0" } }], [a, { ...b, data: { ...b.data, total: 3 } }]]) {
    assert.throws(() => assembleUpload(rows, prefix, 2, false, "v1"));
  }
});
test("chunk counts/indices are bounded and upload namespaces are isolated per user", () => {
  const headers = (index: string, total: string, id = "abcdefghijklmnop") => new Headers({ "x-upload-id": id, "x-chunk-index": index, "x-chunk-total": total });
  for (const [i, n] of [["NaN", "2"], ["-1", "2"], ["0.5", "2"], ["0", "0"], ["2", "2"], ["0", "21"], ["", ""]]) assert.throws(() => uploadParameters(headers(i, n), "owner"));
  assert.throws(() => uploadParameters(headers("0", "2", "a!b"), "owner"));
  assert.notEqual(uploadParameters(headers("0", "2"), "a:b").prefix, uploadParameters(headers("0", "2"), "a").prefix);
});
test("gzip snapshots round-trip, malformed and truncated JSON never become workspace data", () => {
  const data = Object.fromEntries(WORKSPACE_KEYS.map((key) => [key, key === "settings" ? { companyName: "AR", address: "", phone: "", taxNumber: "", currency: "IDR", lowStockThreshold: 1, expiryWarningDays: 30 } : []]));
  assert.deepEqual(decodeWorkspace(gzipSync(JSON.stringify(data)), true), data);
  assert.throws(() => decodeWorkspace(Buffer.from("broken gzip"), true));
  assert.throws(() => decodeWorkspace(Buffer.from('{"products":['), false));
  assert.throws(() => decodeWorkspace(Buffer.from("{}"), false));
});

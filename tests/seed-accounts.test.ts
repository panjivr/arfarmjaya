import { test } from "node:test";
import assert from "node:assert/strict";
import { seedAccounts } from "../src/lib/seed-accounts";

test("production databases never initialize predictable demo passwords", () => {
  assert.throws(() => seedAccounts({}, true), /ADMIN_PASSWORD/);
  assert.throws(() => seedAccounts({ ADMIN_PASSWORD: "admin123" }, true), /12 karakter/);
  const accounts = seedAccounts({ ADMIN_PASSWORD: "a-strong-test-password" }, true);
  assert.deepEqual(accounts.map((a) => a.username), ["admin"]);
  assert.throws(() => seedAccounts({ ADMIN_PASSWORD: "a-strong-test-password", GUDANG_PASSWORD: "gudang123" }, true), /GUDANG_PASSWORD/);
});
test("documented demo accounts remain available for local development", () => {
  assert.equal(seedAccounts({}, false).length, 3);
  assert.equal(seedAccounts({}, false)[0].password, "admin123");
});

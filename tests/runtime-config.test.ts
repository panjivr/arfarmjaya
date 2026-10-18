import { test } from "node:test";
import assert from "node:assert/strict";
import { productionConfigErrors } from "../src/lib/runtime-config";

test("production requires a real PostgreSQL URL and a sufficiently long session secret", () => {
  assert.equal(productionConfigErrors({}).length, 2);
  assert.equal(productionConfigErrors({ DATABASE_URL: "file:local.db", AUTH_SECRET: "short" }).length, 2);
  assert.deepEqual(productionConfigErrors({ DATABASE_URL: "postgresql://localhost/company_test", AUTH_SECRET: "a".repeat(32) }), []);
});
test("configuration diagnostics never disclose supplied secret or URL values", () => {
  const errors = productionConfigErrors({ DATABASE_URL: "invalid-secret-connection", AUTH_SECRET: "private" }).join(" ");
  assert.equal(errors.includes("private"), false);
  assert.equal(errors.includes("invalid-secret-connection"), false);
});

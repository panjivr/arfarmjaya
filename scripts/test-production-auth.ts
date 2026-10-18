import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { authenticate } from "../src/lib/auth-server";
import { seedAccounts } from "../src/lib/seed-accounts";

async function main() {
  const url = new URL(process.env.DATABASE_URL || "");
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/_(audit|test)$/.test(url.pathname) || process.env.NODE_ENV !== "production") {
    throw new Error("Use NODE_ENV=production and a disposable localhost *_test or *_audit database.");
  }
  if (!prisma) throw new Error("Test database is required.");
  const accounts = seedAccounts(process.env, true);
  assert.equal(await prisma.appUser.count(), 0, "Test requires an empty AppUser table; it never deletes existing accounts.");
  const results = await Promise.all(Array.from({ length: 4 }, () => authenticate("admin", process.env.ADMIN_PASSWORD!)));
  assert.ok(results.every((r) => r.ok), "All concurrent first logins must succeed");
  assert.equal(await prisma.appUser.count(), accounts.length);
  assert.equal((await authenticate("admin", "admin123")).ok, false);
  await prisma.appUser.update({ where: { username: "admin" }, data: { active: false } });
  try { assert.equal((await authenticate("admin", process.env.ADMIN_PASSWORD!)).ok, false); }
  finally { await prisma.appUser.update({ where: { username: "admin" }, data: { active: true } }); }
  console.log("PASS concurrent production account initialization, no demo password, disabled account rejection");
}
void main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma?.$disconnect(); });

import { PrismaClient } from "@prisma/client";
import { runPostgresChecks } from "../tests/postgres-checks";

async function main() {
  const url = new URL(process.env.DATABASE_URL || "");
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/_(audit|test)$/.test(url.pathname)) {
    throw new Error("Use an empty, disposable localhost database named *_audit or *_test. Never use company data.");
  }
  const client = new PrismaClient();
  try { await runPostgresChecks(client); } finally { await client.$disconnect(); }
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });

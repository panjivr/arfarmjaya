import { readFile } from "node:fs/promises";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { COLLECTIONS, records, type Snapshot } from "../src/lib/workspace-protocol";
import { validateBusinessRecord } from "../src/lib/workspace-validation";
import { readWorkspace } from "../src/lib/workspace-server";

async function main() {
  const file = process.argv[2];
  if (!file || !prisma) throw new Error("Usage: npm run storage:import -- /absolute/path/backup.json (DATABASE_URL required)");
  if (process.env.WORKSPACE_RECORDS_ENABLED !== "true") throw new Error("Set WORKSPACE_RECORDS_ENABLED=true before importing");
  const source = JSON.parse(await readFile(file, "utf8")) as Snapshot;
  if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("Invalid backup");
  const normalized: Snapshot = {};
  let count = 0;
  for (const collection of COLLECTIONS) {
    const value = source[collection] ?? (collection === "settings" ? undefined : []);
    for (const [id, data] of records(collection, value)) { validateBusinessRecord(collection, id, data); count++; }
    normalized[collection] = value;
  }
  // Create only. Refuse to overwrite an existing workspace or migrated database.
  await prisma.$transaction(async tx => {
    if (await tx.workspace.count({ where: { id: { in: ["main", "records:v1"] } } })) throw new Error("Database already has a workspace. Import cancelled without replacing data.");
    await tx.workspace.create({ data: { id: "main", data: normalized as Prisma.InputJsonValue } });
  });
  await readWorkspace({ uid: "migration", username: "migration", name: "Migration", role: "ADMIN_UTAMA", exp: 9999999999 });
  console.log(`Imported and verified ${count} records. Original backup preserved in database.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => { await prisma?.$disconnect(); });

import { createHash, randomUUID } from "node:crypto";
import { canonicalJson, type WorkspaceData } from "./workspace-data";
import type { AppRole } from "./rbac";

export class WorkspaceError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

export type WorkspaceRow = { id: string; data: unknown; updatedAt: Date };
export function workspaceRevision(row: WorkspaceRow | null): string {
  return row ? createHash("sha256").update(`${row.updatedAt.toISOString()}:${canonicalJson(row.data)}`).digest("hex") : "empty";
}

const INVENTORY = ["products", "movements", "categories", "suppliers", "warehouses", "racks", "purchaseOrders", "receipts", "distributions", "requests", "opnameSessions", "posSales", "stores", "invoices"];
const LELE = ["ponds", "fishCycles", "pondLogs", "pondHarvests", "pondJournals", "leleSales", "receivables", "payables", "financeTx", "financeCategories", "leleMovements"];

export function authorizeWorkspaceWrite(role: AppRole, previous: unknown, next: WorkspaceData) {
  if (role === "ADMIN_UTAMA") return;
  if (!previous || typeof previous !== "object") throw new WorkspaceError(403, "admin_initialization_required");
  const allowed = new Set([
    ...(role === "STAFF_GUDANG" ? INVENTORY : role === "STAFF_LELE" ? LELE : ["weeklyReports", "reportProfiles"]),
    "auditLog", "readNotifications",
  ]);
  const before = previous as WorkspaceData;
  for (const key of new Set([...Object.keys(before), ...Object.keys(next)])) {
    if (!allowed.has(key) && canonicalJson(before[key]) !== canonicalJson(next[key])) throw new WorkspaceError(403, "forbidden_workspace_change");
  }
}

// A small adapter keeps the transaction policy independently testable. The
// production adapter holds a PostgreSQL transaction advisory lock for main.
export type WorkspaceTransaction = {
  lock(): Promise<void>;
  read(): Promise<WorkspaceRow | null>;
  save(row: WorkspaceRow): Promise<void>;
  backup(row: WorkspaceRow): Promise<void>;
  pruneBackups(keep: number): Promise<void>;
};

export async function writeWorkspace(tx: WorkspaceTransaction, data: WorkspaceData, expected: string, role: AppRole) {
  await tx.lock();
  const before = await tx.read();
  if (workspaceRevision(before) !== expected) throw new WorkspaceError(409, "revision_conflict");
  authorizeWorkspaceWrite(role, before?.data, data);
  if (before && canonicalJson(before.data) === canonicalJson(data)) return before;
  if (before) await tx.backup({ ...before, id: `backup:${randomUUID()}` });
  const row = { id: "main", data, updatedAt: new Date(Math.max(Date.now(), (before?.updatedAt.getTime() ?? 0) + 1)) };
  await tx.save(row);
  await tx.pruneBackups(20);
  return row;
}

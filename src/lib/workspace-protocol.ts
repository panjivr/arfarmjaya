import { z } from "zod";
import type { AppRole } from "@/lib/rbac";

export const COLLECTIONS = [
  "products", "movements", "categories", "suppliers", "warehouses", "racks", "users",
  "purchaseOrders", "receipts", "distributions", "requests", "opnameSessions", "posSales",
  "stores", "invoices", "reportProfiles", "weeklyReports", "ponds", "fishCycles", "pondLogs",
  "pondHarvests", "pondJournals", "leleSales", "receivables", "payables", "financeTx",
  "financeCategories", "leleMovements", "auditLog", "readNotifications", "settings",
] as const;
export type Collection = typeof COLLECTIONS[number];
export type Snapshot = Partial<Record<Collection, unknown>>;
export type Versions = Record<string, number>;
export type RecordData = Record<string, unknown> | string;
export const recordKey = (collection: string, id: string) => `${collection}:${id}`;
const lele: Collection[] = ["ponds", "fishCycles", "pondLogs", "pondHarvests", "pondJournals", "leleSales", "receivables", "payables", "financeTx", "financeCategories", "leleMovements"];
const inventory: Collection[] = ["products", "movements", "categories", "suppliers", "warehouses", "racks", "purchaseOrders", "receipts", "distributions", "requests", "opnameSessions", "posSales", "stores", "invoices"];
export function readable(role: AppRole): Collection[] {
  if (role === "ADMIN_UTAMA") return [...COLLECTIONS];
  if (role === "STAFF_LELE") return [...lele, "settings", "readNotifications"];
  if (role === "STAFF_GUDANG") return [...inventory, "settings", "readNotifications"];
  return [...lele, ...inventory, "weeklyReports", "reportProfiles", "settings", "readNotifications"];
}
export function writable(role: AppRole): Collection[] {
  if (role === "ADMIN_UTAMA") return COLLECTIONS.filter(k => k !== "auditLog" && k !== "users");
  if (role === "STAFF_LELE") return [...lele, "readNotifications"];
  if (role === "STAFF_GUDANG") return [...inventory, "readNotifications"];
  return ["weeklyReports", "reportProfiles", "readNotifications"];
}
const idSchema = z.string().min(1).max(200);
export const operationSchema = z.object({
  collection: z.enum(COLLECTIONS), id: idSchema,
  expectedVersion: z.number().int().min(0),
  data: z.union([z.record(z.string(), z.unknown()), z.string()]).nullable(),
}).strict();
export const batchSchema = z.object({
  requestId: z.string().uuid(),
  operations: z.array(operationSchema).min(1).max(5000),
}).strict();
export type Operation = z.infer<typeof operationSchema>;

export function idFor(collection: Collection, value: unknown): string {
  if (collection === "settings") return "singleton";
  if (collection === "readNotifications") return idSchema.parse(value);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid record: ${collection}`);
  const row = value as Record<string, unknown>;
  return idSchema.parse(collection === "products" ? row.sku : row.id);
}
export function records(collection: Collection, value: unknown): Map<string, RecordData> {
  if (collection === "settings") {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid settings");
    return new Map([["singleton", value as Record<string, unknown>]]);
  }
  if (!Array.isArray(value)) throw new Error(`Invalid collection: ${collection}`);
  const result = new Map<string, RecordData>();
  for (const item of value) {
    const id = idFor(collection, item);
    if (result.has(id)) throw new Error(`Duplicate ID: ${collection}/${id}`);
    validateRecord(collection, id, item);
    result.set(id, item);
  }
  return result;
}
// Reject invalid JSON, non-finite numbers and prototype keys before touching the DB.
export function validateRecord(collection: Collection, id: string, value: unknown) {
  if (idFor(collection, value) !== id) throw new Error("Record ID mismatch");
  function visit(v: unknown, depth: number) {
    if (depth > 30) throw new Error("Record too deeply nested");
    if (typeof v === "number" && !Number.isFinite(v)) throw new Error("Invalid number");
    if (v === undefined || typeof v === "function") throw new Error("Invalid JSON value");
    if (v && typeof v === "object") for (const [key, child] of Object.entries(v)) {
      if (["__proto__", "constructor", "prototype"].includes(key)) throw new Error("Invalid field");
      visit(child, depth + 1);
    }
  }
  visit(value, 0);
  if (collection === "products") {
    const row = value as Record<string, unknown>;
    if (typeof row.currentStock !== "number" || row.currentStock < 0) throw new Error("Invalid stock");
  }
}
export function makeOperations(base: Snapshot, next: Snapshot, versions: Versions, allowed: Collection[]): Operation[] {
  const operations: Operation[] = [];
  for (const collection of allowed) {
    if (next[collection] === undefined) continue;
    const before = records(collection, base[collection] ?? (collection === "settings" ? {} : []));
    const after = records(collection, next[collection]);
    for (const id of new Set([...before.keys(), ...after.keys()])) {
      const old = before.get(id), value = after.get(id);
      if (JSON.stringify(old) === JSON.stringify(value)) continue;
      operations.push({ collection, id, expectedVersion: versions[recordKey(collection, id)] ?? 0, data: value ?? null });
    }
  }
  return operations;
}

// Shared by API, synchronization, and backup import. Never hydrate arbitrary
// keys from a network response into the Zustand store (it also contains actions).
export const WORKSPACE_KEYS = [
  "products", "movements", "categories", "suppliers", "warehouses", "racks", "users",
  "purchaseOrders", "receipts", "distributions", "requests", "opnameSessions", "posSales",
  "stores", "invoices", "reportProfiles", "weeklyReports", "ponds", "fishCycles",
  "pondLogs", "pondHarvests", "pondJournals", "leleSales", "receivables", "payables",
  "financeTx", "financeCategories", "leleMovements", "auditLog", "readNotifications", "settings",
] as const;

export type WorkspaceData = Record<string, unknown>;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validJson(value: unknown, depth = 0): boolean {
  if (depth > 50) return false;
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every((v) => validJson(v, depth + 1));
  return record(value) && Object.entries(value).every(([k, v]) =>
    !["__proto__", "constructor", "prototype"].includes(k) && validJson(v, depth + 1));
}

/** Older backups may omit newer collections, but must contain the core dataset. */
export function parseWorkspace(value: unknown, complete = false): WorkspaceData {
  if (!record(value) || !validJson(value)) throw new Error("Format data tidak valid.");
  for (const key of complete ? WORKSPACE_KEYS : ["products", "movements", "settings"]) {
    if (!(key in value)) throw new Error(`Bagian data ${key} tidak ada.`);
  }
  const out: WorkspaceData = {};
  for (const key of WORKSPACE_KEYS) {
    if (!(key in value)) continue;
    const part = value[key];
    if (key === "settings") {
      if (!record(part) || !["companyName", "address", "phone", "taxNumber", "currency"].every((k) => typeof part[k] === "string") ||
          !["lowStockThreshold", "expiryWarningDays"].every((k) => typeof part[k] === "number" && Number.isFinite(part[k]) && (part[k] as number) >= 0)) {
        throw new Error("Pengaturan dalam cadangan tidak valid.");
      }
    } else {
      if (!Array.isArray(part)) throw new Error(`Bagian ${key} harus berupa daftar.`);
      const ids = new Set<string>();
      for (const item of part) {
        if (key === "readNotifications") {
          if (typeof item !== "string") throw new Error("Notifikasi tidak valid.");
          continue;
        }
        const idKey = key === "products" ? "sku" : "id";
        if (!record(item) || typeof item[idKey] !== "string" || !(item[idKey] as string).trim() || ids.has(item[idKey] as string)) {
          throw new Error(`Identitas pada bagian ${key} tidak valid atau duplikat.`);
        }
        ids.add(item[idKey] as string);
        if (key === "products" && (!["name", "unit"].every((k) => typeof item[k] === "string") ||
            !["currentStock", "purchasePrice", "retailPrice"].every((k) => typeof item[k] === "number" && Number.isFinite(item[k])))) {
          throw new Error("Data produk tidak valid.");
        }
      }
    }
    out[key] = part;
  }
  return out;
}

// Order object keys for stable comparisons across JSONB storage and browsers.
export function canonicalJson(value: unknown): string {
  // Use JSON's own omission/null rules for optional undefined fields. Building
  // JSON by concatenation would produce invalid `"note":undefined` payloads.
  return JSON.stringify(value, (_key, item) => record(item)
    ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]]))
    : item) ?? "undefined";
}

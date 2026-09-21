// ── RBAC: sumber tunggal peran, izin, dan akses rute ───────────────────────
// Dipakai bersama oleh middleware (proteksi rute server-side), route handler
// API (verifikasi izin), dan klien (filter menu + redirect). Jangan hardcode
// izin berdasarkan email/nama user — selalu lewat peran/izin di sini.

export type AppRole = "ADMIN_UTAMA" | "STAFF_LELE" | "STAFF_GUDANG" | "STAFF_REPORTING";

export const APP_ROLES: AppRole[] = ["ADMIN_UTAMA", "STAFF_LELE", "STAFF_GUDANG", "STAFF_REPORTING"];

export const ROLE_META: Record<AppRole, { label: string; workspace: string; home: string }> = {
  ADMIN_UTAMA: { label: "Admin Utama", workspace: "Akses penuh", home: "/dashboard" },
  STAFF_LELE: { label: "Staff Lele", workspace: "Budidaya Lele", home: "/lele" },
  STAFF_GUDANG: { label: "Staff Gudang", workspace: "Inventori & Gudang", home: "/gudang" },
  STAFF_REPORTING: { label: "Staff Reporting", workspace: "Laporan & Rekap", home: "/reporting" },
};

export function isAppRole(v: unknown): v is AppRole {
  return typeof v === "string" && (APP_ROLES as string[]).includes(v);
}
export function roleLabel(role: AppRole): string {
  return ROLE_META[role]?.label ?? role;
}
export function roleHome(role: AppRole): string {
  return ROLE_META[role]?.home ?? "/lele";
}

// ── Izin granular ──────────────────────────────────────────────────────────
export type Permission =
  | "pond.read" | "pond.write"
  | "feed.write" | "harvest.write"
  | "lele.finance.read" | "lele.finance.write"
  | "inventory.read" | "inventory.write"
  | "report.read" | "report.export"
  | "user.manage" | "backup.manage" | "settings.manage" | "audit.read";

const LELE_PERMS: Permission[] = ["pond.read", "pond.write", "feed.write", "harvest.write", "lele.finance.read", "lele.finance.write"];
const GUDANG_PERMS: Permission[] = ["inventory.read", "inventory.write"];
const REPORT_PERMS: Permission[] = ["report.read", "report.export", "pond.read", "inventory.read", "lele.finance.read"];

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  ADMIN_UTAMA: [
    ...LELE_PERMS, ...GUDANG_PERMS, "report.read", "report.export",
    "user.manage", "backup.manage", "settings.manage", "audit.read",
  ],
  STAFF_LELE: [...LELE_PERMS],
  STAFF_GUDANG: [...GUDANG_PERMS],
  STAFF_REPORTING: [...REPORT_PERMS],
};

export function permissionsFor(role: AppRole, overrides: Permission[] = []): Permission[] {
  return Array.from(new Set([...(ROLE_PERMISSIONS[role] ?? []), ...overrides]));
}
export function can(role: AppRole, perm: Permission, overrides: Permission[] = []): boolean {
  if (role === "ADMIN_UTAMA") return true;
  return permissionsFor(role, overrides).includes(perm);
}

// ── Akses rute (prefix) per peran, untuk middleware & filter menu ───────────
// Admin: semua. Lainnya: hanya prefix miliknya + rute umum.
const ROLE_ROUTES: Record<AppRole, string[]> = {
  ADMIN_UTAMA: ["/"],
  STAFF_LELE: ["/lele"],
  STAFF_GUDANG: ["/gudang", "/inventory", "/categories", "/suppliers", "/warehouses", "/racks", "/purchase", "/receiving", "/transactions", "/distribution", "/requests", "/stock-opname"],
  STAFF_REPORTING: ["/reporting", "/weekly-report", "/reports", "/analytics"],
};

// Rute yang boleh diakses semua user login (mis. notifikasi ringan). Sengaja
// minimal; halaman administrasi TIDAK termasuk.
const COMMON_ROUTES = ["/notifications"];

export function canAccessPath(role: AppRole, pathname: string): boolean {
  if (role === "ADMIN_UTAMA") return true;
  const allowed = [...(ROLE_ROUTES[role] ?? []), ...COMMON_ROUTES];
  return allowed.some((base) => pathname === base || pathname.startsWith(base + "/") || pathname === base);
}

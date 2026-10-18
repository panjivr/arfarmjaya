import type { AppRole } from "./rbac";

type SeedAccount = { username: string; name: string; role: AppRole; password: string };
const DEFINITIONS = [
  { username: "admin", name: "Admin Utama", role: "ADMIN_UTAMA", variable: "ADMIN_PASSWORD", demo: "admin123" },
  { username: "lele", name: "Staff Lele", role: "STAFF_LELE", variable: "LELE_PASSWORD", demo: "lele123" },
  { username: "gudang", name: "Staff Gudang", role: "STAFF_GUDANG", variable: "GUDANG_PASSWORD", demo: "gudang123" },
  { username: "laporan", name: "Staff Reporting", role: "STAFF_REPORTING", variable: "LAPORAN_PASSWORD", demo: "laporan123" },
] as const;

export function seedAccounts(env: Record<string, string | undefined>, production: boolean): SeedAccount[] {
  if (production && (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 12)) throw new Error("ADMIN_PASSWORD minimal 12 karakter diperlukan untuk database production yang masih kosong.");
  return DEFINITIONS.flatMap((definition) => {
    const configured = env[definition.variable];
    if (production && !configured) return [];
    if (production && configured!.length < 12) throw new Error(`${definition.variable} minimal 12 karakter.`);
    return [{ username: definition.username, name: definition.name, role: definition.role, password: configured || definition.demo }];
  });
}

import { scrypt as _scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/rbac";
import { isAppRole } from "@/lib/rbac";

const scrypt = promisify(_scrypt) as (pw: string, salt: string, keylen: number) => Promise<Buffer>;

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  role: AppRole;
  active: boolean;
  permissions: string[];
  lastLogin: string | null;
  createdAt: string;
};

// Akun bawaan: menjadi sumber seed saat DB pertama kali kosong, sekaligus
// cadangan darurat saat DB tak terjangkau agar pemilik tak pernah terkunci.
type Builtin = { username: string; name: string; role: AppRole; password: string };
function builtins(): Builtin[] {
  return [
    { username: "admin", name: "Admin Utama", role: "ADMIN_UTAMA", password: process.env.ADMIN_PASSWORD || "admin123" },
    { username: "lele", name: "Staff Lele", role: "STAFF_LELE", password: process.env.LELE_PASSWORD || "lele123" },
    { username: "gudang", name: "Staff Gudang", role: "STAFF_GUDANG", password: process.env.GUDANG_PASSWORD || "gudang123" },
    { username: "laporan", name: "Staff Reporting", role: "STAFF_REPORTING", password: process.env.LAPORAN_PASSWORD || "laporan123" },
  ];
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(pw, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const key = await scrypt(pw, salt, 64);
  const a = Buffer.from(hex, "hex");
  return a.length === key.length && timingSafeEqual(a, key);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = { id: string; name: string; username: string; passwordHash: string; role: string; active: boolean; permissions: string[]; lastLogin: Date | null; createdAt: Date };
function toUser(r: Row): AuthUser {
  return {
    id: r.id, name: r.name, username: r.username,
    role: isAppRole(r.role) ? r.role : "STAFF_LELE",
    active: r.active, permissions: r.permissions ?? [],
    lastLogin: r.lastLogin ? r.lastLogin.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}

// Seed akun bawaan HANYA jika tabel benar-benar kosong (idempoten, non-destruktif).
export async function ensureSeeded(): Promise<void> {
  if (!prisma) return;
  const count = await (prisma as any).appUser.count();
  if (count > 0) return;
  for (const b of builtins()) {
    await (prisma as any).appUser.create({
      data: { name: b.name, username: b.username, role: b.role, active: true, permissions: [], passwordHash: await hashPassword(b.password) },
    });
  }
}

// Autentikasi: utamakan DB; bila DB tak ada/gagal, pakai akun bawaan darurat.
export async function authenticate(username: string, password: string): Promise<{ ok: boolean; user?: AuthUser; message?: string }> {
  const uname = username.trim().toLowerCase();
  if (prisma) {
    try {
      await ensureSeeded();
      const row = (await (prisma as any).appUser.findUnique({ where: { username: uname } })) as Row | null;
      if (!row) return { ok: false, message: "Username atau password salah." };
      if (!row.active) return { ok: false, message: "Akun dinonaktifkan. Hubungi admin." };
      if (!(await verifyPassword(password, row.passwordHash))) return { ok: false, message: "Username atau password salah." };
      await (prisma as any).appUser.update({ where: { id: row.id }, data: { lastLogin: new Date() } });
      return { ok: true, user: toUser({ ...row, lastLogin: new Date() }) };
    } catch (e) {
      console.error("DB auth failed, fallback to builtin", e);
      // jatuh ke bawaan di bawah
    }
  }
  const b = builtins().find((x) => x.username === uname);
  if (!b || b.password !== password) return { ok: false, message: "Username atau password salah." };
  return { ok: true, user: { id: `builtin:${b.username}`, name: b.name, username: b.username, role: b.role, active: true, permissions: [], lastLogin: new Date().toISOString(), createdAt: new Date().toISOString() } };
}

export async function listUsers(): Promise<{ ok: boolean; users: AuthUser[]; db: boolean }> {
  if (!prisma) return { ok: true, db: false, users: builtins().map((b) => ({ id: `builtin:${b.username}`, name: b.name, username: b.username, role: b.role, active: true, permissions: [], lastLogin: null, createdAt: new Date().toISOString() })) };
  try {
    await ensureSeeded();
    const rows = (await (prisma as any).appUser.findMany({ orderBy: { createdAt: "asc" } })) as Row[];
    return { ok: true, db: true, users: rows.map(toUser) };
  } catch (e) {
    console.error("listUsers failed", e);
    return { ok: false, db: false, users: [] };
  }
}

export async function createUser(data: { name: string; username: string; password: string; role: AppRole; active?: boolean }): Promise<{ ok: boolean; message?: string; user?: AuthUser }> {
  if (!prisma) return { ok: false, message: "Database belum aktif. Manajemen akun butuh Postgres (Render)." };
  const uname = data.username.trim().toLowerCase();
  if (!data.name.trim() || !uname || !data.password) return { ok: false, message: "Nama, username, dan password wajib diisi." };
  if (!isAppRole(data.role)) return { ok: false, message: "Peran tidak valid." };
  try {
    const exists = await (prisma as any).appUser.findUnique({ where: { username: uname } });
    if (exists) return { ok: false, message: "Username sudah dipakai." };
    const row = (await (prisma as any).appUser.create({ data: { name: data.name.trim(), username: uname, role: data.role, active: data.active ?? true, permissions: [], passwordHash: await hashPassword(data.password) } })) as Row;
    return { ok: true, user: toUser(row) };
  } catch (e) {
    console.error("createUser failed", e);
    return { ok: false, message: "Gagal membuat akun." };
  }
}

export async function updateUser(id: string, patch: { name?: string; role?: AppRole; active?: boolean; password?: string }): Promise<{ ok: boolean; message?: string; user?: AuthUser }> {
  if (!prisma) return { ok: false, message: "Database belum aktif." };
  if (id.startsWith("builtin:")) return { ok: false, message: "Akun bawaan tidak bisa diubah." };
  try {
    const data: Record<string, unknown> = {};
    if (patch.name != null) data.name = patch.name.trim();
    if (patch.role != null && isAppRole(patch.role)) data.role = patch.role;
    if (patch.active != null) data.active = patch.active;
    if (patch.password) data.passwordHash = await hashPassword(patch.password);
    const row = (await (prisma as any).appUser.update({ where: { id }, data })) as Row;
    return { ok: true, user: toUser(row) };
  } catch (e) {
    console.error("updateUser failed", e);
    return { ok: false, message: "Gagal memperbarui akun." };
  }
}

export async function changePassword(id: string, oldPw: string, newPw: string): Promise<{ ok: boolean; message?: string }> {
  if (!newPw || newPw.length < 6) return { ok: false, message: "Password baru minimal 6 karakter." };
  if (!prisma || id.startsWith("builtin:")) return { ok: false, message: "Ganti password butuh akun database (Render)." };
  try {
    const row = (await (prisma as any).appUser.findUnique({ where: { id } })) as Row | null;
    if (!row) return { ok: false, message: "Akun tidak ditemukan." };
    if (!(await verifyPassword(oldPw, row.passwordHash))) return { ok: false, message: "Password lama salah." };
    await (prisma as any).appUser.update({ where: { id }, data: { passwordHash: await hashPassword(newPw) } });
    return { ok: true };
  } catch (e) {
    console.error("changePassword failed", e);
    return { ok: false, message: "Gagal mengganti password." };
  }
}

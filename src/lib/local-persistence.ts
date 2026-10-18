"use client";
import { create } from "zustand";
import { parseWorkspace, canonicalJson } from "./workspace-data";

export const useStorageHealth = create<{ error?: string }>(() => ({}));
let readBlocked = false;
export const safeStorage = {
  getItem(name: string) {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(name);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || !parsed.state || typeof parsed.state !== "object") throw new Error("invalid_state");
        parseWorkspace(parsed.state);
      }
      return raw;
    } catch {
      readBlocked = true;
      useStorageHealth.setState({ error: "Penyimpanan lokal tidak dapat dibaca. Data lama dilindungi dari penimpaan; ekspor cadangan sebelum melanjutkan." });
      throw new Error("local_storage_read_failed");
    }
  },
  setItem(name: string, value: string) {
    if (typeof window === "undefined" || readBlocked) return;
    try {
      localStorage.setItem(name, value);
      useStorageHealth.setState({ error: undefined });
    } catch {
      useStorageHealth.setState({ error: "Gagal menyimpan di perangkat (penyimpanan penuh/tidak tersedia). Jangan tutup halaman sebelum penyimpanan server berhasil atau cadangan diunduh." });
    }
  },
  removeItem(name: string) {
    try { localStorage.removeItem(name); } catch {
      useStorageHealth.setState({ error: "Gagal menghapus penyimpanan lokal." });
    }
  },
};

const BACKUP_KEY = "arfarmjaya-local-backup";
/** A destructive replacement is allowed only after its previous state is durable. */
export function preserveLocalSnapshot(data: Record<string, unknown>): boolean {
  try {
    const existing = localStorage.getItem(BACKUP_KEY);
    if (existing) {
      const old = JSON.parse(existing);
      if (canonicalJson(old.data) === canonicalJson(data)) return true;
      // Preserve earlier recovery data too; never silently replace an unresolved backup.
      localStorage.setItem(`${BACKUP_KEY}:${crypto.randomUUID()}`, existing);
    }
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ at: new Date().toISOString(), data }));
    return true;
  } catch {
    return false;
  }
}

export function readLocalBackup(): { at: string; data: Record<string, unknown> } | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.data ? parsed : null;
  } catch { return null; }
}

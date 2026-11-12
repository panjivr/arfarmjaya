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

function rotatedBackupKeys(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${BACKUP_KEY}:`)) keys.push(key);
    }
  } catch { /* enumeration unavailable */ }
  return keys;
}

let rotationCounter = 0;
/** Sortable rotation suffix: ISO time first, then a per-session counter. */
function rotatedBackupKey(): string {
  return `${BACKUP_KEY}:${new Date().toISOString()}:${(rotationCounter++).toString(36)}`;
}

/**
 * Rotated recovery copies are full-size snapshots of the whole workspace.
 * Keeping every generation exhausts the browser storage quota, after which
 * even the newest backup — and the app's own persisted state — can no longer
 * be written. Keep only the newest rotated copy (keys sort newest last).
 */
function pruneRotatedBackups(keep = 1) {
  const keys = rotatedBackupKeys().sort();
  for (const key of keys.slice(0, Math.max(0, keys.length - keep))) {
    try { localStorage.removeItem(key); } catch { /* best effort */ }
  }
}

function trySetItem(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

/** A destructive replacement is allowed only after its previous state is durable. */
export function preserveLocalSnapshot(data: Record<string, unknown>): boolean {
  try {
    const existing = localStorage.getItem(BACKUP_KEY);
    if (existing) {
      const old = JSON.parse(existing);
      if (canonicalJson(old.data) === canonicalJson(data)) { pruneRotatedBackups(); return true; }
      // Preserve the previous recovery point too, but never let that older
      // copy block the new backup when storage is nearly full.
      pruneRotatedBackups();
      trySetItem(rotatedBackupKey(), existing);
    }
    const payload = JSON.stringify({ at: new Date().toISOString(), data });
    if (trySetItem(BACKUP_KEY, payload)) { pruneRotatedBackups(); return true; }
    // Still no room: sacrifice the rotated copies and retry once. The newest
    // snapshot matters most; without it the replacement stays blocked.
    for (const key of rotatedBackupKeys()) {
      try { localStorage.removeItem(key); } catch { /* best effort */ }
    }
    return trySetItem(BACKUP_KEY, payload);
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

import { assertValidPersisted, useStorageHealth } from "./local-persistence";
import { indexedDbBackend, type KvBackend } from "./idb-storage";

/**
 * Storage untuk persist Zustand di atas IndexedDB (menggantikan
 * localStorage yang kuotanya tidak lagi cukup untuk dataset aplikasi).
 *
 * Semantik perlindungan sama seperti safeStorage sebelumnya:
 * - payload yang terbaca selalu divalidasi; payload rusak TIDAK ditimpa —
 *   penulisan diblokir sesi ini dan kesalahan ditampilkan ke pengguna;
 * - kegagalan tulis terlihat pada indikator simpan, tidak diam-diam.
 *
 * Migrasi satu kali: nilai lama di localStorage (kunci yang sama) divalidasi,
 * disalin ke IndexedDB, lalu dihapus dari localStorage. Nilai lama yang
 * rusak tidak disalin dan tidak dihapus.
 */
type LegacyStorage = {
  getItem(name: string): string | null;
  removeItem(name: string): void;
};

let mirror: string | null = null;
/** Salinan string persist terakhir yang terbaca/tertulis sesi ini. */
export function readPersistedMirror(): string | null {
  return mirror;
}

export function createPersistStorage(backend: KvBackend, legacy: LegacyStorage | null) {
  let readBlocked = false;
  return {
    async getItem(name: string): Promise<string | null> {
      try {
        let raw = await backend.get(name);
        if (raw === null && legacy) {
          const old = legacy.getItem(name);
          if (old !== null) {
            assertValidPersisted(old);
            await backend.set(name, old);
            try { legacy.removeItem(name); } catch { /* salinan IDB sudah aman */ }
            raw = old;
          }
        }
        if (raw !== null) assertValidPersisted(raw);
        mirror = raw;
        return raw;
      } catch {
        readBlocked = true;
        useStorageHealth.setState({ error: "Penyimpanan lokal tidak dapat dibaca. Data lama dilindungi dari penimpaan; ekspor cadangan sebelum melanjutkan." });
        throw new Error("local_storage_read_failed");
      }
    },
    async setItem(name: string, value: string): Promise<void> {
      if (readBlocked) return;
      mirror = value;
      try {
        await backend.set(name, value);
        useStorageHealth.setState({ error: undefined });
      } catch {
        useStorageHealth.setState({ error: "Gagal menyimpan di perangkat (penyimpanan penuh/tidak tersedia). Jangan tutup halaman sebelum penyimpanan server berhasil atau cadangan diunduh." });
      }
    },
    async removeItem(name: string): Promise<void> {
      mirror = null;
      try {
        await backend.remove(name);
      } catch {
        useStorageHealth.setState({ error: "Gagal menghapus penyimpanan lokal." });
      }
    },
  };
}

const browserLegacy: LegacyStorage | null =
  typeof window !== "undefined"
    ? {
        getItem: (name) => { try { return localStorage.getItem(name); } catch { return null; } },
        removeItem: (name) => { try { localStorage.removeItem(name); } catch { /* abaikan */ } },
      }
    : null;

/** Instance default untuk persist store (IndexedDB + migrasi localStorage). */
export const persistStorage = createPersistStorage(indexedDbBackend, browserLegacy);

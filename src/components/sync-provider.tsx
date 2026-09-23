"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useUiStore } from "@/lib/store";
import { decideSync } from "@/lib/sync-decide";

// Keys that represent shared business data (synced to the server).
// Per-device/session state (theme, user, sidebar, etc.) is intentionally excluded.
const SYNC_KEYS = [
  "products",
  "movements",
  "categories",
  "suppliers",
  "warehouses",
  "racks",
  "users",
  "purchaseOrders",
  "receipts",
  "distributions",
  "requests",
  "opnameSessions",
  "posSales",
  "stores",
  "invoices",
  "reportProfiles",
  "weeklyReports",
  "ponds",
  "fishCycles",
  "pondLogs",
  "pondHarvests",
  "pondJournals",
  "leleSales",
  "receivables",
  "payables",
  "financeTx",
  "financeCategories",
  "leleMovements",
  "auditLog",
  "readNotifications",
  "settings",
] as const;

type Snapshot = Record<string, unknown>;

function snapshot(state: Record<string, unknown>): Snapshot {
  const out: Snapshot = {};
  for (const key of SYNC_KEYS) out[key] = state[key];
  return out;
}

// Rough "how much real activity" score, used only during first migration so a
// data-rich browser is never overwritten by an empty/seed one.
function weight(data: Snapshot | null): number {
  if (!data) return -1;
  const arrays = [
    "movements", "invoices", "posSales", "purchaseOrders", "distributions",
    "requests", "opnameSessions", "receipts", "auditLog", "stores", "weeklyReports",
    "ponds", "fishCycles", "pondLogs", "pondHarvests", "pondJournals",
    "leleSales", "receivables", "payables", "financeTx", "leleMovements",
  ];
  return arrays.reduce((sum, k) => sum + (Array.isArray(data[k]) ? (data[k] as unknown[]).length : 0), 0);
}

// Hash cepat (cyrb53) untuk menandai isi snapshot terakhir yang sudah sinkron.
function sig(str: string): string {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

const META_KEY = "arfarmjaya-sync-meta";
type Meta = { syncedAt?: string; sig?: string };
function readMeta(): Meta {
  try { return JSON.parse(localStorage.getItem(META_KEY) || "{}") as Meta; } catch { return {}; }
}
function writeMeta(meta: Meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* ignore */ }
}

// Cadangan data lokal sebelum ditimpa data server — jaring pengaman agar tidak
// ada perubahan yang hilang diam-diam. Bisa dipulihkan dari Pengaturan.
const LOCAL_BACKUP_KEY = "arfarmjaya-local-backup";
function stashLocalBackup(serialized: string) {
  try {
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify({ at: new Date().toISOString(), data: JSON.parse(serialized) }));
  } catch { /* kuota penuh — abaikan */ }
}
export function readLocalBackup(): { at: string; data: Record<string, unknown> } | null {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.data ? parsed : null;
  } catch {
    return null;
  }
}

// Status sinkronisasi yang bisa ditampilkan di UI, supaya kegagalan menyimpan
// ke server terlihat jelas (bukan gagal diam-diam).
export type SyncStatusValue = "idle" | "saving" | "saved" | "error";
type SyncStatusState = {
  status: SyncStatusValue;
  at?: string;
  message?: string;
  serverUpdatedAt?: string;
  setStatus: (patch: Partial<Omit<SyncStatusState, "setStatus">>) => void;
};
export const useSyncStatus = create<SyncStatusState>((set) => ({
  status: "idle",
  setStatus: (patch) => set(patch),
}));

/**
 * Dorong seluruh data ke server SEKARANG dan laporkan hasilnya. Dipakai setelah
 * memulihkan cadangan agar data langsung tersimpan di server — bukan menunggu
 * sinkron otomatis — dan pengguna tahu pasti berhasil atau tidak.
 */
export async function syncNow(): Promise<{ ok: boolean; message?: string }> {
  const data = snapshot(useUiStore.getState() as unknown as Record<string, unknown>);
  const serialized = JSON.stringify(data);
  const sizeMb = (serialized.length / 1_048_576).toFixed(1);
  const setStatus = useSyncStatus.getState().setStatus;
  setStatus({ status: "saving", message: undefined });
  try {
    const res = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: serialized,
    });
    const json = await res.json().catch(() => ({}));
    if (json?.ok) {
      writeMeta({ syncedAt: json?.updatedAt ?? undefined, sig: sig(serialized) });
      setStatus({ status: "saved", at: new Date().toISOString(), serverUpdatedAt: json?.updatedAt ?? undefined, message: undefined });
      return { ok: true };
    }
    const message = res.status === 401
      ? "Sesi login berakhir — masuk ulang lalu ulangi."
      : json?.db === false
        ? "Database server tidak aktif."
        : `Server menolak simpan (HTTP ${res.status}, ukuran ${sizeMb} MB).`;
    setStatus({ status: "error", at: new Date().toISOString(), message });
    return { ok: false, message };
  } catch {
    const message = `Tidak terhubung ke server (ukuran data ${sizeMb} MB).`;
    setStatus({ status: "error", at: new Date().toISOString(), message });
    return { ok: false, message };
  }
}

export function SyncProvider() {
  const hasHydrated = useUiStore((s) => s.hasHydrated);
  // Sinkronisasi hanya berjalan untuk pengguna yang sudah login — /api/state
  // butuh sesi, jadi tanpa user kita tidak menyentuh server sama sekali.
  const userId = useUiStore((s) => s.user?.id ?? null);

  useEffect(() => {
    if (!hasHydrated || !userId) return;
    let cancelled = false;
    let lastSent = "";
    let timer: ReturnType<typeof setTimeout> | null = null;

    const snap = () => snapshot(useUiStore.getState() as unknown as Record<string, unknown>);
    const baseline = JSON.stringify(snap());

    const setStatus = useSyncStatus.getState().setStatus;

    async function push(data: Snapshot) {
      const serialized = JSON.stringify(data);
      const sizeMb = (serialized.length / 1_048_576).toFixed(1);
      setStatus({ status: "saving", message: undefined });
      try {
        const res = await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: serialized,
        });
        const json = await res.json().catch(() => ({}));
        if (json?.ok) {
          lastSent = serialized;
          writeMeta({ syncedAt: json?.updatedAt ?? undefined, sig: sig(serialized) });
          setStatus({ status: "saved", at: new Date().toISOString(), serverUpdatedAt: json?.updatedAt ?? undefined, message: undefined });
          return;
        }
        // Server menolak/gagal menulis — beri tahu, jangan gagal diam-diam.
        const reason = res.status === 401
          ? "Sesi login berakhir — masuk ulang agar data tersimpan."
          : json?.db === false
            ? "Database server tidak aktif."
            : `Server menolak simpan (HTTP ${res.status}, ukuran ${sizeMb} MB).`;
        setStatus({ status: "error", at: new Date().toISOString(), message: reason });
      } catch {
        setStatus({ status: "error", at: new Date().toISOString(), message: `Tidak terhubung ke server (ukuran data ${sizeMb} MB).` });
      }
    }

    // Start watching immediately so no local change made during the initial
    // load can be lost.
    const unsubscribe = useUiStore.subscribe((state) => {
      const data = snapshot(state as unknown as Record<string, unknown>);
      const serialized = JSON.stringify(data);
      if (serialized === lastSent) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => push(data), 700);
    });

    // Saat halaman disembunyikan/ditutup, kirim perubahan yang belum sempat
    // tersinkron (best-effort) supaya tidak hilang saat refresh cepat.
    const flush = () => {
      const serialized = JSON.stringify(snap());
      if (serialized === lastSent) return;
      if (timer) { clearTimeout(timer); timer = null; }
      push(snap());
    };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);

    (async () => {
      let serverData: Snapshot | null = null;
      let serverUpdatedAt: string | null = null;
      try {
        const json = await (await fetch("/api/state", { cache: "no-store" })).json();
        serverData = (json?.data as Snapshot | null) ?? null;
        serverUpdatedAt = json?.updatedAt ?? null;
      } catch {
        serverData = null;
      }
      if (cancelled) return;

      const localStr = JSON.stringify(snap());
      const meta = readMeta();

      const decision = decideSync({
        localStr,
        baseline,
        hasServerData: Boolean(serverData),
        serverUpdatedAt,
        metaSyncedAt: meta.syncedAt,
        metaSig: meta.sig,
        localSig: sig(localStr),
        localWeight: weight(snap()),
        serverWeight: weight(serverData),
      });

      if (decision === "push-local") {
        await push(snap());
        return;
      }

      // Server menang (sumber kebenaran bersama). Sebelum menimpa, simpan
      // cadangan data lokal supaya tidak ada yang hilang diam-diam — bisa
      // dipulihkan lewat Pengaturan → Pulihkan Data Lokal.
      if (serverData && localStr !== JSON.stringify(serverData)) {
        stashLocalBackup(localStr);
      }
      useUiStore.setState(serverData as never);
      lastSent = JSON.stringify(snap());
      writeMeta({ syncedAt: serverUpdatedAt ?? undefined, sig: sig(lastSent) });
      setStatus({ status: "saved", at: new Date().toISOString(), serverUpdatedAt: serverUpdatedAt ?? undefined });
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, [hasHydrated, userId]);

  return null;
}

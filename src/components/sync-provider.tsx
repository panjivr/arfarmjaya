"use client";

import { useEffect } from "react";
import { useUiStore } from "@/lib/store";

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

    async function push(data: Snapshot) {
      const serialized = JSON.stringify(data);
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
        }
      } catch {
        /* offline — browser cache keeps the data; retried on next change */
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

      // Perubahan lokal yang dibuat saat memuat → menang.
      if (localStr !== baseline) {
        await push(snap());
        return;
      }

      // Belum ada data server → jadikan perangkat ini sumber awal.
      if (!serverData) {
        await push(snap());
        return;
      }

      const meta = readMeta();
      const neverSynced = !meta.syncedAt;
      if (neverSynced) {
        // Sinkron pertama: perangkat dengan data lebih banyak yang menang.
        if (weight(snap()) > weight(serverData)) { await push(snap()); return; }
        useUiStore.setState(serverData as never);
        lastSent = JSON.stringify(snap());
        writeMeta({ syncedAt: serverUpdatedAt ?? undefined, sig: sig(lastSent) });
        return;
      }

      // Sudah pernah sinkron. Bila isi lokal BERUBAH sejak sinkron terakhir
      // (mis. baru simpan laporan/foto tapi belum sempat terkirim) → dorong
      // lokal, JANGAN timpa dengan data server yang lebih lama. Inilah yang
      // dulu membuat hasil edit "hilang" saat refresh.
      if (meta.sig && sig(localStr) !== meta.sig) {
        await push(snap());
        return;
      }

      // Lokal sama dengan yang terakhir tersinkron → adopsi server (mungkin ada
      // perubahan dari perangkat lain).
      useUiStore.setState(serverData as never);
      lastSent = JSON.stringify(snap());
      writeMeta({ syncedAt: serverUpdatedAt ?? undefined, sig: sig(lastSent) });
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

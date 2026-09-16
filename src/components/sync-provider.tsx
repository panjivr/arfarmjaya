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
  ];
  return arrays.reduce((sum, k) => sum + (Array.isArray(data[k]) ? (data[k] as unknown[]).length : 0), 0);
}

export function SyncProvider() {
  const hasHydrated = useUiStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
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
        if (json?.ok) lastSent = serialized;
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
      timer = setTimeout(() => push(data), 800);
    });

    (async () => {
      let serverData: Snapshot | null = null;
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        serverData = ((await res.json())?.data as Snapshot | null) ?? null;
      } catch {
        serverData = null;
      }
      if (cancelled) return;

      // If the user already changed something while we were loading, their
      // change wins — never overwrite it with server/seed data.
      if (JSON.stringify(snap()) !== baseline) {
        await push(snap());
        return;
      }

      if (serverData && weight(serverData) >= weight(JSON.parse(baseline))) {
        useUiStore.setState(serverData as never);
        lastSent = JSON.stringify(snap());
      } else {
        await push(snap());
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [hasHydrated]);

  return null;
}

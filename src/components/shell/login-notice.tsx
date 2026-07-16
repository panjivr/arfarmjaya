"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bell, CheckCircle2, ShieldAlert, X } from "lucide-react";
import { useUiStore } from "@/lib/store";
import { buildNotifications } from "@/lib/selectors";
import { Button } from "@/components/ui/button";

export function LoginNotice() {
  const user = useUiStore((s) => s.user);
  const products = useUiStore((s) => s.products);
  const settings = useUiStore((s) => s.settings);
  const hasHydrated = useUiStore((s) => s.hasHydrated);
  const seen = useUiStore((s) => s.loginNoticeSeen);
  const setSeen = useUiStore((s) => s.setLoginNoticeSeen);

  const items = useMemo(() => {
    const all = buildNotifications(products, settings);
    const rank = { danger: 0, warning: 1, info: 2 } as const;
    return all.sort((a, b) => rank[a.kind] - rank[b.kind]);
  }, [products, settings]);

  const critical = items.filter((i) => i.kind === "danger").length;
  const warnings = items.filter((i) => i.kind === "warning").length;
  const open = Boolean(user) && hasHydrated && !seen;
  const isAdmin = user?.role === "admin";

  function close() {
    setSeen(true);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[55] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="w-full max-w-md rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted">Selamat datang,</p>
                  <p className="font-bold leading-tight">{user?.name}</p>
                </div>
              </div>
              <button onClick={close} className="rounded-lg p-1 text-muted hover:bg-slate-100 dark:hover:bg-slate-900" aria-label="Tutup"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 px-5">
              <div className="rounded-lg border border-border bg-red-50 p-3 text-center dark:bg-red-950/30">
                <p className="text-2xl font-bold text-danger">{critical}</p>
                <p className="text-xs font-medium text-danger">Kritis</p>
              </div>
              <div className="rounded-lg border border-border bg-amber-50 p-3 text-center dark:bg-amber-950/30">
                <p className="text-2xl font-bold text-amber-700">{warnings}</p>
                <p className="text-xs font-medium text-amber-700">Peringatan</p>
              </div>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto p-5 pt-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <CheckCircle2 className="h-9 w-9 text-primary" />
                  <p className="mt-2 font-semibold">Semua stok aman</p>
                  <p className="text-sm text-muted">Tidak ada peringatan penting hari ini.</p>
                </div>
              ) : (
                items.slice(0, 6).map((n) => {
                  const Icon = n.kind === "danger" ? ShieldAlert : AlertTriangle;
                  const color = n.kind === "danger" ? "text-danger" : n.kind === "warning" ? "text-amber-700" : "text-slate-600";
                  return (
                    <div key={n.id} className="flex gap-3 rounded-lg border border-border p-3">
                      <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{n.title}</p>
                        <p className="truncate text-xs text-muted">{n.detail}</p>
                      </div>
                    </div>
                  );
                })
              )}
              {items.length > 6 && <p className="text-center text-xs text-muted">+{items.length - 6} peringatan lainnya</p>}
            </div>

            <div className="flex gap-2 border-t border-border p-4">
              {isAdmin && (
                <Link href="/notifications" onClick={close} className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900">
                  Lihat semua
                </Link>
              )}
              <Button className="flex-1" onClick={close}>Mengerti</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

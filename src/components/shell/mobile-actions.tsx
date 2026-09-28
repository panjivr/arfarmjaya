"use client";

import { createContext, useContext, useEffect, useRef, useState, type MutableRefObject } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileAction = {
  key: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
};

type Ctx = {
  ref: MutableRefObject<MobileAction[]>;
  signature: string;
  setSignature: (value: string) => void;
};

const MobileActionsContext = createContext<Ctx | null>(null);

export function MobileActionsProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<MobileAction[]>([]);
  const [signature, setSignature] = useState("");
  return <MobileActionsContext.Provider value={{ ref, signature, setSignature }}>{children}</MobileActionsContext.Provider>;
}

/**
 * Daftarkan tombol aksi khusus halaman untuk muncul di bilah bawah pada layar HP
 * (seperti tombol aksi di aplikasi Gojek/Shopee). onClick selalu memakai versi
 * terbaru (disimpan di ref), sedangkan tampilan diperbarui saat "signature"
 * (label/disabled/varian) berubah — mencegah render berulang tak berujung.
 */
export function useMobileActions(actions: MobileAction[]) {
  const ctx = useContext(MobileActionsContext);
  const signature = actions.map((a) => `${a.key}:${a.label}:${a.disabled ? 1 : 0}:${a.variant ?? ""}`).join("|");
  if (ctx) ctx.ref.current = actions; // simpan versi terbaru tiap render (aman untuk ref)
  useEffect(() => {
    if (!ctx) return;
    ctx.setSignature(signature);
    return () => ctx.setSignature("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
}

export function MobileActionBar() {
  const ctx = useContext(MobileActionsContext);
  const actions = ctx?.ref.current ?? [];
  const active = Boolean(ctx?.signature) && actions.length > 0;

  // Beri ruang ekstra di bawah konten saat bilah aksi tampil (lihat globals.css).
  useEffect(() => {
    document.body.classList.toggle("has-mobile-actions", active);
    return () => document.body.classList.remove("has-mobile-actions");
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="no-print fixed inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
      style={{ bottom: "calc(3.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const primary = action.variant === "primary" || (!action.variant && index === actions.length - 1);
          const danger = action.variant === "danger";
          return (
            <button
              key={action.key}
              disabled={action.disabled}
              onClick={() => ctx?.ref.current[index]?.onClick()}
              className={cn(
                "inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
                primary && "bg-primary text-white shadow-sm active:scale-[0.98]",
                danger && "bg-red-50 text-danger dark:bg-red-950/30",
                !primary && !danger && "border border-border bg-card text-foreground active:scale-[0.98]",
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="truncate">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

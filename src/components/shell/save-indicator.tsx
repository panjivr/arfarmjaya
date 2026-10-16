"use client";

import { Check, Cloud, CloudOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSyncStatus, retryWorkspace, downloadWorkspaceDraft, discardWorkspaceDraft } from "@/components/sync-provider";

/**
 * Indikator simpan-otomatis yang selalu terlihat di header. Semua perubahan
 * data tersimpan sendiri ke server (lihat SyncProvider) — komponen ini hanya
 * menegaskan statusnya supaya pengguna tak pernah ragu harus menekan "simpan".
 *
 * - saving  → "Menyimpan…" (spinner)
 * - saved   → "Tersimpan" (centang hijau)
 * - error   → "Gagal simpan" (merah) — perlu perhatian
 * - idle    → "Tersimpan otomatis" (netral, belum ada perubahan)
 */
export function SaveIndicator() {
  const status = useSyncStatus((s) => s.status);
  const message = useSyncStatus((s) => s.message);

  const view = {
    saving: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      label: "Menyimpan…",
      short: "Menyimpan…",
      cls: "border-border bg-card text-muted",
    },
    saved: {
      icon: <Check className="h-4 w-4" />,
      label: "Tersimpan",
      short: "Tersimpan",
      cls: "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    },
    error: {
      icon: <CloudOff className="h-4 w-4" />,
      label: "Gagal simpan",
      short: "Gagal",
      cls: "border-danger/40 bg-red-50 text-danger dark:bg-red-950/30",
    },
    idle: {
      icon: <Cloud className="h-4 w-4" />,
      label: "Menunggu server",
      short: "Menunggu",
      cls: "border-border bg-card text-muted",
    },
  }[status];

  return (
    <span className="flex flex-wrap items-center gap-2">
    <span
      title={message ?? "Status penyimpanan berdasarkan konfirmasi server."}
      aria-live="polite"
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold",
        view.cls,
      )}
    >
      {view.icon}
      <span className="hidden sm:inline">{view.label}</span>
      <span className="sr-only sm:hidden">{view.short}</span>
    </span>
    {status === "error" && <details className="relative text-xs"><summary className="cursor-pointer text-red-700">Belum tersimpan</summary><div className="absolute right-0 z-50 w-72 rounded-lg border bg-white p-3 text-slate-900 shadow-xl"><p>{message}</p><button className="mt-2 block underline" onClick={() => void retryWorkspace()}>Coba simpan lagi</button><button className="mt-2 block underline" onClick={() => void downloadWorkspaceDraft()}>Unduh draf</button><button className="mt-2 block underline" onClick={() => { if (window.confirm("Unduh draf lalu ganti tampilan dengan data terbaru dari server? Perubahan lokal tidak akan dikirim.")) void discardWorkspaceDraft(); }}>Gunakan data server</button></div></details>}
    </span>
  );
}

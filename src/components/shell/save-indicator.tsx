"use client";

import { useState } from "react";
import { Check, Cloud, CloudOff, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSyncStatus, syncNow, reloadFromServer } from "@/components/sync-provider";
import { useStorageHealth } from "@/lib/local-persistence";
import { useUiStore } from "@/lib/store";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

// Server acknowledgements and local-storage failures remain independently visible.
export function SaveIndicator() {
  const status = useSyncStatus((s) => s.status);
  const message = useSyncStatus((s) => s.message);
  const localError = useStorageHealth((s) => s.error);
  const [open, setOpen] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string>();
  const error = localError || message;
  function download() {
    try {
      const hydrated = useUiStore.getState().hasHydrated;
      const contents = hydrated ? useUiStore.getState().exportBackup() : localStorage.getItem("arfarmjaya-wms");
      if (!contents) return;
      const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `arfarmjaya-local-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setRecoveryError("Cadangan tidak dapat diunduh. Periksa izin penyimpanan browser dan jangan hapus data situs.");
    }
  }

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
      label: "Memeriksa simpan",
      short: "Memeriksa",
      cls: "border-border bg-card text-muted",
    },
  }[localError ? "error" : status];

  return (
    <>
    <button
      type="button"
      onClick={() => setOpen(true)}
      title={localError || message || (status === "saved" ? "Data dikonfirmasi tersimpan di server." : "Perubahan belum dikonfirmasi tersimpan di server.")}
      aria-live="polite"
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold",
        view.cls,
      )}
    >
      {view.icon}
      <span className="hidden sm:inline">{localError ? "Gagal simpan lokal" : view.label}</span>
      <span className="sr-only sm:hidden">{view.short}</span>
    </button>
    <Modal open={open} onClose={() => setOpen(false)} title="Status penyimpanan">
      <div className="space-y-4 text-sm">
        <p role="status">{error || (status === "saved" ? "Data sudah dikonfirmasi tersimpan di server." : "Penyimpanan ke server belum dikonfirmasi.")}</p>
        {recoveryError && <p role="alert" className="text-danger">{recoveryError}</p>}
        <p>Jika terjadi konflik, unduh cadangan perangkat ini terlebih dahulu. Muat data server, lalu rekonsiliasi perubahan lokal bersama admin sebelum melanjutkan transaksi.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={download}><Download className="h-4 w-4" /> Unduh cadangan lokal</Button>
          <Button variant="secondary" onClick={async () => { const result = await syncNow(); setRecoveryError(result.message); }}>Coba simpan lagi</Button>
          <Button variant="secondary" onClick={() => {
            if (!confirm("Data perangkat akan dicadangkan, lalu diganti dengan data server. Pastikan cadangan unduhan Anda sudah disimpan. Lanjutkan?")) return;
            const result = reloadFromServer();
            setRecoveryError(result.message);
          }}>Cadangkan & muat data server</Button>
        </div>
      </div>
    </Modal>
    </>
  );
}

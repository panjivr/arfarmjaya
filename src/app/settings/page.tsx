"use client";

import { useRef, useState } from "react";
import { Save, RotateCcw, Palette, Info, Download, Upload, Images } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { useSyncStatus, readLocalBackup, syncNow } from "@/components/sync-provider";
import { formatDateTime, compressDataUrl } from "@/lib/utils";
import { APP_BUILD } from "@/lib/build-info";
import type { AppSettings } from "@/lib/types";

export default function SettingsPage() {
  const settings = useUiStore((s) => s.settings);
  const theme = useUiStore((s) => s.theme);
  const updateSettings = useUiStore((s) => s.updateSettings);
  const resetData = useUiStore((s) => s.resetData);
  const exportBackup = useUiStore((s) => s.exportBackup);
  const importBackup = useUiStore((s) => s.importBackup);
  const fileRef = useRef<HTMLInputElement>(null);
  const sync = useSyncStatus();

  async function restoreLocalBackup() {
    const backup = readLocalBackup();
    if (!backup) return toast.error("Tidak ada cadangan lokal di perangkat ini.");
    if (!confirm(`Pulihkan data lokal dari ${formatDateTime(backup.at)}? Data saat ini akan diganti.`)) return;
    const res = importBackup(JSON.stringify(backup.data));
    if (!res.ok) return toast.error(res.message ?? "Gagal memulihkan.");
    setForm(useUiStore.getState().settings);
    toast.success("Data lokal dipulihkan.");
    const sent = await syncNow();
    if (sent.ok) toast.success("Data tersimpan ke server.");
    else toast.error(`Dipulihkan di perangkat ini, TAPI gagal simpan ke server: ${sent.message}`);
  }

  const [form, setForm] = useState<AppSettings>(settings);
  const [optimizing, setOptimizing] = useState(false);

  // Perkecil ulang semua foto tersimpan (kegiatan, bukti, logo, tanda tangan,
  // jurnal) agar total data turun di bawah batas kiriman server (penyebab
  // "Gagal menyimpan / HTTP 413"). Lalu langsung sinkron ke server.
  async function optimizeImages() {
    if (optimizing) return;
    if (!confirm("Optimalkan (perkecil) semua foto tersimpan agar bisa disimpan ke server? Kualitas foto sedikit menurun, tapi data jadi jauh lebih ringan.")) return;
    setOptimizing(true);
    try {
      const s = useUiStore.getState();
      const sizeOf = (st: ReturnType<typeof useUiStore.getState>) =>
        (JSON.stringify(st.weeklyReports).length + JSON.stringify(st.reportProfiles).length + JSON.stringify(st.stores).length + JSON.stringify(st.pondJournals).length) / 1_048_576;
      const before = sizeOf(s);

      const weeklyReports = await Promise.all(
        s.weeklyReports.map(async (r) => ({
          ...r,
          activities: await Promise.all(
            r.activities.map(async (a) => ({
              ...a,
              photo: a.photo ? await compressDataUrl(a.photo) : a.photo,
              photos: Array.isArray(a.photos) ? await Promise.all(a.photos.map((p) => compressDataUrl(p))) : a.photos,
              paymentProof: a.paymentProof ? await compressDataUrl(a.paymentProof) : a.paymentProof,
            })),
          ),
        })),
      );
      const reportProfiles = await Promise.all(
        s.reportProfiles.map(async (p) => ({
          ...p,
          logo: p.logo ? await compressDataUrl(p.logo) : p.logo,
          signatureImage: p.signatureImage ? await compressDataUrl(p.signatureImage) : p.signatureImage,
        })),
      );
      const stores = await Promise.all(
        s.stores.map(async (st) => ({ ...st, logo: st.logo ? await compressDataUrl(st.logo) : st.logo })),
      );
      const pondJournals = await Promise.all(
        s.pondJournals.map(async (j) => ({ ...j, photo: j.photo ? await compressDataUrl(j.photo) : j.photo })),
      );

      useUiStore.setState({ weeklyReports, reportProfiles, stores, pondJournals } as never);
      const after = sizeOf(useUiStore.getState());
      const sent = await syncNow();
      const delta = `${before.toFixed(1)} MB → ${after.toFixed(1)} MB`;
      if (sent.ok) toast.success(`Foto dioptimalkan (${delta}) & tersimpan ke server.`);
      else toast.error(`Foto dioptimalkan (${delta}), tapi gagal simpan: ${sent.message}`);
    } catch {
      toast.error("Gagal mengoptimalkan gambar.");
    } finally {
      setOptimizing(false);
    }
  }

  function downloadBackup() {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arfarmjaya-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Cadangan diunduh.");
  }

  // Unduh seluruh data langsung dari server (bukan cache perangkat ini).
  function downloadFromServer() {
    const a = document.createElement("a");
    a.href = "/api/backup";
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.info("Mengunduh cadangan dari server…");
  }
  function onRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm("Pulihkan data dari berkas ini? Data saat ini akan diganti.")) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const res = importBackup(String(reader.result));
      if (!res.ok) return toast.error(res.message ?? "Gagal memulihkan.");
      setForm(useUiStore.getState().settings);
      toast.success(res.message ?? "Data dipulihkan.");
      // Langsung simpan ke server supaya tidak hilang.
      const sent = await syncNow();
      if (sent.ok) toast.success("Data tersimpan ke server.");
      else toast.error(`Dipulihkan di perangkat ini, TAPI gagal simpan ke server: ${sent.message}`);
    };
    reader.readAsText(file);
  }

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    updateSettings({
      companyName: form.companyName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      taxNumber: form.taxNumber.trim(),
      currency: form.currency.trim() || "IDR",
      lowStockThreshold: Number.isFinite(form.lowStockThreshold) ? form.lowStockThreshold : 0,
      expiryWarningDays: Number.isFinite(form.expiryWarningDays) ? form.expiryWarningDays : 0,
    });
    toast.success("Pengaturan disimpan.");
  }

  function handleReset() {
    if (confirm("Reset semua data ke kondisi awal? Tindakan ini tidak dapat dibatalkan.")) {
      resetData();
      setForm(useUiStore.getState().settings);
      toast.success("Data berhasil direset ke awal.");
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Sistem"
        title="Pengaturan"
        description="Konfigurasi identitas perusahaan dan ambang batas operasional gudang."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Profil & Konfigurasi</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nama Perusahaan">
                    <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
                  </Field>
                  <Field label="Nomor Telepon">
                    <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  </Field>
                  <Field label="Alamat">
                    <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
                  </Field>
                  <Field label="NPWP / Nomor Pajak">
                    <Input value={form.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} />
                  </Field>
                  <Field label="Mata Uang">
                    <Input value={form.currency} onChange={(e) => set("currency", e.target.value)} />
                  </Field>
                  <Field label="Ambang Stok Rendah" hint="Barang di bawah nilai ini dianggap stok rendah.">
                    <Input
                      type="number"
                      min={0}
                      value={form.lowStockThreshold}
                      onChange={(e) => set("lowStockThreshold", e.target.valueAsNumber)}
                    />
                  </Field>
                  <Field label="Peringatan Kedaluwarsa (hari)" hint="Peringatan muncul saat sisa umur di bawah nilai ini.">
                    <Input
                      type="number"
                      min={0}
                      value={form.expiryWarningDays}
                      onChange={(e) => set("expiryWarningDays", e.target.valueAsNumber)}
                    />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">
                    <Save className="h-4 w-4" /> Simpan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Tema</h2>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="text-muted">Tema aktif saat ini:</p>
              <p className="font-semibold">{theme === "dark" ? "Gelap" : "Terang"}</p>
              <p className="pt-2 text-xs text-muted">Ubah tema melalui tombol di bilah navigasi atas.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Info Aplikasi</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted">Aplikasi</span>
                <span className="font-medium">ARFARM WMS</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Versi</span>
                <span className="font-medium">2.0</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Penyimpanan</span>
                <span className="font-medium">Server + cache browser</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Versi build</span>
                <span className="font-medium">{APP_BUILD}</span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Sinkronisasi</span>
                  <span
                    className={
                      sync.status === "error" ? "font-semibold text-danger"
                      : sync.status === "saved" ? "font-semibold text-primary"
                      : "font-medium"
                    }
                  >
                    {sync.status === "saving" ? "Menyimpan…"
                      : sync.status === "saved" ? "Tersimpan ke server"
                      : sync.status === "error" ? "GAGAL menyimpan"
                      : "Menunggu perubahan"}
                  </span>
                </div>
                {sync.at && <p className="mt-1 text-right text-xs text-muted">{formatDateTime(sync.at)}</p>}
                {sync.message && (
                  <p className="mt-1 rounded-lg bg-red-50 px-2 py-1.5 text-xs font-medium text-danger dark:bg-red-950/30">{sync.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Cadangan & Pemulihan</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted">
                Unduh seluruh data sebagai berkas cadangan (JSON), atau pulihkan dari berkas cadangan. Berguna sebelum perubahan besar atau pindah server. Jika muncul &quot;Gagal menyimpan (HTTP 413)&quot;, klik <strong>Optimalkan Gambar</strong> untuk memperkecil foto agar data kembali bisa tersimpan.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={downloadFromServer}><Download className="h-4 w-4" /> Unduh dari Server</Button>
                <Button variant="secondary" onClick={downloadBackup}><Download className="h-4 w-4" /> Unduh Cadangan</Button>
                <Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Pulihkan dari Berkas</Button>
                <Button variant="secondary" onClick={restoreLocalBackup}><Upload className="h-4 w-4" /> Pulihkan Data Lokal</Button>
                <Button variant="secondary" onClick={optimizeImages} disabled={optimizing}><Images className="h-4 w-4" /> {optimizing ? "Mengoptimalkan…" : "Optimalkan Gambar"}</Button>
                <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onRestoreFile} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-danger/30">
            <CardHeader className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-danger" />
              <h2 className="text-lg font-bold text-danger">Zona Berbahaya</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted">
                Kembalikan seluruh data (produk, transaksi, pengaturan) ke kondisi awal. Tindakan ini tidak dapat dibatalkan.
              </p>
              <Button variant="danger" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" /> Reset Data ke Awal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

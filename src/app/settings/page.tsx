"use client";

import { useState } from "react";
import { Save, RotateCcw, Palette, Info } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import type { AppSettings } from "@/lib/types";

export default function SettingsPage() {
  const settings = useUiStore((s) => s.settings);
  const theme = useUiStore((s) => s.theme);
  const updateSettings = useUiStore((s) => s.updateSettings);
  const resetData = useUiStore((s) => s.resetData);

  const [form, setForm] = useState<AppSettings>(settings);

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
                <span className="font-medium">Lokal (browser)</span>
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

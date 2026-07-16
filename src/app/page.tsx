"use client";

import { AlertTriangle, ArchiveX, Boxes, PackageMinus, PackagePlus, Wallet } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/page-header";
import { InventoryByCategoryChart, StockFlowChart, StockStatusChart } from "@/components/dashboard/charts";
import { ProductTable } from "@/components/inventory/product-table";
import { currency, compactNumber, formatDateTime } from "@/lib/utils";
import { useUiStore } from "@/lib/store";
import { dashboardMetrics } from "@/lib/selectors";

const iconFor: Record<string, React.ComponentType<{ className?: string }>> = {
  "Nilai Inventori": Wallet,
  "Total Produk": Boxes,
  "Stok Rendah": AlertTriangle,
  "Stok Habis": ArchiveX,
  "Hampir Kedaluwarsa": AlertTriangle,
  "Barang Masuk": PackagePlus,
  "Barang Keluar": PackageMinus,
  "Nilai Retail": Wallet,
};

export default function DashboardPage() {
  const products = useUiStore((s) => s.products);
  const settings = useUiStore((s) => s.settings);
  const movements = useUiStore((s) => s.movements);
  const metrics = dashboardMetrics(products, settings);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary">AR FARM JAYA</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Sistem Manajemen Gudang</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Pusat kendali inventori, pembelian, penerimaan, distribusi, POS retail, dan analitik. Semua angka dihitung langsung dari data stok.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const tone = metric.label.includes("Habis") || metric.label.includes("Kedaluwarsa")
            ? "danger"
            : metric.label.includes("Rendah")
              ? "amber"
              : "primary";
          return (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.currency ? currency.format(metric.value) : compactNumber.format(metric.value)}
              hint={metric.change}
              icon={iconFor[metric.label]}
              tone={tone as "primary" | "amber" | "danger"}
            />
          );
        })}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Nilai Inventori per Kategori</h2>
            <p className="text-sm text-muted">Valuasi stok (juta rupiah) berdasarkan HPP.</p>
          </CardHeader>
          <CardContent><InventoryByCategoryChart /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Arus Stok 7 Hari</h2>
            <p className="text-sm text-muted">Barang masuk vs keluar dari transaksi tercatat.</p>
          </CardHeader>
          <CardContent><StockFlowChart /></CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Kontrol Inventori</h2>
            <p className="text-sm text-muted">Cari, filter, ekspor CSV, dan kelola barang.</p>
          </CardHeader>
          <CardContent className="p-0"><ProductTable compact /></CardContent>
        </Card>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Komposisi Status</h2>
              <p className="text-sm text-muted">Distribusi status stok saat ini.</p>
            </CardHeader>
            <CardContent><StockStatusChart /></CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">Aktivitas Terakhir</h2></CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-sm text-muted">Belum ada pergerakan stok.</p>
              ) : (
                <div className="space-y-3">
                  {movements.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className={`rounded-lg p-2 ${m.type === "in" ? "bg-leaf/10 text-primary" : "bg-amber-50 text-amber-700"}`}>
                        {m.type === "in" ? <PackagePlus className="h-4 w-4" /> : <PackageMinus className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{m.productName}</p>
                        <p className="text-xs text-muted">{formatDateTime(m.createdAt)}</p>
                      </div>
                      <span className="text-sm font-semibold">{m.type === "in" ? "+" : "-"}{m.quantity} {m.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

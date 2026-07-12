import { AlertTriangle, ArrowUpRight, Package, ReceiptText, Truck } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DistributionChart, InventoryValueChart, RevenuePurchaseChart } from "@/components/dashboard/charts";
import { ProductTable } from "@/components/inventory/product-table";
import { currency, compactNumber } from "@/lib/utils";
import { metrics, products } from "@/lib/data";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">AR FARM JAYA</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Sistem Manajemen Gudang</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Pusat kendali untuk inventori, pembelian, penerimaan, distribusi, POS retail, analitik, dan operasional siap audit.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-2 text-center text-xs">
          <div className="rounded-md bg-green-50 px-3 py-2 text-primary">
            <Package className="mx-auto mb-1 h-4 w-4" />
            FIFO
          </div>
          <div className="rounded-md bg-amber-50 px-3 py-2 text-amber-700">
            <AlertTriangle className="mx-auto mb-1 h-4 w-4" />
            FEFO
          </div>
          <div className="rounded-md bg-slate-100 px-3 py-2 text-slate-700">
            <Truck className="mx-auto mb-1 h-4 w-4" />
            Aktif
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold">
                    {metric.label.includes("Nilai") || metric.label.includes("Penjualan")
                      ? currency.format(metric.value)
                      : compactNumber.format(metric.value)}
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-2 text-primary">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-primary">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Nilai Inventori</h2>
            <p className="text-sm text-muted">Tren valuasi bulanan dalam miliar rupiah.</p>
          </CardHeader>
          <CardContent>
            <InventoryValueChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Pembelian vs Pendapatan</h2>
            <p className="text-sm text-muted">Ringkasan pembelian, penjualan retail, dan arus kas operasional.</p>
          </CardHeader>
          <CardContent>
            <RevenuePurchaseChart />
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Kontrol Inventori</h2>
            <p className="text-sm text-muted">Cari, filter, sortir, impor, ekspor, batch, rak, dan pelacakan kedaluwarsa.</p>
          </CardHeader>
          <CardContent className="p-0">
            <ProductTable />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Distribusi Hari Ini</h2>
            <p className="text-sm text-muted">Status dari picking sampai pengiriman selesai.</p>
          </CardHeader>
          <CardContent>
            <DistributionChart />
            <div className="mt-4 space-y-3">
              {products.slice(0, 3).map((product) => (
                <div key={product.sku} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <ReceiptText className="h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-muted">{product.rack} / {product.batch}</p>
                  </div>
                  <span className="text-sm font-semibold">{product.currentStock}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

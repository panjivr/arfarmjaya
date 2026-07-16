"use client";

import { BarChart3, PieChart, TrendingUp, Layers } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InventoryByCategoryChart, StockFlowChart, StockStatusChart } from "@/components/dashboard/charts";
import { useUiStore } from "@/lib/store";
import { categoryStats, dashboardMetrics } from "@/lib/selectors";
import { currency, numberFmt } from "@/lib/utils";

export default function AnalyticsPage() {
  const products = useUiStore((s) => s.products);
  const settings = useUiStore((s) => s.settings);

  const metrics = dashboardMetrics(products, settings);
  const stats = categoryStats(products);

  const topStock = [...products]
    .map((p) => ({ p, value: p.currentStock * p.purchasePrice }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const maxTop = topStock[0]?.value || 1;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Analitik"
        title="Analitik"
        description="Visualisasi nilai inventori, arus stok, dan status barang berdasarkan data gudang secara langsung."
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <StatCard
            key={m.label}
            label={m.label}
            value={m.currency ? currency.format(m.value) : numberFmt.format(m.value)}
            hint={m.change}
            icon={TrendingUp}
            tone={m.currency ? "primary" : "slate"}
          />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Nilai Inventori per Kategori</h2>
          </CardHeader>
          <CardContent>
            <InventoryByCategoryChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Arus Stok 7 Hari</h2>
          </CardHeader>
          <CardContent>
            <StockFlowChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Status Stok</h2>
          </CardHeader>
          <CardContent>
            <StockStatusChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Top 5 Nilai Stok</h2>
          </CardHeader>
          <CardContent>
            {topStock.length === 0 ? (
              <p className="text-sm text-muted">Belum ada data.</p>
            ) : (
              <ul className="space-y-4">
                {topStock.map(({ p, value }) => (
                  <li key={p.sku}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-medium">{p.name}</span>
                      <span className="shrink-0 text-sm font-semibold">{currency.format(value)}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max((value / maxTop) * 100, 4)}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {numberFmt.format(p.currentStock)} {p.unit} · {p.category}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Kategori Teratas</h2>
          </CardHeader>
          <CardContent className="p-0">
            {stats.length === 0 ? (
              <p className="p-5 text-sm text-muted">Belum ada data.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" style={{ minWidth: 480 }}>
                  <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Kategori</th>
                      <th className="px-4 py-3 text-right font-semibold">SKU</th>
                      <th className="px-4 py-3 text-right font-semibold">Stok</th>
                      <th className="px-4 py-3 text-right font-semibold">Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.slice(0, 8).map((c) => (
                      <tr key={c.name} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-right">{numberFmt.format(c.count)}</td>
                        <td className="px-4 py-3 text-right">{numberFmt.format(c.stock)}</td>
                        <td className="px-4 py-3 text-right">{currency.format(c.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

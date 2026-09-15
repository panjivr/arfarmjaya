"use client";

import { Download, Wallet, Boxes, ReceiptText, ArrowUpFromLine } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockStatusBadge } from "@/components/ui/badge";
import { useUiStore } from "@/lib/store";
import { categoryStats, inventoryValue } from "@/lib/selectors";
import { currency, numberFmt, formatDateTime, daysUntil, exportCsv } from "@/lib/utils";
import type { MovementType } from "@/lib/types";

const movementLabel: Record<MovementType, string> = {
  in: "Masuk",
  out: "Keluar",
  adjust: "Penyesuaian",
  sale: "Penjualan",
  transfer: "Transfer",
};

function ReportCard({
  title,
  description,
  onExport,
  children,
}: {
  title: string;
  description: string;
  onExport: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <Button variant="secondary" onClick={onExport} className="shrink-0">
          <Download className="h-4 w-4" /> Ekspor CSV
        </Button>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const products = useUiStore((s) => s.products);
  const movements = useUiStore((s) => s.movements);
  const posSales = useUiStore((s) => s.posSales);

  const stats = categoryStats(products);
  const totalStock = stats.reduce((t, c) => t + c.stock, 0);
  const totalValue = stats.reduce((t, c) => t + c.value, 0);
  const totalCount = stats.reduce((t, c) => t + c.count, 0);

  const lowEmpty = products.filter((p) => p.status === "Stok Rendah" || p.status === "Habis");
  const expiring = products
    .map((p) => ({ p, days: daysUntil(p.expirationDate) }))
    .filter(({ days }) => days <= 30 && days >= 0)
    .sort((a, b) => a.days - b.days);
  const recentMovements = movements.slice(0, 25);

  const posTotal = posSales.reduce((t, s) => t + s.total, 0);
  const outCount = movements.filter((m) => m.type === "out" || m.type === "sale" || m.type === "transfer").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Laporan & Analitik"
        title="Laporan"
        description="Ringkasan valuasi inventori, stok kritis, kedaluwarsa, dan pergerakan stok. Setiap tabel dapat diekspor ke CSV."
      />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Nilai Inventori" value={currency.format(inventoryValue(products))} icon={Wallet} tone="primary" />
        <StatCard label="Total SKU" value={numberFmt.format(products.length)} icon={Boxes} tone="slate" />
        <StatCard label="Penjualan POS" value={currency.format(posTotal)} icon={ReceiptText} tone="amber" />
        <StatCard label="Transaksi Keluar" value={numberFmt.format(outCount)} icon={ArrowUpFromLine} tone="danger" />
      </section>

      <div className="grid gap-6">
        <ReportCard
          title="Valuasi Inventori per Kategori"
          description="Jumlah SKU, total stok, dan nilai HPP tiap kategori."
          onExport={() =>
            exportCsv(
              "valuasi-inventori-kategori",
              stats.map((c) => ({ kategori: c.name, jumlah_sku: c.count, total_stok: c.stock, nilai_hpp: c.value })),
            )
          }
        >
          {stats.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Boxes} title="Belum ada data" description="Tidak ada kategori untuk dilaporkan." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" style={{ minWidth: 640 }}>
                <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Kategori</th>
                    <th className="px-4 py-3 text-right font-semibold">Jumlah SKU</th>
                    <th className="px-4 py-3 text-right font-semibold">Total Stok</th>
                    <th className="px-4 py-3 text-right font-semibold">Nilai (HPP)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((c) => (
                    <tr key={c.name} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-right">{numberFmt.format(c.count)}</td>
                      <td className="px-4 py-3 text-right">{numberFmt.format(c.stock)}</td>
                      <td className="px-4 py-3 text-right">{currency.format(c.value)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-border bg-slate-50 font-semibold dark:bg-slate-900">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{numberFmt.format(totalCount)}</td>
                    <td className="px-4 py-3 text-right">{numberFmt.format(totalStock)}</td>
                    <td className="px-4 py-3 text-right">{currency.format(totalValue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </ReportCard>

        <ReportCard
          title="Stok Rendah & Habis"
          description="Barang berstatus Stok Rendah atau Habis yang perlu restok."
          onExport={() =>
            exportCsv(
              "stok-rendah-habis",
              lowEmpty.map((p) => ({
                sku: p.sku,
                nama: p.name,
                stok_saat_ini: p.currentStock,
                stok_minimum: p.minStock,
                status: p.status,
              })),
            )
          }
        >
          {lowEmpty.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Boxes} title="Semua stok aman" description="Tidak ada barang dengan stok rendah atau habis." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" style={{ minWidth: 720 }}>
                <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-semibold">SKU</th>
                    <th className="px-4 py-3 font-semibold">Nama</th>
                    <th className="px-4 py-3 text-right font-semibold">Stok</th>
                    <th className="px-4 py-3 text-right font-semibold">Min</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowEmpty.map((p) => (
                    <tr key={p.sku} className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-right">{numberFmt.format(p.currentStock)}</td>
                      <td className="px-4 py-3 text-right">{numberFmt.format(p.minStock)}</td>
                      <td className="px-4 py-3"><StockStatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportCard>

        <ReportCard
          title="Hampir Kedaluwarsa"
          description="Barang yang kedaluwarsa dalam 30 hari ke depan."
          onExport={() =>
            exportCsv(
              "hampir-kedaluwarsa",
              expiring.map(({ p, days }) => ({
                sku: p.sku,
                nama: p.name,
                tanggal_kedaluwarsa: p.expirationDate,
                sisa_hari: days,
                stok: p.currentStock,
              })),
            )
          }
        >
          {expiring.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Boxes} title="Tidak ada yang mendekati kedaluwarsa" description="Semua barang aman untuk 30 hari ke depan." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" style={{ minWidth: 720 }}>
                <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-semibold">SKU</th>
                    <th className="px-4 py-3 font-semibold">Nama</th>
                    <th className="px-4 py-3 font-semibold">Kedaluwarsa</th>
                    <th className="px-4 py-3 text-right font-semibold">Sisa Hari</th>
                    <th className="px-4 py-3 text-right font-semibold">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {expiring.map(({ p, days }) => (
                    <tr key={p.sku} className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">{p.expirationDate}</td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-700 dark:text-amber-500">{days} hari</td>
                      <td className="px-4 py-3 text-right">{numberFmt.format(p.currentStock)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportCard>

        <ReportCard
          title="Pergerakan Stok Terbaru"
          description="25 pergerakan stok terakhir yang tercatat."
          onExport={() =>
            exportCsv(
              "pergerakan-stok",
              movements.map((m) => ({
                waktu: m.createdAt,
                tipe: movementLabel[m.type],
                produk: m.productName,
                jumlah: m.quantity,
                unit: m.unit,
                aktor: m.actor,
              })),
            )
          }
        >
          {recentMovements.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Boxes} title="Belum ada pergerakan" description="Transaksi stok akan muncul di sini." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" style={{ minWidth: 760 }}>
                <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tipe</th>
                    <th className="px-4 py-3 font-semibold">Produk</th>
                    <th className="px-4 py-3 text-right font-semibold">Jumlah</th>
                    <th className="px-4 py-3 font-semibold">Aktor</th>
                    <th className="px-4 py-3 font-semibold">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovements.map((m) => (
                    <tr key={m.id} className="border-t border-border">
                      <td className="px-4 py-3">{movementLabel[m.type]}</td>
                      <td className="px-4 py-3 font-medium">{m.productName}</td>
                      <td className="px-4 py-3 text-right">
                        {numberFmt.format(m.quantity)} {m.unit}
                      </td>
                      <td className="px-4 py-3">{m.actor}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(m.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportCard>
      </div>
    </AppShell>
  );
}

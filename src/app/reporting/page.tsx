"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Sprout, FileBarChart, BarChart3, Fish, Boxes, Wallet } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { useUiStore } from "@/lib/store";
import { numberFmt, currency } from "@/lib/utils";

const modules = [
  { label: "Laporan Mingguan", href: "/weekly-report", icon: Sprout, desc: "Laporan pelaksanaan kegiatan lapangan + cetak/PDF." },
  { label: "Laporan Stok", href: "/reports", icon: FileBarChart, desc: "Rekap & valuasi inventori, ekspor CSV." },
  { label: "Analitik", href: "/analytics", icon: BarChart3, desc: "Tren stok, barang laris, dan grafik." },
];

export default function ReportingDashboard() {
  const products = useUiStore((s) => s.products);
  const sales = useUiStore((s) => s.leleSales);
  const reports = useUiStore((s) => s.weeklyReports);
  const stats = useMemo(() => {
    const omzetLele = sales.reduce((t, s) => t + s.total, 0);
    return { produk: products.length, laporan: reports.length, omzetLele };
  }, [products, sales, reports]);

  return (
    <AppShell>
      <PageHeader eyebrow="Ruang Kerja" title="Dashboard Reporting" description="Pusat laporan dan rekap: laporan mingguan, rekap inventori, rekap lele, dan ekspor. Akses baca & ekspor — tanpa mengubah transaksi operasional." />
      <section className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Total Barang" value={numberFmt.format(stats.produk)} icon={Boxes} />
        <StatCard label="Laporan Tersimpan" value={numberFmt.format(stats.laporan)} icon={FileBarChart} tone="sky" />
        <StatCard label="Omzet Lele (total)" value={currency.format(stats.omzetLele)} icon={Wallet} tone="primary" />
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((m) => (
          <Link key={m.href} href={m.href} className="hover-lift flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><m.icon className="h-5 w-5" /></span>
            <span className="min-w-0">
              <span className="block font-semibold">{m.label}</span>
              <span className="block text-sm text-muted">{m.desc}</span>
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-5 flex items-center gap-2 text-sm text-muted"><Fish className="h-4 w-4 text-primary" /> Rekap Budidaya Lele tersedia lewat Analitik & Laporan Stok.</p>
    </AppShell>
  );
}

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Boxes, ClipboardList, ShoppingCart, PackagePlus, Truck, ClipboardCheck, ScanBarcode, Archive, Building2, Warehouse, AlertTriangle, PackageX } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { useUiStore } from "@/lib/store";
import { numberFmt } from "@/lib/utils";

const modules = [
  { label: "Inventori", href: "/inventory", icon: Boxes, desc: "Daftar barang, stok, batch & kedaluwarsa." },
  { label: "Barang Keluar", href: "/transactions", icon: ClipboardList, desc: "Catat pengeluaran stok." },
  { label: "Pembelian", href: "/purchase", icon: ShoppingCart, desc: "Pesanan pembelian ke pemasok." },
  { label: "Penerimaan Barang", href: "/receiving", icon: PackagePlus, desc: "Terima barang & tambah stok." },
  { label: "Distribusi", href: "/distribution", icon: Truck, desc: "Kirim barang ke cabang/dapur." },
  { label: "Permintaan Barang", href: "/requests", icon: ClipboardCheck, desc: "Permintaan antar unit." },
  { label: "Stok Opname", href: "/stock-opname", icon: ScanBarcode, desc: "Hitung ulang & sesuaikan stok." },
  { label: "Kategori", href: "/categories", icon: Archive, desc: "Master kategori barang." },
  { label: "Pemasok", href: "/suppliers", icon: Building2, desc: "Master data pemasok." },
  { label: "Gudang & Rak", href: "/warehouses", icon: Warehouse, desc: "Lokasi penyimpanan." },
];

export default function GudangDashboard() {
  const products = useUiStore((s) => s.products);
  const settings = useUiStore((s) => s.settings);
  const stats = useMemo(() => {
    const low = products.filter((p) => p.currentStock > 0 && p.currentStock <= Math.max(p.minStock, settings.lowStockThreshold)).length;
    const out = products.filter((p) => p.currentStock <= 0).length;
    return { total: products.length, low, out };
  }, [products, settings]);

  return (
    <AppShell>
      <PageHeader eyebrow="Ruang Kerja" title="Dashboard Gudang" description="Ringkasan inventori dan pintasan operasional gudang. Fokus pada barang masuk, keluar, distribusi, dan opname." />
      <section className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Total Barang" value={numberFmt.format(stats.total)} icon={Boxes} />
        <StatCard label="Stok Rendah" value={numberFmt.format(stats.low)} icon={AlertTriangle} tone={stats.low > 0 ? "amber" : "slate"} />
        <StatCard label="Stok Habis" value={numberFmt.format(stats.out)} icon={PackageX} tone={stats.out > 0 ? "danger" : "slate"} />
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
    </AppShell>
  );
}

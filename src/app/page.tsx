"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Moon,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Truck,
  Warehouse,
} from "lucide-react";
import { useUiStore } from "@/lib/store";

const features = [
  { icon: Boxes, title: "Inventori Real-time", desc: "Stok, batch, rak, dan kedaluwarsa terpantau langsung dengan status otomatis." },
  { icon: Warehouse, title: "Multi-Gudang & Rak", desc: "Kelola beberapa gudang, rak, dan lokasi penyimpanan dalam satu tempat." },
  { icon: ShoppingCart, title: "Pembelian & Penerimaan", desc: "Pesanan pembelian, persetujuan, dan penerimaan barang yang menambah stok." },
  { icon: Truck, title: "Distribusi & Permintaan", desc: "Alur pengiriman ke cabang/dapur dengan status dari picking hingga selesai." },
  { icon: ReceiptText, title: "POS Retail", desc: "Kasir cepat dengan pengurangan stok otomatis dan riwayat penjualan." },
  { icon: FileText, title: "Invoice Multi-Toko", desc: "Buat & cetak invoice profesional dengan logo dan data tiap toko." },
  { icon: BarChart3, title: "Laporan & Analitik", desc: "Valuasi inventori, barang laris, stok kritis, dan ekspor CSV." },
  { icon: ShieldCheck, title: "RBAC & Log Audit", desc: "Hak akses per peran dan jejak audit untuk setiap perubahan." },
];

const modules = [
  "Dasbor", "Inventori", "Kategori", "Pemasok", "Gudang", "Rak",
  "Pembelian", "Penerimaan", "Barang Keluar", "Distribusi", "Permintaan",
  "Stok Opname", "POS Retail", "Toko", "Invoice", "Laporan", "Analitik",
  "Notifikasi", "Log Audit", "Pengguna", "Pengaturan",
];

export default function LandingPage() {
  const user = useUiStore((s) => s.user);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const target = user ? (user.role === "admin" ? "/dashboard" : "/transactions") : "/login";
  const cta = user ? "Buka Aplikasi" : "Masuk ke Sistem";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white p-1 ring-1 ring-border">
              <Image src="/logo.png" alt="AR FARM JAYA" width={36} height={36} className="object-contain" priority />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">AR FARM JAYA</p>
              <p className="hidden text-xs text-muted sm:block">Sistem Manajemen Gudang</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
            <a href="#tentang" className="transition hover:text-foreground">Tentang</a>
            <a href="#fitur" className="transition hover:text-foreground">Fitur</a>
            <a href="#modul" className="transition hover:text-foreground">Modul</a>
            <a href="#kontak" className="transition hover:text-foreground">Kontak</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition hover:bg-slate-50 dark:hover:bg-slate-900"
              aria-label="Ganti tema"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              href={target}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              {cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(118,184,82,0.18),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(246,179,51,0.16),transparent_32%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-secondary" /> ARFARM BHINNEKA NUSA JAYA
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Kelola gudang, stok, dan penjualan dalam <span className="text-primary">satu sistem.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted">
              AR FARM JAYA mengelola bahan baku, distribusi ke cabang & dapur, penjualan retail, hingga invoice —
              lengkap dengan inventori real-time, laporan, dan jejak audit. Rapi, cepat, dan siap dipakai harian.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={target} className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white transition hover:bg-emerald-800">
                {cta} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#fitur" className="inline-flex h-12 items-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900">
                Pelajari Fitur
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["Data real-time", "Multi-gudang & toko", "Siap audit"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> {t}</span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Dasbor Gudang</span>
                </div>
                <span className="rounded-full bg-leaf/10 px-2.5 py-1 text-xs font-semibold text-primary">Live</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { icon: Boxes, label: "Total Produk", value: "200+", tone: "bg-leaf/10 text-primary" },
                  { icon: PackageCheck, label: "Nilai Inventori", value: "Rp 2,8 M", tone: "bg-amber-50 text-amber-700 dark:bg-amber-950/40" },
                  { icon: Truck, label: "Distribusi", value: "Aktif", tone: "bg-blue-50 text-blue-700 dark:bg-blue-950/40" },
                  { icon: Bell, label: "Peringatan", value: "Terpantau", tone: "bg-red-50 text-danger dark:bg-red-950/40" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-border p-3">
                    <div className={`inline-flex rounded-lg p-2 ${s.tone}`}><s.icon className="h-4 w-4" /></div>
                    <p className="mt-2 text-xs text-muted">{s.label}</p>
                    <p className="text-lg font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-muted"><span>Arus stok 7 hari</span><span>Masuk / Keluar</span></div>
                <div className="flex h-20 items-end gap-1.5">
                  {[40, 55, 35, 70, 50, 80, 62].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-secondary/70" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {[
            { value: "21", label: "Modul terintegrasi" },
            { value: "Real-time", label: "Pembaruan stok" },
            { value: "Multi", label: "Gudang & toko" },
            { value: "100%", label: "Tercatat & audit" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-primary sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="tentang" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Tentang Kami</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">ARFARM BHINNEKA NUSA JAYA</h2>
            <p className="mt-4 leading-7 text-muted">
              AR FARM JAYA bergerak di penyediaan dan distribusi bahan baku pangan — dari beras, sembako, hingga hasil segar —
              untuk cabang, dapur (SPPG), dan retail. Sistem ini menyatukan seluruh operasional gudang agar setiap barang
              masuk, keluar, dan terjual tercatat rapi dan mudah diaudit.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Pencatatan stok akurat dengan status otomatis (rendah, habis, hampir kedaluwarsa).",
                "Alur pembelian, penerimaan, distribusi, dan opname yang saling terhubung.",
                "Invoice & POS untuk penjualan retail dengan bukti transaksi profesional.",
              ].map((t) => (
                <li key={t} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span className="text-sm leading-6">{t}</span></li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {features.slice(0, 4).map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="inline-flex rounded-lg bg-leaf/10 p-2.5 text-primary"><f.icon className="h-5 w-5" /></div>
                <p className="mt-3 font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">Fitur Unggulan</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Semua yang dibutuhkan operasional gudang</h2>
            <p className="mt-3 text-muted">Satu platform untuk stok, pembelian, distribusi, penjualan, dan pelaporan.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-background p-5 transition hover:shadow-md">
                <div className="inline-flex rounded-lg bg-leaf/10 p-2.5 text-primary"><f.icon className="h-5 w-5" /></div>
                <p className="mt-3 font-semibold">{f.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modul" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-primary">Modul Lengkap</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">21 modul siap pakai</h2>
          <p className="mt-3 text-muted">Dari data master hingga analitik, semuanya terintegrasi.</p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {modules.map((m) => (
            <span key={m} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> {m}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-primary p-8 text-white sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_35%)]" />
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Siap mengelola gudang lebih rapi?</h2>
              <p className="mt-2 max-w-xl text-white/80">Masuk ke sistem dan mulai catat stok, buat invoice, dan pantau operasional hari ini.</p>
            </div>
            <Link href={target} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-primary transition hover:bg-white/90">
              {cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontak" className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white p-1 ring-1 ring-border">
                <Image src="/logo.png" alt="AR FARM JAYA" width={36} height={36} className="object-contain" />
              </div>
              <div className="leading-tight">
                <p className="font-bold">AR FARM JAYA</p>
                <p className="text-xs text-muted">Sistem Manajemen Gudang</p>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
              Solusi manajemen gudang & retail untuk bisnis penyediaan bahan baku pangan.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Navigasi</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><a href="#tentang" className="transition hover:text-foreground">Tentang</a></li>
              <li><a href="#fitur" className="transition hover:text-foreground">Fitur</a></li>
              <li><a href="#modul" className="transition hover:text-foreground">Modul</a></li>
              <li><Link href="/login" className="transition hover:text-foreground">Masuk ke Sistem</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Kontak</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>Ponorogo, Jawa Timur, Indonesia</li>
              <li>arfarmjaya.biz.id</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted">
          © {new Date().getFullYear()} ARFARM BHINNEKA NUSA JAYA. Semua hak dilindungi.
        </div>
      </footer>
    </div>
  );
}

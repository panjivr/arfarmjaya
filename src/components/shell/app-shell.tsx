"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  Command,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { navigation } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LoginScreen } from "@/components/auth/login-screen";
import { Card, CardContent } from "@/components/ui/card";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, commandOpen, setCommandOpen, user, logout } = useUiStore();
  const visibleNavigation = navigation.filter((item) => user?.role === "admin" || !item.adminOnly);

  if (!user) {
    return <LoginScreen />;
  }

  const isRestricted = user.role === "karyawan" && pathname !== "/transactions";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-card lg:block">
        <Sidebar pathname={pathname} navigationItems={visibleNavigation} />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.aside
              className="h-full w-72 border-r border-border bg-card"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
            >
              <div className="flex justify-end p-3">
                <Button variant="ghost" className="h-9 w-9 px-0" onClick={toggleSidebar} aria-label="Tutup sidebar">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <Sidebar pathname={pathname} navigationItems={visibleNavigation} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button variant="ghost" className="h-10 w-10 px-0 lg:hidden" onClick={toggleSidebar} aria-label="Buka sidebar">
              <Menu className="h-5 w-5" />
            </Button>
            <button
              className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-card px-3 text-left text-sm text-muted"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">Cari SKU, barang, pemasok, rak, atau transaksi...</span>
              <span className="ml-auto hidden items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs sm:flex">
                <Command className="h-3 w-3" /> K
              </span>
            </button>
            <Button variant="secondary" className="h-10 w-10 px-0" aria-label="Ganti tema">
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>
            <Button variant="secondary" className="h-10 w-10 px-0" aria-label="Notifikasi">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="hidden items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted">{user.label}</p>
              </div>
            </div>
            <Button variant="ghost" className="h-10 w-10 px-0" onClick={logout} aria-label="Keluar">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {isRestricted ? <RestrictedAccess /> : children}
        </main>
      </div>

      <AnimatePresence>
        {commandOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-4 pt-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandOpen(false)}
          >
            <motion.div
              className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-xl"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Search className="h-5 w-5 text-muted" />
                <input className="w-full bg-transparent text-sm outline-none" placeholder="Cari menu atau data operasional..." autoFocus />
              </div>
              <div className="grid gap-1 p-2">
                {visibleNavigation.slice(0, 8).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                    onClick={() => setCommandOpen(false)}
                  >
                    <item.icon className="h-4 w-4 text-primary" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RestrictedAccess() {
  return (
    <Card>
      <CardContent className="flex min-h-[420px] flex-col items-center justify-center text-center">
        <ShieldCheck className="h-12 w-12 text-primary" />
        <h1 className="mt-5 text-2xl font-bold">Akses dibatasi</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          Akun Karyawan Gudang hanya dapat membuka fitur Barang Keluar. Semua menu lain hanya untuk Admin Utama.
        </p>
        <Link
          href="/transactions"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          Buka Barang Keluar
        </Link>
      </CardContent>
    </Card>
  );
}

function Sidebar({
  pathname,
  navigationItems,
}: {
  pathname: string;
  navigationItems: typeof navigation;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-border">
            <Image src="/logo.png" alt="Logo AR FARM JAYA" width={48} height={48} className="object-contain" priority />
          </div>
          <div>
            <p className="font-bold tracking-tight">AR FARM JAYA</p>
            <p className="text-xs font-medium text-muted">Sistem Manajemen Gudang</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {navigationItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-900",
                active && "bg-leaf/10 text-primary dark:bg-green-950/40",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted">
        Role admin, role karyawan, data stok real, dan alur audit gudang sudah disiapkan.
      </div>
    </div>
  );
}

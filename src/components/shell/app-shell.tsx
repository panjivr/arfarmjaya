"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Command,
  CornerDownLeft,
  LogOut,
  Menu,
  Moon,
  Package,
  Search,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { navigation, type NavItem } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store";
import { buildNotifications } from "@/lib/selectors";
import { Button } from "@/components/ui/button";
import { LoginScreen } from "@/components/auth/login-screen";
import { LoginNotice } from "@/components/shell/login-notice";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toast";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const theme = useUiStore((s) => s.theme);
  const user = useUiStore((s) => s.user);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setSidebar = useUiStore((s) => s.setSidebar);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const commandOpen = useUiStore((s) => s.commandOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const logout = useUiStore((s) => s.logout);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!useUiStore.getState().commandOpen);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandOpen]);

  useEffect(() => {
    setSidebar(false);
    setCommandOpen(false);
  }, [pathname, setSidebar, setCommandOpen]);

  if (!user) {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    );
  }

  const visibleNavigation = navigation.filter((item) => user.role === "admin" || !item.adminOnly);
  const isRestricted = user.role !== "admin" && navigation.some((n) => n.href === pathname && n.adminOnly);

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
            onClick={toggleSidebar}
          >
            <motion.aside
              className="h-full w-72 border-r border-border bg-card"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              onClick={(e) => e.stopPropagation()}
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
              <span className="truncate">Cari SKU, barang, atau menu...</span>
              <span className="ml-auto hidden items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs sm:flex">
                <Command className="h-3 w-3" /> K
              </span>
            </button>
            <Button variant="secondary" className="h-10 w-10 px-0" onClick={toggleTheme} aria-label="Ganti tema">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <NotificationBell isAdmin={user.role === "admin"} />
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
        <main className="px-4 py-6 sm:px-6 lg:px-8">{isRestricted ? <RestrictedAccess /> : children}</main>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} navigationItems={visibleNavigation} />
      <LoginNotice />
      <Toaster />
    </div>
  );
}

function NotificationBell({ isAdmin }: { isAdmin: boolean }) {
  const products = useUiStore((s) => s.products);
  const settings = useUiStore((s) => s.settings);
  const read = useUiStore((s) => s.readNotifications);
  const hasHydrated = useUiStore((s) => s.hasHydrated);
  const count = useMemo(() => buildNotifications(products, settings).filter((n) => !read.includes(n.id)).length, [products, settings, read]);
  if (!isAdmin) {
    return (
      <Button variant="secondary" className="h-10 w-10 px-0" aria-label="Notifikasi" disabled>
        <Bell className="h-4 w-4" />
      </Button>
    );
  }
  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-slate-50 dark:hover:bg-slate-900"
      aria-label="Notifikasi"
    >
      <Bell className="h-4 w-4" />
      {hasHydrated && count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function CommandPalette({
  open,
  onClose,
  navigationItems,
}: {
  open: boolean;
  onClose: () => void;
  navigationItems: NavItem[];
}) {
  const products = useUiStore((s) => s.products);
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();
  const menuMatches = navigationItems.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 6);
  const productMatches = q
    ? products
        .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q))
        .slice(0, 6)
    : [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-4 pt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-xl"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-5 w-5 text-muted" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Cari menu, SKU, barang, atau barcode..."
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="hidden items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs text-muted sm:flex">
                Esc
              </span>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {menuMatches.length > 0 && <p className="px-3 py-1.5 text-xs font-semibold uppercase text-muted">Menu</p>}
              {menuMatches.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                  onClick={onClose}
                >
                  <item.icon className="h-4 w-4 text-primary" />
                  {item.label}
                </Link>
              ))}
              {productMatches.length > 0 && <p className="px-3 py-1.5 text-xs font-semibold uppercase text-muted">Barang</p>}
              {productMatches.map((p) => (
                <button
                  key={p.sku}
                  onClick={() => {
                    router.push("/inventory");
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <Package className="h-4 w-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-muted">{p.sku}</span>
                  <span className="text-xs font-semibold">{p.currentStock} {p.unit}</span>
                </button>
              ))}
              {q && menuMatches.length === 0 && productMatches.length === 0 && (
                <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted">
                  <CornerDownLeft className="h-4 w-4" /> Tidak ada hasil untuk &quot;{query}&quot;.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RestrictedAccess() {
  return (
    <Card>
      <CardContent className="flex min-h-[420px] flex-col items-center justify-center text-center">
        <ShieldCheck className="h-12 w-12 text-primary" />
        <h1 className="mt-5 text-2xl font-bold">Akses dibatasi</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          Akun ini hanya dapat membuka fitur Barang Keluar. Menu lain khusus untuk Admin Utama.
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

function Sidebar({ pathname, navigationItems }: { pathname: string; navigationItems: NavItem[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    navigationItems.forEach((item) => {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    });
    return Array.from(map.entries());
  }, [navigationItems]);

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
        {groups.map(([group, items]) => (
          <div key={group} className="mb-3">
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{group}</p>
            {items.map((item) => {
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
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted">
        Data tersimpan lokal di browser. Semua modul terhubung ke inventori dan log audit.
      </div>
    </div>
  );
}

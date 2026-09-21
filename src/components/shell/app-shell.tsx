"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  Command,
  CornerDownLeft,
  LogOut,
  Menu,
  Moon,
  Package,
  Search,
  Settings2,
  ShieldCheck,
  Sun,
  KeyRound,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { navigation, type NavItem } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store";
import { canAccessPath, roleHome, ROLE_META } from "@/lib/rbac";
import { PasswordModal } from "@/components/auth/password-modal";
import { buildNotifications } from "@/lib/selectors";
import { Button } from "@/components/ui/button";
import { LoginScreen } from "@/components/auth/login-screen";
import { LoginNotice } from "@/components/shell/login-notice";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toast";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useUiStore((s) => s.theme);
  const user = useUiStore((s) => s.user);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setSidebar = useUiStore((s) => s.setSidebar);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const commandOpen = useUiStore((s) => s.commandOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const logout = useUiStore((s) => s.logout);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* abaikan — tetap keluar di sisi klien */
    }
    logout();
    router.push("/login");
  }

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

  // Kunci gulir latar selama laci menu terbuka di layar kecil.
  useEffect(() => {
    if (!sidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sidebarOpen]);

  if (!user) {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    );
  }

  const isAdmin = user.role === "ADMIN_UTAMA";
  const visibleNavigation = navigation.filter((item) => canAccessPath(user.role, item.href));
  const homeHref = roleHome(user.role);
  const isRestricted = !canAccessPath(user.role, pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-card lg:block">
        <Sidebar pathname={pathname} navigationItems={visibleNavigation} homeHref={homeHref} />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
          >
            <motion.aside
              className="relative h-full w-[17rem] max-w-[86vw] border-r border-border bg-card shadow-xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                className="absolute right-2 top-2 z-10 h-9 w-9 px-0"
                onClick={toggleSidebar}
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </Button>
              <Sidebar pathname={pathname} navigationItems={visibleNavigation} homeHref={homeHref} collapsible />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
            <Button variant="ghost" className="h-10 w-10 shrink-0 px-0 lg:hidden" onClick={toggleSidebar} aria-label="Buka menu">
              <Menu className="h-5 w-5" />
            </Button>

            {/* Merek ringkas menggantikan sidebar saat layar kecil */}
            <Link href={homeHref} className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
              <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
              <span className="truncate text-sm font-bold tracking-tight">AR FARM JAYA</span>
            </Link>

            {/* Pencarian: kolom penuh di layar lebar, tombol ikon di layar kecil */}
            <button
              className="hidden h-10 min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-card-muted px-3 text-left text-sm text-muted transition hover:border-border-strong lg:flex"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">Cari SKU, barang, atau menu...</span>
              <span className="ml-auto flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs">
                <Command className="h-3 w-3" /> K
              </span>
            </button>
            <Button variant="ghost" className="h-10 w-10 shrink-0 px-0 lg:hidden" onClick={() => setCommandOpen(true)} aria-label="Cari">
              <Search className="h-5 w-5" />
            </Button>

            <NotificationBell isAdmin={isAdmin} />
            <UserMenu name={user.name} label={ROLE_META[user.role]?.workspace ?? user.label} isAdmin={isAdmin} theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />
          </div>
        </header>
        <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{isRestricted ? <RestrictedAccess /> : children}</main>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} navigationItems={visibleNavigation} />
      <LoginNotice />
      <Toaster />
    </div>
  );
}

/**
 * Satu menu untuk identitas pengguna, ganti tema, pintasan pengaturan, dan
 * keluar — menggantikan tiga kontrol terpisah di header agar tetap ringkas di HP.
 */
function UserMenu({
  name,
  label,
  isAdmin,
  theme,
  onToggleTheme,
  onLogout,
}: {
  name: string;
  label: string;
  isAdmin: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu pengguna"
        className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card pl-1.5 pr-1.5 text-left transition hover:bg-slate-50 sm:pr-2.5 dark:hover:bg-slate-900"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-white">{initials}</span>
        <span className="hidden min-w-0 md:block">
          <span className="block max-w-[140px] truncate text-sm font-semibold leading-tight">{name}</span>
          <span className="block max-w-[140px] truncate text-[11px] leading-tight text-muted">{label}</span>
        </span>
        <ChevronDown className={cn("hidden h-4 w-4 shrink-0 text-muted transition sm:block", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-border bg-card shadow-xl"
          >
            <div className="border-b border-border px-4 py-3 md:hidden">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-muted">{label}</p>
            </div>
            <button
              role="menuitem"
              onClick={() => {
                onToggleTheme();
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-muted" /> : <Moon className="h-4 w-4 text-muted" />}
              Mode {theme === "dark" ? "terang" : "gelap"}
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setPwOpen(true);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <KeyRound className="h-4 w-4 text-muted" /> Ganti Password
            </button>
            {isAdmin && (
              <Link
                role="menuitem"
                href="/users"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <UsersIcon className="h-4 w-4 text-muted" /> Kelola Pengguna
              </Link>
            )}
            {isAdmin && (
              <Link
                role="menuitem"
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <Settings2 className="h-4 w-4 text-muted" /> Pengaturan
              </Link>
            )}
            <button
              role="menuitem"
              onClick={onLogout}
              className="flex w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left text-sm font-medium text-danger hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <PasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
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

function Sidebar({
  pathname,
  navigationItems,
  homeHref,
  collapsible = false,
}: {
  pathname: string;
  navigationItems: NavItem[];
  homeHref: string;
  /** true di laci HP: hanya grup aktif yang terbuka agar daftar tetap pendek. */
  collapsible?: boolean;
}) {
  const soloItems = navigationItems.filter((item) => !item.group);
  const groups = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    navigationItems
      .filter((item) => item.group)
      .forEach((item) => {
        const list = map.get(item.group) ?? [];
        list.push(item);
        map.set(item.group, list);
      });
    return Array.from(map.entries());
  }, [navigationItems]);

  const activeGroup = navigationItems.find((item) => item.href === pathname)?.group ?? "";
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const isOpen = (group: string) =>
    closed[group] === undefined ? !collapsible || group === activeGroup : !closed[group];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4 sm:p-5">
        <Link href={homeHref} className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-border">
            <Image src="/logo.png" alt="Logo AR FARM JAYA" width={44} height={44} className="object-contain" priority />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold tracking-tight">AR FARM JAYA</p>
            <p className="truncate text-xs font-medium text-muted">Pertanian · Budidaya · Supply</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {soloItems.map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href} />
        ))}

        {groups.map(([group, items]) => {
          const open = isOpen(group);
          const hasActive = items.some((item) => item.href === pathname);
          return (
            <div key={group} className="mt-1.5">
              <button
                onClick={() => setClosed((state) => ({ ...state, [group]: open }))}
                aria-expanded={open}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted transition hover:bg-slate-100 dark:hover:bg-slate-900",
                  hasActive && !open && "text-primary",
                )}
              >
                <span className="truncate">{group}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition", open && "rotate-180")} />
              </button>
              {open && (
                <div className="mt-0.5">
                  {items.map((item) => (
                    <NavLink key={item.href} item={item} active={pathname === item.href} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          <span>Data tersinkron ke server — bisa diakses dari perangkat mana pun.</span>
        </div>
      </div>
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/nav relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800/60",
        active && "bg-primary/10 font-semibold text-primary dark:bg-primary/15",
      )}
    >
      {active && <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-primary" />}
      <item.icon className={cn("h-4 w-4 shrink-0 transition", active ? "text-primary" : "text-muted group-hover/nav:text-foreground")} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

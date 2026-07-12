"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Command,
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, commandOpen, setCommandOpen } = useUiStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-card lg:block">
        <Sidebar pathname={pathname} />
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
                <Button variant="ghost" className="h-9 w-9 px-0" onClick={toggleSidebar} aria-label="Close sidebar">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <Sidebar pathname={pathname} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button variant="ghost" className="h-10 w-10 px-0 lg:hidden" onClick={toggleSidebar} aria-label="Open sidebar">
              <Menu className="h-5 w-5" />
            </Button>
            <button
              className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-card px-3 text-left text-sm text-muted"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">Search SKU, purchase order, supplier, rack...</span>
              <span className="ml-auto hidden items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs sm:flex">
                <Command className="h-3 w-3" /> K
              </span>
            </button>
            <Button variant="secondary" className="h-10 w-10 px-0" aria-label="Toggle theme">
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>
            <Button variant="secondary" className="h-10 w-10 px-0" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="hidden items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Owner Console</p>
                <p className="text-xs text-muted">RBAC active</p>
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
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
                <input className="w-full bg-transparent text-sm outline-none" placeholder="Run command or search records..." autoFocus />
              </div>
              <div className="grid gap-1 p-2">
                {navigation.slice(0, 8).map((item) => (
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

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-lg font-black text-white">
            AR
          </div>
          <div>
            <p className="font-bold tracking-tight">AR FARM JAYA</p>
            <p className="text-xs font-medium text-muted">Warehouse Management System</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {navigation.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-900",
                active && "bg-green-50 text-primary dark:bg-green-950/40",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted">
        PostgreSQL, Prisma, Better Auth, RBAC, audit log ready.
      </div>
    </div>
  );
}

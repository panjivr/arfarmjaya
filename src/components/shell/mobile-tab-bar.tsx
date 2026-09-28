"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { navigation } from "@/lib/data";
import { canAccessPath, roleHome } from "@/lib/rbac";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Prioritas destinasi utama untuk bilah bawah; yang tak bisa diakses dilewati.
const PRIORITY = ["/lele", "/weekly-report", "/inventory", "/transactions", "/pos", "/invoices", "/reports", "/gudang", "/reporting", "/purchase"];

const SHORT: Record<string, string> = {
  "/dashboard": "Dasbor",
  "/gudang": "Gudang",
  "/reporting": "Laporan",
  "/lele": "Lele",
  "/weekly-report": "Laporan",
  "/inventory": "Stok",
  "/transactions": "Keluar",
  "/pos": "POS",
  "/invoices": "Invoice",
  "/reports": "Laporan",
  "/purchase": "Beli",
};

export function MobileTabBar() {
  const pathname = usePathname();
  const user = useUiStore((s) => s.user);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  if (!user) return null;

  const role = user.role;
  const home = roleHome(role);
  const homeItem = navigation.find((n) => n.href === home);

  const picks = PRIORITY.filter((href) => href !== home && canAccessPath(role, href))
    .map((href) => navigation.find((n) => n.href === href))
    .filter((n): n is NonNullable<typeof n> => Boolean(n))
    .slice(0, 3);

  const tabs = [homeItem, ...picks].filter((n): n is NonNullable<typeof n> => Boolean(n));

  const isActive = (href: string) => (href === home ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigasi utama"
    >
      <div className="mx-auto flex h-[3.75rem] max-w-lg items-stretch">
        {tabs.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition",
                active ? "text-primary" : "text-muted",
              )}
            >
              <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition", active && "bg-primary/10")}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="max-w-full truncate">{SHORT[item.href] ?? item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={toggleSidebar}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium text-muted transition"
          aria-label="Buka menu lengkap"
        >
          <span className="flex h-7 w-12 items-center justify-center rounded-full">
            <Menu className="h-5 w-5" />
          </span>
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}

import { cn } from "@/lib/utils";
import type { Product } from "@/lib/data";
import type { OrderStatus } from "@/lib/types";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", className)}>{children}</span>;
}

const stockStyles: Record<Product["status"], string> = {
  Tersedia: "bg-leaf/10 text-primary",
  "Stok Rendah": "bg-amber-50 text-amber-700 dark:bg-amber-950/40",
  "Hampir Kedaluwarsa": "bg-orange-50 text-orange-700 dark:bg-orange-950/40",
  Karantina: "bg-red-50 text-danger dark:bg-red-950/40",
  Habis: "bg-red-50 text-danger dark:bg-red-950/40",
};

export function StockStatusBadge({ status }: { status: Product["status"] }) {
  return <Badge className={stockStyles[status]}>{status}</Badge>;
}

const orderStyles: Record<OrderStatus, string> = {
  Draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  "Menunggu Persetujuan": "bg-amber-50 text-amber-700 dark:bg-amber-950/40",
  Disetujui: "bg-leaf/10 text-primary",
  Ditolak: "bg-red-50 text-danger dark:bg-red-950/40",
  Diproses: "bg-blue-50 text-blue-700 dark:bg-blue-950/40",
  Dikirim: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40",
  Selesai: "bg-leaf/10 text-primary",
  Dibatalkan: "bg-red-50 text-danger dark:bg-red-950/40",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={orderStyles[status] ?? orderStyles.Draft}>{status}</Badge>;
}

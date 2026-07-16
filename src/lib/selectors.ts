import type { Product } from "@/lib/data";
import type { AppSettings } from "@/lib/types";
import { daysUntil } from "@/lib/utils";

export function inventoryValue(products: Product[]) {
  return products.reduce((total, p) => total + p.currentStock * p.purchasePrice, 0);
}

export function retailValue(products: Product[]) {
  return products.reduce((total, p) => total + p.currentStock * p.retailPrice, 0);
}

export type DashboardMetric = { label: string; value: number; change: string; currency?: boolean };

export function dashboardMetrics(products: Product[], settings: AppSettings): DashboardMetric[] {
  const low = products.filter((p) => p.status === "Stok Rendah").length;
  const empty = products.filter((p) => p.status === "Habis").length;
  const expiring = products.filter((p) => {
    const d = daysUntil(p.expirationDate);
    return d <= settings.expiryWarningDays && d >= 0;
  }).length;
  const incoming = products.reduce((t, p) => t + (p.stockIn ?? 0), 0);
  const outgoing = products.reduce((t, p) => t + (p.stockOut ?? 0), 0);
  return [
    { label: "Nilai Inventori", value: inventoryValue(products), change: "berdasarkan HPP", currency: true },
    { label: "Total Produk", value: products.length, change: "SKU aktif" },
    { label: "Stok Rendah", value: low, change: `≤ ${settings.lowStockThreshold} unit` },
    { label: "Stok Habis", value: empty, change: "perlu restok" },
    { label: "Hampir Kedaluwarsa", value: expiring, change: `≤ ${settings.expiryWarningDays} hari` },
    { label: "Barang Masuk", value: incoming, change: "akumulasi" },
    { label: "Barang Keluar", value: outgoing, change: "akumulasi" },
    { label: "Nilai Retail", value: retailValue(products), change: "potensi penjualan", currency: true },
  ];
}

export type CategoryStat = { name: string; count: number; stock: number; value: number };

export function categoryStats(products: Product[]): CategoryStat[] {
  const map = new Map<string, CategoryStat>();
  products.forEach((p) => {
    const entry = map.get(p.category) ?? { name: p.category, count: 0, stock: 0, value: 0 };
    entry.count += 1;
    entry.stock += p.currentStock;
    entry.value += p.currentStock * p.purchasePrice;
    map.set(p.category, entry);
  });
  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

export type NotificationItem = {
  id: string;
  kind: "danger" | "warning" | "info";
  title: string;
  detail: string;
};

export function buildNotifications(products: Product[], settings: AppSettings): NotificationItem[] {
  const items: NotificationItem[] = [];
  products.forEach((p) => {
    if (p.currentStock <= 0) {
      items.push({ id: `empty-${p.sku}`, kind: "danger", title: `Stok habis: ${p.name}`, detail: `${p.sku} di ${p.rack}` });
    } else if (p.currentStock <= Math.max(p.minStock, settings.lowStockThreshold)) {
      items.push({ id: `low-${p.sku}`, kind: "warning", title: `Stok rendah: ${p.name}`, detail: `Sisa ${p.currentStock} ${p.unit} (min ${p.minStock})` });
    }
    const d = daysUntil(p.expirationDate);
    if (d <= settings.expiryWarningDays && d >= 0) {
      items.push({ id: `exp-${p.sku}`, kind: "warning", title: `Hampir kedaluwarsa: ${p.name}`, detail: `${d} hari lagi (${p.expirationDate})` });
    } else if (d < 0) {
      items.push({ id: `expd-${p.sku}`, kind: "danger", title: `Kedaluwarsa: ${p.name}`, detail: `Lewat ${Math.abs(d)} hari` });
    }
  });
  return items;
}

import {
  Archive,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  FileText,
  LayoutDashboard,
  PackageCheck,
  PackagePlus,
  ReceiptText,
  ScanBarcode,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  Store,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { realStockProducts } from "@/lib/stock-products";

export type Product = {
  sku: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  purchasePrice: number;
  retailPrice: number;
  minStock: number;
  maxStock: number;
  currentStock: number;
  initialStock?: number;
  stockIn?: number;
  stockOut?: number;
  rack: string;
  warehouse: string;
  supplier: string;
  batch: string;
  expirationDate: string;
  status: "Tersedia" | "Stok Rendah" | "Hampir Kedaluwarsa" | "Karantina" | "Habis";
  lastUpdate?: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  adminOnly: boolean;
  /** Grup di sidebar. Kosong = tampil di paling atas tanpa judul grup. */
  group: string;
};

/**
 * Menu dikelompokkan seringkas mungkin: satu pintasan utama (Dasbor) lalu empat
 * grup yang bisa dibuka-tutup, supaya daftar menu tetap pendek di layar HP.
 */
export const navigation: NavItem[] = [
  { label: "Dasbor", href: "/dashboard", icon: LayoutDashboard, adminOnly: true, group: "" },

  { label: "Inventori", href: "/inventory", icon: Boxes, adminOnly: true, group: "Inventori & Master" },
  { label: "Kategori", href: "/categories", icon: Archive, adminOnly: true, group: "Inventori & Master" },
  { label: "Pemasok", href: "/suppliers", icon: Building2, adminOnly: true, group: "Inventori & Master" },
  { label: "Gudang", href: "/warehouses", icon: Warehouse, adminOnly: true, group: "Inventori & Master" },
  { label: "Manajemen Rak", href: "/racks", icon: PackageCheck, adminOnly: true, group: "Inventori & Master" },

  { label: "Barang Keluar", href: "/transactions", icon: ClipboardList, adminOnly: false, group: "Operasional" },
  { label: "Pembelian", href: "/purchase", icon: ShoppingCart, adminOnly: true, group: "Operasional" },
  { label: "Penerimaan Barang", href: "/receiving", icon: PackagePlus, adminOnly: true, group: "Operasional" },
  { label: "Distribusi", href: "/distribution", icon: Truck, adminOnly: true, group: "Operasional" },
  { label: "Permintaan Barang", href: "/requests", icon: ClipboardCheck, adminOnly: true, group: "Operasional" },
  { label: "Stok Opname", href: "/stock-opname", icon: ScanBarcode, adminOnly: true, group: "Operasional" },

  { label: "POS Retail", href: "/pos", icon: ReceiptText, adminOnly: true, group: "Penjualan" },
  { label: "Toko", href: "/stores", icon: Store, adminOnly: true, group: "Penjualan" },
  { label: "Invoice", href: "/invoices", icon: FileText, adminOnly: true, group: "Penjualan" },

  { label: "Laporan Mingguan", href: "/weekly-report", icon: Sprout, adminOnly: true, group: "Laporan & Analitik" },
  { label: "Laporan Stok", href: "/reports", icon: FileBarChart, adminOnly: true, group: "Laporan & Analitik" },
  { label: "Analitik", href: "/analytics", icon: BarChart3, adminOnly: true, group: "Laporan & Analitik" },

  { label: "Notifikasi", href: "/notifications", icon: Bell, adminOnly: true, group: "Sistem" },
  { label: "Log Audit", href: "/audit-log", icon: ShieldCheck, adminOnly: true, group: "Sistem" },
  { label: "Pengguna & Role", href: "/users", icon: Users, adminOnly: true, group: "Sistem" },
  { label: "Pengaturan", href: "/settings", icon: Settings2, adminOnly: true, group: "Sistem" },
];

export const seedProducts: Product[] = realStockProducts;

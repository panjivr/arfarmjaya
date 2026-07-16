import {
  Archive,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  PackageCheck,
  PackagePlus,
  ReceiptText,
  ScanBarcode,
  Settings2,
  ShieldCheck,
  ShoppingCart,
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
  group: string;
};

export const navigation: NavItem[] = [
  { label: "Dasbor", href: "/", icon: LayoutDashboard, adminOnly: true, group: "Ringkasan" },
  { label: "Inventori", href: "/inventory", icon: Boxes, adminOnly: true, group: "Data Master" },
  { label: "Kategori", href: "/categories", icon: Archive, adminOnly: true, group: "Data Master" },
  { label: "Pemasok", href: "/suppliers", icon: Building2, adminOnly: true, group: "Data Master" },
  { label: "Gudang", href: "/warehouses", icon: Warehouse, adminOnly: true, group: "Data Master" },
  { label: "Manajemen Rak", href: "/racks", icon: PackageCheck, adminOnly: true, group: "Data Master" },
  { label: "Pembelian", href: "/purchase", icon: ShoppingCart, adminOnly: true, group: "Operasional" },
  { label: "Penerimaan Barang", href: "/receiving", icon: PackagePlus, adminOnly: true, group: "Operasional" },
  { label: "Barang Keluar", href: "/transactions", icon: ClipboardList, adminOnly: false, group: "Operasional" },
  { label: "Distribusi", href: "/distribution", icon: Truck, adminOnly: true, group: "Operasional" },
  { label: "Permintaan Barang", href: "/requests", icon: ClipboardCheck, adminOnly: true, group: "Operasional" },
  { label: "Stok Opname", href: "/stock-opname", icon: ScanBarcode, adminOnly: true, group: "Operasional" },
  { label: "POS Retail", href: "/pos", icon: ReceiptText, adminOnly: true, group: "Operasional" },
  { label: "Laporan", href: "/reports", icon: FileBarChart, adminOnly: true, group: "Analitik" },
  { label: "Analitik", href: "/analytics", icon: BarChart3, adminOnly: true, group: "Analitik" },
  { label: "Notifikasi", href: "/notifications", icon: Bell, adminOnly: true, group: "Sistem" },
  { label: "Log Audit", href: "/audit-log", icon: ShieldCheck, adminOnly: true, group: "Sistem" },
  { label: "Pengguna & Role", href: "/users", icon: Users, adminOnly: true, group: "Sistem" },
  { label: "Pengaturan", href: "/settings", icon: Settings2, adminOnly: true, group: "Sistem" },
];

export const seedProducts: Product[] = realStockProducts;

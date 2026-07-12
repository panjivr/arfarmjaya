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

export const navigation = [
  { label: "Dasbor", href: "/", icon: LayoutDashboard, adminOnly: true },
  { label: "Inventori", href: "/inventory", icon: Boxes, adminOnly: true },
  { label: "Kategori", href: "/categories", icon: Archive, adminOnly: true },
  { label: "Pemasok", href: "/suppliers", icon: Building2, adminOnly: true },
  { label: "Gudang", href: "/warehouses", icon: Warehouse, adminOnly: true },
  { label: "Manajemen Rak", href: "/racks", icon: PackageCheck, adminOnly: true },
  { label: "Pembelian", href: "/purchase", icon: ShoppingCart, adminOnly: true },
  { label: "Penerimaan Barang", href: "/receiving", icon: PackagePlus, adminOnly: true },
  { label: "Barang Keluar", href: "/transactions", icon: ClipboardList, adminOnly: false },
  { label: "Distribusi", href: "/distribution", icon: Truck, adminOnly: true },
  { label: "Permintaan Barang", href: "/requests", icon: ClipboardCheck, adminOnly: true },
  { label: "Stok Opname", href: "/stock-opname", icon: ScanBarcode, adminOnly: true },
  { label: "POS Retail", href: "/pos", icon: ReceiptText, adminOnly: true },
  { label: "Laporan", href: "/reports", icon: FileBarChart, adminOnly: true },
  { label: "Pengguna & Role", href: "/users", icon: Users, adminOnly: true },
  { label: "Notifikasi", href: "/notifications", icon: Bell, adminOnly: true },
  { label: "Log Audit", href: "/audit-log", icon: ShieldCheck, adminOnly: true },
  { label: "Analitik", href: "/analytics", icon: BarChart3, adminOnly: true },
  { label: "Pengaturan", href: "/settings", icon: Settings2, adminOnly: true },
];

export const products: Product[] = realStockProducts;

const inventoryValue = products.reduce((total, product) => total + product.currentStock * product.purchasePrice, 0);
const lowStockCount = products.filter((product) => product.status === "Stok Rendah").length;
const emptyStockCount = products.filter((product) => product.status === "Habis").length;
const incomingTotal = products.reduce((total, product) => total + (product.stockIn ?? 0), 0);
const outgoingTotal = products.reduce((total, product) => total + (product.stockOut ?? 0), 0);
const missingPriceCount = products.filter((product) => product.purchasePrice === 0).length;

export const metrics = [
  { label: "Nilai Inventori", value: inventoryValue, change: "berdasarkan HPP" },
  { label: "Total Produk", value: products.length, change: "data real Excel" },
  { label: "Stok Rendah", value: lowStockCount, change: "stok <= 5" },
  { label: "Stok Habis", value: emptyStockCount, change: "perlu restok" },
  { label: "Barang Masuk", value: incomingTotal, change: "dari kolom Masuk" },
  { label: "Barang Keluar", value: outgoingTotal, change: "dari kolom Keluar" },
  { label: "HPP Kosong", value: missingPriceCount, change: "perlu dilengkapi" },
  { label: "Gudang", value: 1, change: "Gudang Bahan Baku" },
];

export const inventoryTrend = [
  { month: "Jan", value: 1.9, purchase: 320, revenue: 430 },
  { month: "Feb", value: 2.1, purchase: 380, revenue: 460 },
  { month: "Mar", value: 2.0, purchase: 350, revenue: 510 },
  { month: "Apr", value: 2.4, purchase: 410, revenue: 540 },
  { month: "May", value: 2.6, purchase: 460, revenue: 620 },
  { month: "Jun", value: 2.7, purchase: 490, revenue: 690 },
  { month: "Jul", value: 2.85, purchase: 530, revenue: 735 },
];

export const distributionTrend = [
  { status: "Picking", orders: 18 },
  { status: "Packing", orders: 13 },
  { status: "Muat", orders: 8 },
  { status: "Dikirim", orders: 21 },
  { status: "Terkirim", orders: 44 },
];

export const moduleSummaries = {
  categories: ["Bahan Baku", "Kemasan", "Operasional"],
  suppliers: ["Data Stock Gudang ARFARM"],
  warehouses: ["Gudang Bahan Baku"],
  racks: ["BB-01-01"],
  roles: ["Admin Utama", "Administrator", "Manajer Gudang", "Staf Gudang", "Pembelian", "Kasir", "Driver", "Viewer"],
};

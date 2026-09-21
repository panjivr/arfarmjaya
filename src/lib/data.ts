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
  Fish,
  NotebookPen,
  Calculator,
  Waves,
  Wallet,
  ArrowLeftRight,
  History,
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
  // Beranda per ruang kerja (visibilitas diatur RBAC via canAccessPath).
  { label: "Dasbor", href: "/dashboard", icon: LayoutDashboard, adminOnly: true, group: "" },
  { label: "Dashboard Gudang", href: "/gudang", icon: Warehouse, adminOnly: false, group: "" },
  { label: "Dashboard Reporting", href: "/reporting", icon: FileBarChart, adminOnly: false, group: "" },

  { label: "Monitoring Kolam", href: "/lele", icon: Fish, adminOnly: false, group: "Budidaya Lele" },
  { label: "Kolam & Tebar", href: "/lele/kolam", icon: Waves, adminOnly: false, group: "Budidaya Lele" },
  { label: "Jurnal Lele", href: "/lele/jurnal", icon: NotebookPen, adminOnly: false, group: "Budidaya Lele" },
  { label: "Mutasi & Sortir", href: "/lele/mutasi", icon: ArrowLeftRight, adminOnly: false, group: "Budidaya Lele" },
  { label: "Bekas Panen", href: "/lele/bekas-panen", icon: History, adminOnly: false, group: "Budidaya Lele" },
  { label: "Keuangan Lele", href: "/lele/keuangan", icon: Wallet, adminOnly: false, group: "Budidaya Lele" },
  { label: "Simulator Lele", href: "/lele/simulator", icon: Calculator, adminOnly: false, group: "Budidaya Lele" },

  { label: "Inventori", href: "/inventory", icon: Boxes, adminOnly: false, group: "Operasional" },
  { label: "Barang Keluar", href: "/transactions", icon: ClipboardList, adminOnly: false, group: "Operasional" },
  { label: "Pembelian", href: "/purchase", icon: ShoppingCart, adminOnly: false, group: "Operasional" },
  { label: "Penerimaan Barang", href: "/receiving", icon: PackagePlus, adminOnly: false, group: "Operasional" },
  { label: "Distribusi", href: "/distribution", icon: Truck, adminOnly: false, group: "Operasional" },
  { label: "Permintaan Barang", href: "/requests", icon: ClipboardCheck, adminOnly: false, group: "Operasional" },
  { label: "Stok Opname", href: "/stock-opname", icon: ScanBarcode, adminOnly: false, group: "Operasional" },

  { label: "Kategori", href: "/categories", icon: Archive, adminOnly: false, group: "Master Data" },
  { label: "Pemasok", href: "/suppliers", icon: Building2, adminOnly: false, group: "Master Data" },
  { label: "Gudang", href: "/warehouses", icon: Warehouse, adminOnly: false, group: "Master Data" },
  { label: "Manajemen Rak", href: "/racks", icon: PackageCheck, adminOnly: false, group: "Master Data" },

  { label: "Laporan Mingguan", href: "/weekly-report", icon: Sprout, adminOnly: false, group: "Laporan" },
  { label: "Laporan Stok", href: "/reports", icon: FileBarChart, adminOnly: false, group: "Laporan" },
  { label: "Analitik", href: "/analytics", icon: BarChart3, adminOnly: false, group: "Laporan" },

  { label: "POS Retail", href: "/pos", icon: ReceiptText, adminOnly: true, group: "Penjualan" },
  { label: "Toko", href: "/stores", icon: Store, adminOnly: true, group: "Penjualan" },
  { label: "Invoice", href: "/invoices", icon: FileText, adminOnly: true, group: "Penjualan" },

  { label: "Role & Akses", href: "/users", icon: Users, adminOnly: true, group: "Administrasi" },
  { label: "Log Audit", href: "/audit-log", icon: ShieldCheck, adminOnly: true, group: "Administrasi" },
  { label: "Notifikasi", href: "/notifications", icon: Bell, adminOnly: true, group: "Administrasi" },
  { label: "Pengaturan", href: "/settings", icon: Settings2, adminOnly: true, group: "Administrasi" },
];

export const seedProducts: Product[] = realStockProducts;

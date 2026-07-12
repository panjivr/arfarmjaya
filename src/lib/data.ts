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
  rack: string;
  warehouse: string;
  supplier: string;
  batch: string;
  expirationDate: string;
  status: "Tersedia" | "Stok Rendah" | "Hampir Kedaluwarsa" | "Karantina";
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

export const products: Product[] = [
  {
    sku: "AFJ-FEED-001",
    barcode: "8997001200011",
    name: "Pakan Layer Premium 50kg",
    category: "Pakan",
    brand: "AR Select",
    unit: "Karung",
    purchasePrice: 315000,
    retailPrice: 345000,
    minStock: 80,
    maxStock: 420,
    currentStock: 312,
    rack: "A-01-01",
    warehouse: "Gudang Kering",
    supplier: "PT Agro Nutrisi Prima",
    batch: "B2407-LF",
    expirationDate: "2026-11-20",
    status: "Tersedia",
  },
  {
    sku: "AFJ-MED-014",
    barcode: "8997001200141",
    name: "Konsentrat Vitamin Unggas",
    category: "Veteriner",
    brand: "VitaFarm",
    unit: "Botol",
    purchasePrice: 47000,
    retailPrice: 65000,
    minStock: 120,
    maxStock: 800,
    currentStock: 64,
    rack: "C-03-08",
    warehouse: "Gudang Kimia",
    supplier: "CV Sehat Ternak",
    batch: "VT2603",
    expirationDate: "2026-08-12",
    status: "Stok Rendah",
  },
  {
    sku: "AFJ-EGG-030",
    barcode: "8997001200301",
    name: "Telur Grade A per Tray",
    category: "Retail",
    brand: "AR Farm Jaya",
    unit: "Tray",
    purchasePrice: 44000,
    retailPrice: 52000,
    minStock: 50,
    maxStock: 280,
    currentStock: 138,
    rack: "CS-02-04",
    warehouse: "Gudang Dingin",
    supplier: "Peternakan Internal",
    batch: "EGG-120726",
    expirationDate: "2026-07-24",
    status: "Hampir Kedaluwarsa",
  },
  {
    sku: "AFJ-PKG-006",
    barcode: "8997001200066",
    name: "Karton Telur Cetak 12pcs",
    category: "Kemasan",
    brand: "PackPro",
    unit: "Bundel",
    purchasePrice: 85000,
    retailPrice: 112000,
    minStock: 40,
    maxStock: 260,
    currentStock: 211,
    rack: "P-04-02",
    warehouse: "Gudang Kemasan",
    supplier: "PT Kemasan Nusantara",
    batch: "PKG-2627",
    expirationDate: "2028-01-01",
    status: "Tersedia",
  },
  {
    sku: "AFJ-BIO-021",
    barcode: "8997001200219",
    name: "Disinfektan Biosecurity",
    category: "Kimia",
    brand: "CleanCoop",
    unit: "Jeriken",
    purchasePrice: 128000,
    retailPrice: 159000,
    minStock: 60,
    maxStock: 340,
    currentStock: 18,
    rack: "Q-01-06",
    warehouse: "Gudang Kimia",
    supplier: "PT Sanitasi Farmasi",
    batch: "BIO-Q2607",
    expirationDate: "2027-02-16",
    status: "Karantina",
  },
];

export const metrics = [
  { label: "Nilai Inventori", value: 2845000000, change: "+12.4%" },
  { label: "Total Produk", value: 1284, change: "+36 SKU" },
  { label: "Stok Rendah", value: 27, change: "-8 hari ini" },
  { label: "Hampir Kedaluwarsa", value: 14, change: "7 hari" },
  { label: "Pesanan Pembelian", value: 18, change: "5 menunggu" },
  { label: "Barang Masuk Hari Ini", value: 42, change: "penerimaan" },
  { label: "Barang Keluar Hari Ini", value: 67, change: "pengeluaran" },
  { label: "Penjualan Retail", value: 38600000, change: "+9.1%" },
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
  categories: ["Pakan", "Veteriner", "Retail", "Kemasan", "Kimia"],
  suppliers: ["PT Agro Nutrisi Prima", "CV Sehat Ternak", "PT Kemasan Nusantara", "PT Sanitasi Farmasi"],
  warehouses: ["Gudang Utama", "Gudang Dingin", "Gudang Kering", "Gudang Kimia", "Gudang Kemasan"],
  racks: ["A-01-01", "A-01-02", "CS-02-04", "C-03-08", "P-04-02", "Q-01-06"],
  roles: ["Admin Utama", "Administrator", "Manajer Gudang", "Staf Gudang", "Pembelian", "Kasir", "Driver", "Viewer"],
};

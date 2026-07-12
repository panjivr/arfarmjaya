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
  status: "Available" | "Low Stock" | "Expiring" | "Quarantine";
};

export const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Inventory", href: "/inventory", icon: Boxes },
  { label: "Categories", href: "/categories", icon: Archive },
  { label: "Suppliers", href: "/suppliers", icon: Building2 },
  { label: "Warehouses", href: "/warehouses", icon: Warehouse },
  { label: "Rack Management", href: "/racks", icon: PackageCheck },
  { label: "Purchase", href: "/purchase", icon: ShoppingCart },
  { label: "Receiving Goods", href: "/receiving", icon: PackagePlus },
  { label: "Transactions", href: "/transactions", icon: ClipboardList },
  { label: "Distribution", href: "/distribution", icon: Truck },
  { label: "Request Goods", href: "/requests", icon: ClipboardCheck },
  { label: "Stock Opname", href: "/stock-opname", icon: ScanBarcode },
  { label: "Retail POS", href: "/pos", icon: ReceiptText },
  { label: "Reports", href: "/reports", icon: FileBarChart },
  { label: "Users & Roles", href: "/users", icon: Users },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Audit Log", href: "/audit-log", icon: ShieldCheck },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

export const products: Product[] = [
  {
    sku: "AFJ-FEED-001",
    barcode: "8997001200011",
    name: "Premium Layer Feed 50kg",
    category: "Feed",
    brand: "AR Select",
    unit: "Bag",
    purchasePrice: 315000,
    retailPrice: 345000,
    minStock: 80,
    maxStock: 420,
    currentStock: 312,
    rack: "A-01-01",
    warehouse: "Dry Storage",
    supplier: "PT Agro Nutrisi Prima",
    batch: "B2407-LF",
    expirationDate: "2026-11-20",
    status: "Available",
  },
  {
    sku: "AFJ-MED-014",
    barcode: "8997001200141",
    name: "Poultry Vitamin Concentrate",
    category: "Veterinary",
    brand: "VitaFarm",
    unit: "Bottle",
    purchasePrice: 47000,
    retailPrice: 65000,
    minStock: 120,
    maxStock: 800,
    currentStock: 64,
    rack: "C-03-08",
    warehouse: "Chemical Storage",
    supplier: "CV Sehat Ternak",
    batch: "VT2603",
    expirationDate: "2026-08-12",
    status: "Low Stock",
  },
  {
    sku: "AFJ-EGG-030",
    barcode: "8997001200301",
    name: "Grade A Eggs Tray",
    category: "Retail",
    brand: "AR Farm Jaya",
    unit: "Tray",
    purchasePrice: 44000,
    retailPrice: 52000,
    minStock: 50,
    maxStock: 280,
    currentStock: 138,
    rack: "CS-02-04",
    warehouse: "Cold Storage",
    supplier: "Internal Farm",
    batch: "EGG-120726",
    expirationDate: "2026-07-24",
    status: "Expiring",
  },
  {
    sku: "AFJ-PKG-006",
    barcode: "8997001200066",
    name: "Printed Egg Carton 12pcs",
    category: "Packaging",
    brand: "PackPro",
    unit: "Bundle",
    purchasePrice: 85000,
    retailPrice: 112000,
    minStock: 40,
    maxStock: 260,
    currentStock: 211,
    rack: "P-04-02",
    warehouse: "Packaging Storage",
    supplier: "PT Kemasan Nusantara",
    batch: "PKG-2627",
    expirationDate: "2028-01-01",
    status: "Available",
  },
  {
    sku: "AFJ-BIO-021",
    barcode: "8997001200219",
    name: "Biosecurity Disinfectant",
    category: "Chemical",
    brand: "CleanCoop",
    unit: "Can",
    purchasePrice: 128000,
    retailPrice: 159000,
    minStock: 60,
    maxStock: 340,
    currentStock: 18,
    rack: "Q-01-06",
    warehouse: "Chemical Storage",
    supplier: "PT Sanitasi Farmasi",
    batch: "BIO-Q2607",
    expirationDate: "2027-02-16",
    status: "Quarantine",
  },
];

export const metrics = [
  { label: "Inventory Value", value: 2845000000, change: "+12.4%" },
  { label: "Total Products", value: 1284, change: "+36 SKU" },
  { label: "Low Stock Items", value: 27, change: "-8 today" },
  { label: "Expiring Products", value: 14, change: "7 days" },
  { label: "Purchase Orders", value: 18, change: "5 pending" },
  { label: "Incoming Today", value: 42, change: "receipts" },
  { label: "Outgoing Today", value: 67, change: "shipments" },
  { label: "Retail Sales", value: 38600000, change: "+9.1%" },
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
  { status: "Loading", orders: 8 },
  { status: "Shipping", orders: 21 },
  { status: "Delivered", orders: 44 },
];

export const moduleSummaries = {
  categories: ["Feed", "Veterinary", "Retail", "Packaging", "Chemical"],
  suppliers: ["PT Agro Nutrisi Prima", "CV Sehat Ternak", "PT Kemasan Nusantara", "PT Sanitasi Farmasi"],
  warehouses: ["Main Warehouse", "Cold Storage", "Dry Storage", "Chemical Storage", "Packaging Storage"],
  racks: ["A-01-01", "A-01-02", "CS-02-04", "C-03-08", "P-04-02", "Q-01-06"],
  roles: ["Owner", "Administrator", "Warehouse Manager", "Warehouse Staff", "Purchasing", "Cashier", "Driver", "Viewer"],
};

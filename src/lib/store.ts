"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/data";
import { realStockProducts } from "@/lib/stock-products";
import type {
  AppSettings,
  AuditEntry,
  Category,
  Distribution,
  Invoice,
  InvoiceLine,
  ItemRequest,
  ManagedUser,
  OpnameSession,
  OrderLine,
  OrderStatus,
  PaymentMethod,
  PosSale,
  PurchaseOrder,
  Pond,
  PondType,
  PondKind,
  FishCycle,
  PondDailyLog,
  PondHarvest,
  PondJournal,
  CycleStatus,
  LeleSale,
  Receivable,
  Payable,
  PaymentEntry,
  PayMethod,
  FinanceTx,
  FinanceCategory,
  LeleMovement,
  LeleMoveType,
  SortirKategori,
  Rack,
  Receipt,
  ReportProfile,
  Role,
  SessionUser,
  StockMovement,
  Store,
  Supplier,
  Warehouse,
  WeeklyActivity,
  WeeklyReport,
} from "@/lib/types";

export type { Role, SessionUser } from "@/lib/types";

const now = () => new Date().toISOString();
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
const stamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
};
const seq = (n: number) => String(n + 1).padStart(4, "0");
const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const currencyStr = (n: number) => rupiah.format(Math.round(n) || 0);

// Kunci data bisnis yang ikut dicadangkan/dipulihkan (sama dengan data ter-sync).
const BACKUP_KEYS = [
  "products", "movements", "categories", "suppliers", "warehouses", "racks", "users",
  "purchaseOrders", "receipts", "distributions", "requests", "opnameSessions", "posSales",
  "stores", "invoices", "reportProfiles", "weeklyReports",
  "ponds", "fishCycles", "pondLogs", "pondHarvests", "pondJournals",
  "leleSales", "receivables", "payables", "financeTx", "financeCategories", "leleMovements",
  "auditLog", "settings",
] as const;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "id"));
}

function seedCategories(products: Product[]): Category[] {
  return unique(products.map((p) => p.category)).map((name) => ({ id: uid(), name, createdAt: now() }));
}
function seedSuppliers(products: Product[]): Supplier[] {
  return unique(products.map((p) => p.supplier)).map((name) => ({ id: uid(), name, createdAt: now() }));
}
function seedWarehouses(products: Product[]): Warehouse[] {
  return unique(products.map((p) => p.warehouse)).map((name) => ({ id: uid(), name, createdAt: now() }));
}
function seedRacks(products: Product[]): Rack[] {
  const map = new Map<string, string>();
  products.forEach((p) => {
    if (p.rack && !map.has(p.rack)) map.set(p.rack, p.warehouse);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([code, warehouse]) => ({ id: uid(), code, name: code, warehouse, createdAt: now() }));
}

const seedUsers: ManagedUser[] = [
  { id: uid(), name: "Admin Utama", username: "admin", role: "admin", active: true, createdAt: now() },
  { id: uid(), name: "Karyawan Gudang", username: "karyawan", role: "karyawan", active: true, createdAt: now() },
];

const seedStores: Store[] = [
  {
    id: uid(),
    name: "AR FARM JAYA",
    address: "Gudang Bahan Baku, Ponorogo",
    phone: "-",
    email: "",
    bankInfo: "BNI 0000000000 a.n. AR FARM JAYA",
    invoicePrefix: "INV",
    signatureName: "AR FARM JAYA",
    note: "Barang yang sudah dibeli tidak bisa ditukar atau dikembalikan.",
    accent: "#007a4b",
    createdAt: now(),
  },
];

const seedReportProfiles: ReportProfile[] = [
  {
    id: uid(),
    name: "Sinergi Titian Harapan — Penanaman Kedelai",
    organization: "YAYASAN SINERGI TITIAN HARAPAN",
    tagline: "Strengthening Communities",
    program: "Program Pemberdayaan Pertanian — Penanaman Kedelai",
    address: "",
    phone: "",
    email: "",
    logo: "/report-logo-sinergi.png",
    accent: "#c0201c",
    reportTitle: "LAPORAN PELAKSANAAN MINGGUAN PENANAMAN KEDELAI",
    currencyLabel: "Nominal (Rp)",
    signaturePlace: "",
    signatureRole: "Pelaksana / Penyuluh",
    signatureName: "",
    signatureId: "",
    approverRole: "",
    approverName: "",
    approverId: "",
    notes: [
      "Umur HST = umur tanaman dihitung sejak Hari Setelah Tanam (mis. 0, 7, 14 HST).",
      "Kolom Nominal (Rp) diisi angka saja; total terhitung otomatis oleh sistem.",
      "Foto kegiatan diunggah pada tiap baris kegiatan dan ikut tercetak di kolom terakhir.",
    ],
    showHst: true,
    showAmount: true,
    showOutput: true,
    showPhoto: true,
    showPayment: true,
    showSummary: true,
    showNotes: true,
    autoFit: true,
    minRows: 8,
    createdAt: now(),
  },
];

const defaultSettings: AppSettings = {
  companyName: "ARFARM BHINNEKA NUSA JAYA",
  address: "Gudang Bahan Baku",
  phone: "-",
  taxNumber: "-",
  lowStockThreshold: 5,
  expiryWarningDays: 30,
  currency: "IDR",
};

function statusFor(product: Product, threshold: number): Product["status"] {
  if (product.currentStock <= 0) return "Habis";
  if (product.currentStock <= Math.max(product.minStock, threshold)) return "Stok Rendah";
  const days = (new Date(product.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (product.expirationDate && days <= 30 && days >= 0) return "Hampir Kedaluwarsa";
  return "Tersedia";
}

type State = {
  hasHydrated: boolean;
  theme: "light" | "dark";
  sidebarOpen: boolean;
  commandOpen: boolean;
  user: SessionUser | null;

  products: Product[];
  movements: StockMovement[];
  categories: Category[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  racks: Rack[];
  users: ManagedUser[];
  purchaseOrders: PurchaseOrder[];
  receipts: Receipt[];
  distributions: Distribution[];
  requests: ItemRequest[];
  opnameSessions: OpnameSession[];
  posSales: PosSale[];
  stores: Store[];
  invoices: Invoice[];
  reportProfiles: ReportProfile[];
  weeklyReports: WeeklyReport[];
  ponds: Pond[];
  fishCycles: FishCycle[];
  pondLogs: PondDailyLog[];
  pondHarvests: PondHarvest[];
  pondJournals: PondJournal[];
  leleSales: LeleSale[];
  receivables: Receivable[];
  payables: Payable[];
  financeTx: FinanceTx[];
  financeCategories: FinanceCategory[];
  leleMovements: LeleMovement[];
  auditLog: AuditEntry[];
  readNotifications: string[];
  loginNoticeSeen: boolean;
  settings: AppSettings;
};

type Actions = {
  setHasHydrated: (value: boolean) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  login: (user: SessionUser) => void;
  setUser: (user: SessionUser | null) => void;
  logout: () => void;

  audit: (action: string, entity: string, detail: string) => void;

  // inventory
  addProduct: (product: Product) => void;
  updateProduct: (sku: string, patch: Partial<Product>) => void;
  deleteProduct: (sku: string) => void;
  recordMovement: (m: {
    type: StockMovement["type"];
    sku: string;
    quantity: number;
    note?: string;
    reference?: string;
  }) => { ok: boolean; message?: string };

  // master data
  addCategory: (name: string, note?: string) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  addSupplier: (data: Omit<Supplier, "id" | "createdAt">) => void;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  removeSupplier: (id: string) => void;
  addWarehouse: (data: Omit<Warehouse, "id" | "createdAt">) => void;
  updateWarehouse: (id: string, patch: Partial<Warehouse>) => void;
  removeWarehouse: (id: string) => void;
  addRack: (data: Omit<Rack, "id" | "createdAt" | "name">) => void;
  updateRack: (id: string, patch: Partial<Rack>) => void;
  removeRack: (id: string) => void;
  addUser: (data: Omit<ManagedUser, "id" | "createdAt" | "active">) => void;
  updateUser: (id: string, patch: Partial<ManagedUser>) => void;
  toggleUserActive: (id: string) => void;
  removeUser: (id: string) => void;

  // workflows
  createPurchaseOrder: (data: { supplier: string; lines: OrderLine[]; note?: string }) => void;
  setPurchaseStatus: (id: string, status: OrderStatus) => void;
  createReceipt: (data: Omit<Receipt, "id" | "number" | "actor" | "createdAt">) => void;
  createDistribution: (data: { destination: string; driver?: string; lines: OrderLine[] }) => { ok: boolean; message?: string };
  setDistributionStatus: (id: string, status: OrderStatus) => void;
  createRequest: (data: { requester: string; lines: OrderLine[]; note?: string }) => void;
  setRequestStatus: (id: string, status: OrderStatus) => void;
  createOpname: (data: { warehouse: string; lines: OpnameSession["lines"]; reason?: string }) => void;
  postOpname: (id: string) => void;
  createSale: (data: { lines: OrderLine[]; discount: number; payment: PaymentMethod; paid: number }) => { ok: boolean; message?: string };

  // retail: stores & invoices
  addStore: (data: Omit<Store, "id" | "createdAt">) => void;
  updateStore: (id: string, patch: Partial<Store>) => void;
  removeStore: (id: string) => void;
  createInvoice: (data: {
    storeId: string;
    buyer: string;
    buyerPhone?: string;
    date: string;
    number?: string;
    lines: InvoiceLine[];
    shipping: number;
    note?: string;
  }) => { ok: boolean; message?: string; invoice?: Invoice };
  deleteInvoice: (id: string) => void;

  // laporan pelaksanaan mingguan
  addReportProfile: (data: Omit<ReportProfile, "id" | "createdAt">) => ReportProfile;
  updateReportProfile: (id: string, patch: Partial<ReportProfile>) => void;
  removeReportProfile: (id: string) => { ok: boolean; message?: string };
  saveWeeklyReport: (data: {
    id?: string;
    number?: string;
    profileId: string;
    executor: string;
    group: string;
    location: string;
    week: string;
    periodStart?: string;
    periodEnd?: string;
    signPlace: string;
    signDate: string;
    activities: WeeklyActivity[];
  }) => { ok: boolean; message?: string; report?: WeeklyReport };
  duplicateWeeklyReport: (id: string) => { ok: boolean; report?: WeeklyReport };
  deleteWeeklyReport: (id: string) => void;

  // budidaya lele
  addPond: (data: Omit<Pond, "id" | "createdAt" | "active">) => { ok: boolean; message?: string; pond?: Pond };
  updatePond: (id: string, patch: Partial<Pond>) => void;
  removePond: (id: string) => { ok: boolean; message?: string };
  startCycle: (data: {
    pondId: string;
    species: string;
    stockDate: string;
    source: string;
    initialCount: number;
    sizeAtStock?: string;
    seedCostRp: number;
    otherCostRp?: number;
    targetDate?: string;
    targetWeightG?: number;
    note?: string;
  }) => { ok: boolean; message?: string; cycle?: FishCycle };
  closeCycle: (id: string, status?: CycleStatus) => void;
  addPondLog: (data: Omit<PondDailyLog, "id" | "createdAt" | "actor">) => { ok: boolean; message?: string };
  removePondLog: (id: string) => void;
  addPondHarvest: (data: Omit<PondHarvest, "id" | "createdAt" | "actor" | "revenueRp">) => { ok: boolean; message?: string };
  removePondHarvest: (id: string) => void;
  addPondJournal: (data: Omit<PondJournal, "id" | "createdAt" | "actor">) => { ok: boolean; message?: string };
  removePondJournal: (id: string) => void;
  addStandardPonds: () => { ok: boolean; added: number };

  // keuangan lele: penjualan, piutang, utang, kas
  recordSale: (data: {
    date: string;
    buyer: string;
    item: string;
    pondCode?: string;
    weightKg: number;
    pricePerKg: number;
    total?: number;
    paid: number;
    method: PayMethod;
    dueDate?: string;
    note?: string;
  }) => { ok: boolean; message?: string; sale?: LeleSale };
  removeSale: (id: string) => void;
  addReceivable: (data: Omit<Receivable, "id" | "createdAt" | "actor" | "payments"> & { payments?: PaymentEntry[] }) => { ok: boolean };
  payReceivable: (id: string, entry: Omit<PaymentEntry, "id">) => { ok: boolean; message?: string };
  removeReceivable: (id: string) => void;
  addPayable: (data: Omit<Payable, "id" | "createdAt" | "actor" | "payments"> & { payments?: PaymentEntry[] }) => { ok: boolean };
  payPayable: (id: string, entry: Omit<PaymentEntry, "id">) => { ok: boolean; message?: string };
  removePayable: (id: string) => void;
  addFinanceTx: (data: Omit<FinanceTx, "id" | "createdAt" | "actor">) => { ok: boolean; message?: string };
  removeFinanceTx: (id: string) => void;
  addFinanceCategory: (name: string, kind: FinanceCategory["kind"]) => { ok: boolean; message?: string };
  removeFinanceCategory: (id: string) => void;

  // mutasi stok lele: sortir, transfer antar-kolam (atomik), penyusutan
  recordLeleMovement: (data: { date: string; type: LeleMoveType; pondId: string; kategori?: SortirKategori; qtyKg?: number; qtyEkor?: number; note?: string }) => { ok: boolean; message?: string };
  transferLele: (data: { date: string; fromPondId: string; toPondId: string; qtyKg?: number; qtyEkor?: number; kategori?: SortirKategori; note?: string }) => { ok: boolean; message?: string };
  removeLeleMovement: (id: string) => void;

  // cadangan data (backup) & pemulihan (restore)
  exportBackup: () => string;
  importBackup: (json: string) => { ok: boolean; message?: string };

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (ids: string[]) => void;
  setLoginNoticeSeen: (value: boolean) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetData: () => void;
};

const roleLabel: Record<Role, string> = {
  admin: "Akses penuh",
  manajer: "Manajer gudang",
  gudang: "Staf gudang",
  pembelian: "Pembelian",
  kasir: "Kasir POS",
  driver: "Distribusi",
  viewer: "Hanya lihat",
  karyawan: "Barang keluar",
};

function seedLele(): { ponds: Pond[]; fishCycles: FishCycle[]; pondLogs: PondDailyLog[]; pondHarvests: PondHarvest[]; pondJournals: PondJournal[] } {
  const t = now();
  const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
  const pondA = { id: uid(), code: "A12", name: "Kolam Terpal A12", type: "Terpal" as const, areaM2: 12, active: true, createdAt: t };
  const pondB = { id: uid(), code: "B03", name: "Kolam Bioflok B03", type: "Bioflok" as const, areaM2: 10, active: true, createdAt: t };
  const pondC = { id: uid(), code: "C07", name: "Kolam Tanah C07", type: "Tanah" as const, areaM2: 25, active: true, createdAt: t };

  const cycleA: FishCycle = {
    id: uid(), pondId: pondA.id, pondCode: pondA.code, species: "Lele Sangkuriang",
    stockDate: iso(42), source: "Hatchery Mina Jaya", initialCount: 2000, sizeAtStock: "5-7 cm",
    seedCostRp: 400000, otherCostRp: 120000, targetDate: iso(-45), targetWeightG: 110,
    status: "Aktif", actor: "Sistem", createdAt: t,
  };
  const cycleB: FishCycle = {
    id: uid(), pondId: pondB.id, pondCode: pondB.code, species: "Lele Mutiara",
    stockDate: iso(18), source: "Hatchery Mina Jaya", initialCount: 3000, sizeAtStock: "4-6 cm",
    seedCostRp: 540000, otherCostRp: 150000, targetDate: iso(-60), targetWeightG: 120,
    status: "Aktif", actor: "Sistem", createdAt: t,
  };
  const mkLog = (c: FishCycle, daysAgo: number, feedKg: number, feedCostRp: number, deaths: number, avg?: number): PondDailyLog => ({
    id: uid(), cycleId: c.id, pondId: c.pondId, date: iso(daysAgo), feedKg, feedBrand: "Hi-Pro-Vite", feedType: "781-2", feedCostRp, deaths, avgWeightG: avg, actor: "Sistem", createdAt: t,
  });
  const logs: PondDailyLog[] = [
    mkLog(cycleA, 5, 22, 308000, 4, 78),
    mkLog(cycleA, 3, 24, 336000, 3),
    mkLog(cycleA, 1, 26, 364000, 2, 92),
    mkLog(cycleB, 4, 9, 126000, 12, 22),
    mkLog(cycleB, 2, 11, 154000, 8),
    mkLog(cycleB, 0, 12, 168000, 6, 28),
  ];
  const journals: PondJournal[] = [
    { id: uid(), pondId: pondA.id, pondCode: pondA.code, cycleId: cycleA.id, date: iso(3), category: "Kualitas Air", title: "Ganti air 30%", note: "Air mulai keruh, dilakukan penggantian sebagian dan penambahan probiotik.", waterTemp: 28, waterPh: 7.2, actor: "Sistem", createdAt: t },
    { id: uid(), pondId: pondB.id, pondCode: pondB.code, cycleId: cycleB.id, date: iso(1), category: "Kesehatan & Penyakit", title: "Gejala jamur ringan", note: "Beberapa benih terlihat berjamur, diberi garam ikan 0,3%.", actor: "Sistem", createdAt: t },
  ];
  return { ponds: [pondA, pondB, pondC], fishCycles: [cycleA, cycleB], pondLogs: logs, pondHarvests: [], pondJournals: journals };
}

// Kategori keuangan bawaan (bisa ditambah/hapus admin). Mencakup Bon, Ops
// Ardhi, dan Inves sesuai kebutuhan operasional AR FARM JAYA.
function seedFinanceCategories(): FinanceCategory[] {
  const t = now();
  const rows: Array<[string, FinanceCategory["kind"]]> = [
    ["Penjualan Lele", "masuk"],
    ["Pemasukan Lain", "masuk"],
    ["Pakan", "keluar"],
    ["Benih", "keluar"],
    ["Obat & Probiotik", "keluar"],
    ["Listrik & Air", "keluar"],
    ["Gaji & Tenaga Kerja", "keluar"],
    ["Perawatan Kolam", "keluar"],
    ["Bon", "keluar"],
    ["Ops Ardhi", "keluar"],
    ["Inves", "keluar"],
    ["Lain-lain", "both"],
  ];
  return rows.map(([name, kind]) => ({ id: uid(), name, kind, createdAt: t }));
}

// Daftar kolam standar AR FARM JAYA: blok produksi A/B/D/E + tampungan T1–T4.
type RosterEntry = { code: string; type: PondType; kind: PondKind };
function standardRoster(): RosterEntry[] {
  const block = (prefix: string, n: number, type: PondType, kind: PondKind): RosterEntry[] =>
    Array.from({ length: n }, (_, i) => ({ code: `${prefix}${i + 1}`, type, kind }));
  return [
    ...block("A", 7, "Terpal", "produksi"),
    ...block("B", 4, "Terpal", "produksi"),
    ...block("D", 6, "Terpal", "produksi"),
    ...block("E", 6, "Terpal", "produksi"),
    ...block("T", 4, "Terpal", "tampungan"),
  ];
}

function buildInitial(): State {
  const products = realStockProducts.map((p) => ({ ...p }));
  return {
    hasHydrated: false,
    theme: "light",
    sidebarOpen: false,
    commandOpen: false,
    user: null,
    products,
    movements: [],
    categories: seedCategories(products),
    suppliers: seedSuppliers(products),
    warehouses: seedWarehouses(products),
    racks: seedRacks(products),
    users: seedUsers,
    purchaseOrders: [],
    receipts: [],
    distributions: [],
    requests: [],
    opnameSessions: [],
    posSales: [],
    stores: seedStores,
    invoices: [],
    reportProfiles: seedReportProfiles,
    weeklyReports: [],
    ...seedLele(),
    leleSales: [],
    receivables: [],
    payables: [],
    financeTx: [],
    financeCategories: seedFinanceCategories(),
    leleMovements: [],
    auditLog: [],
    readNotifications: [],
    loginNoticeSeen: false,
    settings: defaultSettings,
  };
}

export const useUiStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...buildInitial(),

      setHasHydrated: (value) => set({ hasHydrated: value }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (open) => set({ sidebarOpen: open }),
      setCommandOpen: (open) => set({ commandOpen: open }),
      login: (user) => set({ user, loginNoticeSeen: false }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, sidebarOpen: false, commandOpen: false }),

      audit: (action, entity, detail) => {
        const actor = get().user?.name ?? "Sistem";
        set((s) => ({
          auditLog: [{ id: uid(), actor, action, entity, detail, createdAt: now() }, ...s.auditLog].slice(0, 500),
        }));
      },

      addProduct: (product) => {
        const threshold = get().settings.lowStockThreshold;
        const withStatus = { ...product, status: statusFor(product, threshold), lastUpdate: now() };
        set((s) => ({ products: [withStatus, ...s.products] }));
        get().audit("Tambah", "Produk", `${product.name} (${product.sku})`);
      },
      updateProduct: (sku, patch) => {
        const threshold = get().settings.lowStockThreshold;
        set((s) => ({
          products: s.products.map((p) => {
            if (p.sku !== sku) return p;
            const merged = { ...p, ...patch, lastUpdate: now() };
            return { ...merged, status: statusFor(merged, threshold) };
          }),
        }));
        get().audit("Ubah", "Produk", `${sku}`);
      },
      deleteProduct: (sku) => {
        set((s) => ({ products: s.products.filter((p) => p.sku !== sku) }));
        get().audit("Hapus", "Produk", sku);
      },

      recordMovement: ({ type, sku, quantity, note = "", reference }) => {
        const state = get();
        const product = state.products.find((p) => p.sku === sku);
        if (!product) return { ok: false, message: "Barang tidak ditemukan." };
        if (quantity <= 0) return { ok: false, message: "Jumlah harus lebih dari 0." };
        const isOut = type === "out" || type === "sale" || type === "transfer";
        if (isOut && quantity > product.currentStock) {
          return { ok: false, message: `Stok tidak cukup. Sisa ${product.currentStock} ${product.unit}.` };
        }

        const threshold = state.settings.lowStockThreshold;
        set((s) => ({
          products: s.products.map((p) => {
            if (p.sku !== sku) return p;
            let currentStock = p.currentStock;
            if (type === "adjust") currentStock = quantity;
            else if (isOut) currentStock -= quantity;
            else currentStock += quantity;
            const stockIn = (p.stockIn ?? 0) + (type === "in" ? quantity : 0);
            const stockOut = (p.stockOut ?? 0) + (isOut ? quantity : 0);
            const merged = { ...p, currentStock, stockIn, stockOut, lastUpdate: now() };
            return { ...merged, status: statusFor(merged, threshold) };
          }),
          movements: [
            {
              id: uid(),
              type,
              sku,
              productName: product.name,
              quantity,
              unit: product.unit,
              note,
              reference,
              actor: s.user?.name ?? "Pengguna",
              createdAt: now(),
            },
            ...s.movements,
          ].slice(0, 1000),
        }));
        const labelMap = { in: "Barang Masuk", out: "Barang Keluar", adjust: "Penyesuaian", sale: "Penjualan", transfer: "Transfer" };
        get().audit(labelMap[type], "Stok", `${product.name} ${isOut ? "-" : type === "adjust" ? "=" : "+"}${quantity} ${product.unit}`);
        return { ok: true };
      },

      addCategory: (name, note) => {
        set((s) => ({ categories: [{ id: uid(), name, note, createdAt: now() }, ...s.categories] }));
        get().audit("Tambah", "Kategori", name);
      },
      updateCategory: (id, patch) => set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      addSupplier: (data) => {
        set((s) => ({ suppliers: [{ ...data, id: uid(), createdAt: now() }, ...s.suppliers] }));
        get().audit("Tambah", "Pemasok", data.name);
      },
      updateSupplier: (id, patch) => set((s) => ({ suppliers: s.suppliers.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeSupplier: (id) => set((s) => ({ suppliers: s.suppliers.filter((x) => x.id !== id) })),

      addWarehouse: (data) => {
        set((s) => ({ warehouses: [{ ...data, id: uid(), createdAt: now() }, ...s.warehouses] }));
        get().audit("Tambah", "Gudang", data.name);
      },
      updateWarehouse: (id, patch) => set((s) => ({ warehouses: s.warehouses.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeWarehouse: (id) => set((s) => ({ warehouses: s.warehouses.filter((x) => x.id !== id) })),

      addRack: (data) => {
        set((s) => ({ racks: [{ ...data, name: data.code, id: uid(), createdAt: now() }, ...s.racks] }));
        get().audit("Tambah", "Rak", data.code);
      },
      updateRack: (id, patch) => set((s) => ({ racks: s.racks.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeRack: (id) => set((s) => ({ racks: s.racks.filter((x) => x.id !== id) })),

      addUser: (data) => {
        set((s) => ({ users: [{ ...data, id: uid(), active: true, createdAt: now() }, ...s.users] }));
        get().audit("Tambah", "Pengguna", data.name);
      },
      updateUser: (id, patch) => set((s) => ({ users: s.users.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      toggleUserActive: (id) => set((s) => ({ users: s.users.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) })),
      removeUser: (id) => set((s) => ({ users: s.users.filter((x) => x.id !== id) })),

      createPurchaseOrder: ({ supplier, lines, note }) => {
        const total = lines.reduce((t, l) => t + l.price * l.quantity, 0);
        const number = `PO-${stamp()}-${seq(get().purchaseOrders.length)}`;
        set((s) => ({
          purchaseOrders: [
            { id: uid(), number, supplier, status: "Menunggu Persetujuan", lines, total, note, actor: s.user?.name ?? "Pengguna", createdAt: now() },
            ...s.purchaseOrders,
          ],
        }));
        get().audit("Buat", "Pembelian", number);
      },
      setPurchaseStatus: (id, status) => {
        set((s) => ({ purchaseOrders: s.purchaseOrders.map((p) => (p.id === id ? { ...p, status } : p)) }));
        const po = get().purchaseOrders.find((p) => p.id === id);
        get().audit("Status", "Pembelian", `${po?.number ?? id} → ${status}`);
      },

      createReceipt: (data) => {
        const number = `GRN-${stamp()}-${seq(get().receipts.length)}`;
        set((s) => ({
          receipts: [{ ...data, id: uid(), number, actor: s.user?.name ?? "Pengguna", createdAt: now() }, ...s.receipts],
        }));
        get().recordMovement({ type: "in", sku: data.sku, quantity: data.quantity, note: `Penerimaan ${number}`, reference: number });
      },

      createDistribution: ({ destination, driver, lines }) => {
        const state = get();
        for (const line of lines) {
          const product = state.products.find((p) => p.sku === line.sku);
          if (!product || line.quantity > product.currentStock) {
            return { ok: false, message: `Stok ${line.name} tidak cukup.` };
          }
        }
        const number = `DO-${stamp()}-${seq(state.distributions.length)}`;
        set((s) => ({
          distributions: [
            { id: uid(), number, destination, driver, status: "Diproses", lines, actor: s.user?.name ?? "Pengguna", createdAt: now() },
            ...s.distributions,
          ],
        }));
        lines.forEach((line) =>
          get().recordMovement({ type: "out", sku: line.sku, quantity: line.quantity, note: `Distribusi ${number} → ${destination}`, reference: number }),
        );
        return { ok: true };
      },
      setDistributionStatus: (id, status) => {
        set((s) => ({ distributions: s.distributions.map((d) => (d.id === id ? { ...d, status } : d)) }));
        const d = get().distributions.find((x) => x.id === id);
        get().audit("Status", "Distribusi", `${d?.number ?? id} → ${status}`);
      },

      createRequest: ({ requester, lines, note }) => {
        const number = `REQ-${stamp()}-${seq(get().requests.length)}`;
        set((s) => ({
          requests: [
            { id: uid(), number, requester, status: "Menunggu Persetujuan", lines, note, actor: s.user?.name ?? "Pengguna", createdAt: now() },
            ...s.requests,
          ],
        }));
        get().audit("Buat", "Permintaan", number);
      },
      setRequestStatus: (id, status) => {
        const req = get().requests.find((r) => r.id === id);
        set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)) }));
        if (status === "Selesai" && req) {
          req.lines.forEach((line) =>
            get().recordMovement({ type: "out", sku: line.sku, quantity: line.quantity, note: `Permintaan ${req.number}`, reference: req.number }),
          );
        }
        get().audit("Status", "Permintaan", `${req?.number ?? id} → ${status}`);
      },

      createOpname: ({ warehouse, lines, reason }) => {
        const number = `OPN-${stamp()}-${seq(get().opnameSessions.length)}`;
        set((s) => ({
          opnameSessions: [
            { id: uid(), number, warehouse, status: "Draft", lines, reason, actor: s.user?.name ?? "Pengguna", createdAt: now() },
            ...s.opnameSessions,
          ],
        }));
        get().audit("Buat", "Stok Opname", number);
      },
      postOpname: (id) => {
        const session = get().opnameSessions.find((o) => o.id === id);
        if (!session || session.status === "Diposting") return;
        session.lines.forEach((line) => {
          if (line.actualStock !== line.systemStock) {
            get().recordMovement({ type: "adjust", sku: line.sku, quantity: line.actualStock, note: `Opname ${session.number}`, reference: session.number });
          }
        });
        set((s) => ({ opnameSessions: s.opnameSessions.map((o) => (o.id === id ? { ...o, status: "Diposting" } : o)) }));
        get().audit("Posting", "Stok Opname", session.number);
      },

      createSale: ({ lines, discount, payment, paid }) => {
        const state = get();
        for (const line of lines) {
          const product = state.products.find((p) => p.sku === line.sku);
          if (!product || line.quantity > product.currentStock) {
            return { ok: false, message: `Stok ${line.name} tidak cukup.` };
          }
        }
        const subtotal = lines.reduce((t, l) => t + l.price * l.quantity, 0);
        const total = Math.max(subtotal - discount, 0);
        const number = `POS-${stamp()}-${seq(state.posSales.length)}`;
        set((s) => ({
          posSales: [
            { id: uid(), number, lines, subtotal, discount, total, payment, paid, change: Math.max(paid - total, 0), actor: s.user?.name ?? "Kasir", createdAt: now() },
            ...s.posSales,
          ],
        }));
        lines.forEach((line) =>
          get().recordMovement({ type: "sale", sku: line.sku, quantity: line.quantity, note: `POS ${number}`, reference: number }),
        );
        return { ok: true };
      },

      addStore: (data) => {
        set((s) => ({ stores: [...s.stores, { ...data, id: uid(), createdAt: now() }] }));
        get().audit("Tambah", "Toko", data.name);
      },
      updateStore: (id, patch) => {
        set((s) => ({ stores: s.stores.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
        get().audit("Ubah", "Toko", get().stores.find((x) => x.id === id)?.name ?? id);
      },
      removeStore: (id) => {
        const name = get().stores.find((x) => x.id === id)?.name ?? id;
        set((s) => ({ stores: s.stores.filter((x) => x.id !== id) }));
        get().audit("Hapus", "Toko", name);
      },
      createInvoice: ({ storeId, buyer, buyerPhone, date, number, lines, shipping, note }) => {
        const store = get().stores.find((x) => x.id === storeId);
        if (!store) return { ok: false, message: "Toko tidak ditemukan." };
        if (!buyer.trim()) return { ok: false, message: "Nama pembeli wajib diisi." };
        if (lines.length === 0) return { ok: false, message: "Tambahkan minimal satu barang." };
        const subtotal = lines.reduce((t, l) => t + l.price * l.quantity, 0);
        const total = subtotal + (shipping || 0);
        const invNumber = number?.trim() || `${store.invoicePrefix}${seq(get().invoices.length)}`;
        const invoice: Invoice = {
          id: uid(),
          number: invNumber,
          storeId,
          storeName: store.name,
          buyer: buyer.trim(),
          buyerPhone,
          date,
          lines,
          subtotal,
          shipping: shipping || 0,
          total,
          note: note ?? store.note,
          createdAt: now(),
        };
        set((s) => ({ invoices: [invoice, ...s.invoices] }));
        get().audit("Buat", "Invoice", `${invNumber} · ${buyer}`);
        return { ok: true, invoice };
      },
      deleteInvoice: (id) => {
        const inv = get().invoices.find((x) => x.id === id);
        set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) }));
        get().audit("Hapus", "Invoice", inv?.number ?? id);
      },

      addReportProfile: (data) => {
        const profile: ReportProfile = { ...data, id: uid(), createdAt: now() };
        set((s) => ({ reportProfiles: [...s.reportProfiles, profile] }));
        get().audit("Tambah", "Profil Laporan", profile.name);
        return profile;
      },
      updateReportProfile: (id, patch) => {
        set((s) => ({ reportProfiles: s.reportProfiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
        get().audit("Ubah", "Profil Laporan", get().reportProfiles.find((p) => p.id === id)?.name ?? id);
      },
      removeReportProfile: (id) => {
        const profile = get().reportProfiles.find((p) => p.id === id);
        if (!profile) return { ok: false, message: "Profil tidak ditemukan." };
        if (get().reportProfiles.length <= 1) return { ok: false, message: "Minimal satu profil harus tersedia." };
        if (get().weeklyReports.some((r) => r.profileId === id)) {
          return { ok: false, message: "Profil masih dipakai laporan tersimpan." };
        }
        set((s) => ({ reportProfiles: s.reportProfiles.filter((p) => p.id !== id) }));
        get().audit("Hapus", "Profil Laporan", profile.name);
        return { ok: true };
      },

      saveWeeklyReport: (data) => {
        const profile = get().reportProfiles.find((p) => p.id === data.profileId);
        if (!profile) return { ok: false, message: "Profil laporan tidak ditemukan." };
        if (!data.executor.trim()) return { ok: false, message: "Nama pelaksana / penyuluh wajib diisi." };
        const activities = data.activities.filter((a) => a.activity.trim() || a.purpose.trim() || a.output.trim() || a.amount > 0);
        if (activities.length === 0) return { ok: false, message: "Tambahkan minimal satu kegiatan." };

        const total = activities.reduce((t, a) => t + (Number(a.amount) || 0), 0);
        const existing = data.id ? get().weeklyReports.find((r) => r.id === data.id) : undefined;
        const report: WeeklyReport = {
          id: existing?.id ?? uid(),
          number: data.number?.trim() || existing?.number || `LPM-${stamp()}-${seq(get().weeklyReports.length)}`,
          profileId: profile.id,
          profileName: profile.name,
          executor: data.executor.trim(),
          group: data.group.trim(),
          location: data.location.trim(),
          week: data.week.trim(),
          periodStart: data.periodStart || undefined,
          periodEnd: data.periodEnd || undefined,
          signPlace: data.signPlace.trim(),
          signDate: data.signDate,
          activities,
          total,
          actor: existing?.actor ?? get().user?.name ?? "Pengguna",
          createdAt: existing?.createdAt ?? now(),
          updatedAt: now(),
        };
        set((s) => ({
          weeklyReports: existing
            ? s.weeklyReports.map((r) => (r.id === report.id ? report : r))
            : [report, ...s.weeklyReports],
        }));
        get().audit(existing ? "Ubah" : "Buat", "Laporan Mingguan", `${report.number} · ${report.executor}`);
        return { ok: true, report };
      },
      duplicateWeeklyReport: (id) => {
        const source = get().weeklyReports.find((r) => r.id === id);
        if (!source) return { ok: false };
        const copy: WeeklyReport = {
          ...source,
          id: uid(),
          number: `LPM-${stamp()}-${seq(get().weeklyReports.length)}`,
          activities: source.activities.map((a) => ({ ...a, id: uid() })),
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ weeklyReports: [copy, ...s.weeklyReports] }));
        get().audit("Duplikat", "Laporan Mingguan", `${source.number} → ${copy.number}`);
        return { ok: true, report: copy };
      },
      deleteWeeklyReport: (id) => {
        const report = get().weeklyReports.find((r) => r.id === id);
        set((s) => ({ weeklyReports: s.weeklyReports.filter((r) => r.id !== id) }));
        get().audit("Hapus", "Laporan Mingguan", report?.number ?? id);
      },

      // ── budidaya lele ───────────────────────────────────────────────────
      addPond: (data) => {
        const code = data.code.trim();
        if (!code) return { ok: false, message: "Kode kolam wajib diisi." };
        if (get().ponds.some((p) => p.code.toLowerCase() === code.toLowerCase())) {
          return { ok: false, message: `Kode kolam "${code}" sudah dipakai.` };
        }
        const pond: Pond = { ...data, code, id: uid(), active: true, createdAt: now() };
        set((s) => ({ ponds: [...s.ponds, pond] }));
        get().audit("Tambah", "Kolam Lele", `${pond.code}${pond.name ? ` · ${pond.name}` : ""}`);
        return { ok: true, pond };
      },
      updatePond: (id, patch) => {
        set((s) => ({ ponds: s.ponds.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
        get().audit("Ubah", "Kolam Lele", get().ponds.find((p) => p.id === id)?.code ?? id);
      },
      removePond: (id) => {
        const pond = get().ponds.find((p) => p.id === id);
        if (!pond) return { ok: false, message: "Kolam tidak ditemukan." };
        if (get().fishCycles.some((c) => c.pondId === id && c.status === "Aktif")) {
          return { ok: false, message: "Kolam masih punya siklus aktif. Tutup/panen dulu." };
        }
        set((s) => ({ ponds: s.ponds.filter((p) => p.id !== id) }));
        get().audit("Hapus", "Kolam Lele", pond.code);
        return { ok: true };
      },
      startCycle: (data) => {
        const pond = get().ponds.find((p) => p.id === data.pondId);
        if (!pond) return { ok: false, message: "Kolam tidak ditemukan." };
        if (get().fishCycles.some((c) => c.pondId === data.pondId && c.status === "Aktif")) {
          return { ok: false, message: "Kolam ini sedang ada siklus aktif." };
        }
        if (!(data.initialCount > 0)) return { ok: false, message: "Jumlah benih harus lebih dari 0." };
        const cycle: FishCycle = {
          id: uid(),
          pondId: pond.id,
          pondCode: pond.code,
          species: data.species.trim() || "Lele",
          stockDate: data.stockDate,
          source: data.source.trim(),
          initialCount: data.initialCount,
          sizeAtStock: data.sizeAtStock,
          seedCostRp: data.seedCostRp || 0,
          otherCostRp: data.otherCostRp || 0,
          targetDate: data.targetDate,
          targetWeightG: data.targetWeightG,
          status: "Aktif",
          note: data.note,
          actor: get().user?.name ?? "Pengguna",
          createdAt: now(),
        };
        set((s) => ({ fishCycles: [cycle, ...s.fishCycles] }));
        get().audit("Tebar Benih", "Kolam Lele", `${pond.code} · ${cycle.initialCount} ekor ${cycle.species}`);
        return { ok: true, cycle };
      },
      closeCycle: (id, status = "Selesai") => {
        const cycle = get().fishCycles.find((c) => c.id === id);
        set((s) => ({ fishCycles: s.fishCycles.map((c) => (c.id === id ? { ...c, status, closedAt: now() } : c)) }));
        if (cycle) get().audit("Tutup Siklus", "Kolam Lele", `${cycle.pondCode} → ${status}`);
      },
      addPondLog: (data) => {
        const cycle = get().fishCycles.find((c) => c.id === data.cycleId);
        if (!cycle) return { ok: false, message: "Siklus tidak ditemukan." };
        const log: PondDailyLog = { ...data, id: uid(), actor: get().user?.name ?? "Pengguna", createdAt: now() };
        set((s) => ({ pondLogs: [log, ...s.pondLogs] }));
        get().audit("Catatan Harian", "Kolam Lele", `${cycle.pondCode} · pakan ${log.feedKg}kg, mati ${log.deaths}`);
        return { ok: true };
      },
      removePondLog: (id) => set((s) => ({ pondLogs: s.pondLogs.filter((l) => l.id !== id) })),
      addPondHarvest: (data) => {
        const cycle = get().fishCycles.find((c) => c.id === data.cycleId);
        if (!cycle) return { ok: false, message: "Siklus tidak ditemukan." };
        const revenueRp = Math.round((Number(data.weightKg) || 0) * (Number(data.pricePerKg) || 0));
        const actor = get().user?.name ?? "Pengguna";
        // Lengkapi kode kolam tujuan pada tiap output grading.
        const outputs = data.outputs?.map((o) => {
          const target = o.targetPondId ? get().ponds.find((p) => p.id === o.targetPondId) : undefined;
          return { ...o, targetPondCode: target?.code ?? o.targetPondCode };
        });
        const harvest: PondHarvest = { ...data, outputs, revenueRp, id: uid(), actor, createdAt: now() };
        set((s) => ({ pondHarvests: [harvest, ...s.pondHarvests] }));
        // Setiap output yang dialihkan ke kolam → catat sebagai PANEN MASUK di
        // kolam tujuan (jadi stok siap jual / pembesaran per kolam).
        const t = now();
        const inbound: LeleMovement[] = (outputs ?? [])
          .filter((o) => o.targetPondId && (Number(o.weightKg) > 0 || Number(o.count) > 0))
          .map((o) => ({
            id: uid(), date: harvest.date, type: "PANEN" as LeleMoveType,
            pondId: o.targetPondId!, pondCode: o.targetPondCode ?? "",
            toPondId: cycle.pondId, toPondCode: cycle.pondCode,
            kategori: o.kategori, qtyKg: Number(o.weightKg) || undefined, qtyEkor: Number(o.count) || undefined,
            ref: harvest.id, note: `Hasil panen ${cycle.pondCode}`, actor, createdAt: t,
          }));
        if (inbound.length) set((s) => ({ leleMovements: [...inbound, ...s.leleMovements].slice(0, 5000) }));
        get().audit("Panen", "Kolam Lele", `${cycle.pondCode} · ${harvest.count} ekor / ${harvest.weightKg}kg${outputs?.length ? ` · ${outputs.length} grading` : ""}`);
        if (harvest.isFinal) get().closeCycle(cycle.id, "Selesai");
        return { ok: true };
      },
      removePondHarvest: (id) => set((s) => ({ pondHarvests: s.pondHarvests.filter((h) => h.id !== id), leleMovements: s.leleMovements.filter((m) => m.ref !== id) })),
      addPondJournal: (data) => {
        if (!data.title.trim() && !data.note.trim()) return { ok: false, message: "Isi judul atau catatan jurnal." };
        const entry: PondJournal = { ...data, id: uid(), actor: get().user?.name ?? "Pengguna", createdAt: now() };
        set((s) => ({ pondJournals: [entry, ...s.pondJournals] }));
        get().audit("Jurnal", "Kolam Lele", `${entry.pondCode ?? "Umum"} · ${entry.category}: ${entry.title || entry.note.slice(0, 30)}`);
        return { ok: true };
      },
      removePondJournal: (id) => set((s) => ({ pondJournals: s.pondJournals.filter((j) => j.id !== id) })),

      addStandardPonds: () => {
        const existing = new Set(get().ponds.map((p) => p.code.toLowerCase()));
        const t = now();
        const toAdd: Pond[] = standardRoster()
          .filter((r) => !existing.has(r.code.toLowerCase()))
          .map((r) => ({
            id: uid(),
            code: r.code,
            name: r.kind === "tampungan" ? `Tampungan ${r.code}` : `Kolam ${r.code}`,
            type: r.type,
            kind: r.kind,
            active: true,
            createdAt: t,
          }));
        if (toAdd.length === 0) return { ok: true, added: 0 };
        set((s) => ({ ponds: [...s.ponds, ...toAdd] }));
        get().audit("Tambah", "Kolam Lele", `${toAdd.length} kolam standar (A/B/D/E + T1–T4)`);
        return { ok: true, added: toAdd.length };
      },

      // ── keuangan lele ───────────────────────────────────────────────────
      recordSale: (data) => {
        if (!data.buyer.trim()) return { ok: false, message: "Nama pembeli wajib diisi." };
        const weightKg = Number(data.weightKg) || 0;
        const pricePerKg = Number(data.pricePerKg) || 0;
        // Tidak ada validasi bobot terhadap tebar — biomassa memang tumbuh.
        const total = data.total != null && data.total > 0 ? Math.round(data.total) : Math.round(weightKg * pricePerKg);
        if (total <= 0) return { ok: false, message: "Nilai penjualan harus lebih dari 0." };
        const paid = Math.min(Math.max(Number(data.paid) || 0, 0), total);
        const number = `JL-${stamp()}-${seq(get().leleSales.length)}`;
        const sale: LeleSale = {
          id: uid(),
          number,
          date: data.date,
          buyer: data.buyer.trim(),
          item: data.item.trim() || "Lele Konsumsi",
          pondCode: data.pondCode,
          weightKg,
          pricePerKg,
          total,
          paid,
          method: data.method,
          note: data.note,
          actor: get().user?.name ?? "Pengguna",
          createdAt: now(),
        };
        set((s) => ({ leleSales: [sale, ...s.leleSales] }));
        // Uang yang benar-benar diterima → kas masuk.
        if (paid > 0) {
          set((s) => ({
            financeTx: [
              { id: uid(), date: sale.date, kind: "masuk", category: "Penjualan Lele", amount: paid, party: sale.buyer, note: `${sale.number} · ${sale.item}`, actor: sale.actor, createdAt: now() },
              ...s.financeTx,
            ],
          }));
        }
        // Sisa yang belum dibayar → piutang.
        const remainder = total - paid;
        if (remainder > 0) {
          set((s) => ({
            receivables: [
              { id: uid(), saleId: sale.id, party: sale.buyer, description: `${sale.number} · ${sale.item}`, amount: remainder, payments: [], dueDate: data.dueDate, actor: sale.actor, createdAt: now() },
              ...s.receivables,
            ],
          }));
        }
        get().audit("Penjualan", "Keuangan Lele", `${sale.number} · ${sale.buyer} · ${currencyStr(total)}${remainder > 0 ? ` (piutang ${currencyStr(remainder)})` : ""}`);
        return { ok: true, sale };
      },
      removeSale: (id) => {
        const sale = get().leleSales.find((x) => x.id === id);
        set((s) => ({
          leleSales: s.leleSales.filter((x) => x.id !== id),
          receivables: s.receivables.filter((r) => r.saleId !== id),
        }));
        if (sale) get().audit("Hapus", "Keuangan Lele", sale.number);
      },
      addReceivable: (data) => {
        set((s) => ({
          receivables: [
            { ...data, payments: data.payments ?? [], id: uid(), actor: get().user?.name ?? "Pengguna", createdAt: now() },
            ...s.receivables,
          ],
        }));
        get().audit("Tambah", "Piutang", `${data.party} · ${currencyStr(data.amount)}`);
        return { ok: true };
      },
      payReceivable: (id, entry) => {
        const r = get().receivables.find((x) => x.id === id);
        if (!r) return { ok: false, message: "Piutang tidak ditemukan." };
        const amount = Number(entry.amount) || 0;
        if (amount <= 0) return { ok: false, message: "Nominal bayar harus lebih dari 0." };
        const payment: PaymentEntry = { ...entry, amount, id: uid() };
        set((s) => ({
          receivables: s.receivables.map((x) => (x.id === id ? { ...x, payments: [...x.payments, payment] } : x)),
          financeTx: [
            { id: uid(), date: payment.date, kind: "masuk", category: "Penjualan Lele", amount, party: r.party, note: `Pelunasan piutang · ${r.description}`, actor: get().user?.name ?? "Pengguna", createdAt: now() },
            ...s.financeTx,
          ],
        }));
        get().audit("Bayar", "Piutang", `${r.party} · ${currencyStr(amount)}`);
        return { ok: true };
      },
      removeReceivable: (id) => set((s) => ({ receivables: s.receivables.filter((x) => x.id !== id) })),
      addPayable: (data) => {
        set((s) => ({
          payables: [
            { ...data, payments: data.payments ?? [], id: uid(), actor: get().user?.name ?? "Pengguna", createdAt: now() },
            ...s.payables,
          ],
        }));
        get().audit("Tambah", "Utang", `${data.party} · ${currencyStr(data.amount)}`);
        return { ok: true };
      },
      payPayable: (id, entry) => {
        const p = get().payables.find((x) => x.id === id);
        if (!p) return { ok: false, message: "Utang tidak ditemukan." };
        const amount = Number(entry.amount) || 0;
        if (amount <= 0) return { ok: false, message: "Nominal bayar harus lebih dari 0." };
        const payment: PaymentEntry = { ...entry, amount, id: uid() };
        set((s) => ({
          payables: s.payables.map((x) => (x.id === id ? { ...x, payments: [...x.payments, payment] } : x)),
          financeTx: [
            { id: uid(), date: payment.date, kind: "keluar", category: "Lain-lain", amount, party: p.party, note: `Bayar utang · ${p.description}`, actor: get().user?.name ?? "Pengguna", createdAt: now() },
            ...s.financeTx,
          ],
        }));
        get().audit("Bayar", "Utang", `${p.party} · ${currencyStr(amount)}`);
        return { ok: true };
      },
      removePayable: (id) => set((s) => ({ payables: s.payables.filter((x) => x.id !== id) })),
      addFinanceTx: (data) => {
        const amount = Number(data.amount) || 0;
        if (amount <= 0) return { ok: false, message: "Nominal harus lebih dari 0." };
        set((s) => ({
          financeTx: [{ ...data, amount, id: uid(), actor: get().user?.name ?? "Pengguna", createdAt: now() }, ...s.financeTx],
        }));
        get().audit(data.kind === "masuk" ? "Kas Masuk" : "Kas Keluar", "Keuangan", `${data.category} · ${currencyStr(amount)}`);
        return { ok: true };
      },
      removeFinanceTx: (id) => set((s) => ({ financeTx: s.financeTx.filter((x) => x.id !== id) })),
      addFinanceCategory: (name, kind) => {
        const trimmed = name.trim();
        if (!trimmed) return { ok: false, message: "Nama kategori wajib diisi." };
        if (get().financeCategories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
          return { ok: false, message: "Kategori sudah ada." };
        }
        set((s) => ({ financeCategories: [...s.financeCategories, { id: uid(), name: trimmed, kind, createdAt: now() }] }));
        get().audit("Tambah", "Kategori Keuangan", trimmed);
        return { ok: true };
      },
      removeFinanceCategory: (id) => set((s) => ({ financeCategories: s.financeCategories.filter((c) => c.id !== id) })),

      // ── mutasi stok lele ────────────────────────────────────────────────
      recordLeleMovement: (data) => {
        const pond = get().ponds.find((p) => p.id === data.pondId);
        if (!pond) return { ok: false, message: "Kolam tidak ditemukan." };
        const qtyKg = data.qtyKg != null ? Number(data.qtyKg) : undefined;
        const qtyEkor = data.qtyEkor != null ? Number(data.qtyEkor) : undefined;
        if (!(qtyKg && qtyKg > 0) && !(qtyEkor && qtyEkor > 0)) return { ok: false, message: "Isi jumlah kg atau ekor." };
        const mv: LeleMovement = {
          id: uid(), date: data.date, type: data.type, pondId: pond.id, pondCode: pond.code,
          kategori: data.kategori, qtyKg, qtyEkor, note: data.note, actor: get().user?.name ?? "Pengguna", createdAt: now(),
        };
        set((s) => ({ leleMovements: [mv, ...s.leleMovements].slice(0, 5000) }));
        get().audit("Mutasi", "Stok Lele", `${pond.code} · ${data.type}${data.kategori ? ` (${data.kategori})` : ""}${qtyKg ? ` · ${qtyKg}kg` : ""}`);
        return { ok: true };
      },
      // Transfer antar-kolam: SELALU dua sisi (keluar di asal, masuk di tujuan)
      // dengan ref yang sama supaya bisa ditelusuri dan tidak pernah timpang.
      transferLele: (data) => {
        const from = get().ponds.find((p) => p.id === data.fromPondId);
        const to = get().ponds.find((p) => p.id === data.toPondId);
        if (!from || !to) return { ok: false, message: "Kolam asal/tujuan tidak ditemukan." };
        if (from.id === to.id) return { ok: false, message: "Kolam asal dan tujuan tidak boleh sama." };
        const qtyKg = data.qtyKg != null ? Number(data.qtyKg) : undefined;
        const qtyEkor = data.qtyEkor != null ? Number(data.qtyEkor) : undefined;
        if (!(qtyKg && qtyKg > 0) && !(qtyEkor && qtyEkor > 0)) return { ok: false, message: "Isi jumlah kg atau ekor." };
        const ref = `TF-${stamp()}-${seq(get().leleMovements.length)}`;
        const actor = get().user?.name ?? "Pengguna";
        const t = now();
        const out: LeleMovement = { id: uid(), date: data.date, type: "TRANSFER_KELUAR", pondId: from.id, pondCode: from.code, toPondId: to.id, toPondCode: to.code, kategori: data.kategori, qtyKg, qtyEkor, ref, note: data.note, actor, createdAt: t };
        const inn: LeleMovement = { id: uid(), date: data.date, type: "TRANSFER_MASUK", pondId: to.id, pondCode: to.code, toPondId: from.id, toPondCode: from.code, kategori: data.kategori, qtyKg, qtyEkor, ref, note: data.note, actor, createdAt: t };
        set((s) => ({ leleMovements: [inn, out, ...s.leleMovements].slice(0, 5000) }));
        get().audit("Transfer", "Stok Lele", `${from.code} → ${to.code}${qtyKg ? ` · ${qtyKg}kg` : ""}${qtyEkor ? ` · ${qtyEkor} ekor` : ""} (${ref})`);
        return { ok: true };
      },
      // Hapus satu mutasi; jika bagian dari transfer (punya ref), hapus pasangannya juga.
      removeLeleMovement: (id) => {
        const mv = get().leleMovements.find((m) => m.id === id);
        set((s) => ({ leleMovements: s.leleMovements.filter((m) => (mv?.ref ? m.ref !== mv.ref : m.id !== id)) }));
      },

      // ── backup & restore ────────────────────────────────────────────────
      exportBackup: () => {
        const s = get();
        const payload: Record<string, unknown> = { __backup: "arfarmjaya", version: 3, exportedAt: now() };
        for (const k of BACKUP_KEYS) payload[k] = (s as unknown as Record<string, unknown>)[k];
        return JSON.stringify(payload, null, 2);
      },
      importBackup: (json) => {
        let parsed: Record<string, unknown>;
        try { parsed = JSON.parse(json); } catch { return { ok: false, message: "Berkas bukan JSON yang valid." }; }
        if (!parsed || typeof parsed !== "object") return { ok: false, message: "Format cadangan tidak dikenali." };
        const patch: Record<string, unknown> = {};
        let found = 0;
        for (const k of BACKUP_KEYS) {
          if (k in parsed) { patch[k] = parsed[k]; found++; }
        }
        if (found === 0) return { ok: false, message: "Tidak ada data yang bisa dipulihkan dari berkas ini." };
        set(patch as never);
        get().audit("Pulihkan", "Cadangan Data", `${found} bagian data dipulihkan`);
        return { ok: true, message: `${found} bagian data dipulihkan.` };
      },

      markNotificationRead: (id) => set((s) => ({ readNotifications: Array.from(new Set([...s.readNotifications, id])) })),
      setLoginNoticeSeen: (value) => set({ loginNoticeSeen: value }),
      markAllNotificationsRead: (ids) => set((s) => ({ readNotifications: Array.from(new Set([...s.readNotifications, ...ids])) })),
      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
        get().audit("Ubah", "Pengaturan", "Konfigurasi sistem diperbarui");
      },
      resetData: () => {
        const fresh = buildInitial();
        set({ ...fresh, hasHydrated: true, user: get().user, theme: get().theme });
      },
    }),
    {
      name: "arfarmjaya-wms",
      version: 3,
      // Backfill field baru pada profil laporan yang tersimpan dari versi lama
      // agar kolom "Bukti Pembayaran" langsung aktif tanpa menghapus data.
      migrate: (persisted) => {
        const state = persisted as Partial<State> | undefined;
        if (state?.reportProfiles) {
          state.reportProfiles = state.reportProfiles.map((profile) => ({
            ...profile,
            showPayment: profile.showPayment ?? true,
          }));
        }
        return state as State & Actions;
      },
      partialize: (s) => ({
        theme: s.theme,
        user: s.user,
        products: s.products,
        movements: s.movements,
        categories: s.categories,
        suppliers: s.suppliers,
        warehouses: s.warehouses,
        racks: s.racks,
        users: s.users,
        purchaseOrders: s.purchaseOrders,
        receipts: s.receipts,
        distributions: s.distributions,
        requests: s.requests,
        opnameSessions: s.opnameSessions,
        posSales: s.posSales,
        stores: s.stores,
        invoices: s.invoices,
        reportProfiles: s.reportProfiles,
        weeklyReports: s.weeklyReports,
        ponds: s.ponds,
        fishCycles: s.fishCycles,
        pondLogs: s.pondLogs,
        pondHarvests: s.pondHarvests,
        pondJournals: s.pondJournals,
        leleSales: s.leleSales,
        receivables: s.receivables,
        payables: s.payables,
        financeTx: s.financeTx,
        financeCategories: s.financeCategories,
        leleMovements: s.leleMovements,
        auditLog: s.auditLog,
        readNotifications: s.readNotifications,
        loginNoticeSeen: s.loginNoticeSeen,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);

export { roleLabel };

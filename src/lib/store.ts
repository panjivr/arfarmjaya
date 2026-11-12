"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { preserveLocalSnapshot } from "@/lib/local-persistence";
import { persistStorage } from "@/lib/persist-storage";
import { cleanLetterLines, letterTotal, resolveLetterChrome, suggestLetterNumber } from "@/lib/letters";
import { invoiceInputError, invoiceTotals, suggestInvoiceNumber } from "@/lib/invoices";
import { snapshotInvoiceSeller } from "@/lib/invoice-design";
import { WORKSPACE_KEYS, parseWorkspace } from "@/lib/workspace-data";
import type { Product } from "@/lib/data";
import { realStockProducts } from "@/lib/stock-products";
import type {
  AppSettings,
  AuditEntry,
  Category,
  Distribution,
  Invoice,
  InvoiceInput,
  OfficialLetter,
  LetterInput,
  ItemRequest,
  ManagedUser,
  OpnameSession,
  OrderLine,
  OrderStatus,
  PaymentMethod,
  PosSale,
  PurchaseOrder,
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

function buildLetterRecord(
  state: { stores: Store[]; letters: OfficialLetter[] },
  data: LetterInput,
  existing?: OfficialLetter,
): { ok: boolean; message?: string; letter?: OfficialLetter } {
  const store = state.stores.find((x) => x.id === data.storeId);
  if (!store) return { ok: false, message: "Toko tidak ditemukan." };
  if (!data.recipient.trim()) return { ok: false, message: "Nama penerima wajib diisi." };
  if (!data.opening.trim() || !data.closing.trim()) return { ok: false, message: "Teks surat belum diisi." };
  const lines = cleanLetterLines(data.lines);
  if (lines.length === 0) return { ok: false, message: "Tambahkan minimal satu baris rincian." };
  const chrome = resolveLetterChrome(data);
  const total = letterTotal(lines);
  const letter: OfficialLetter = {
    id: existing?.id ?? uid(),
    kind: "penagihan",
    number: data.number?.trim() || existing?.number || suggestLetterNumber(data.date, state.letters.length, chrome.code),
    storeId: store.id,
    storeName: store.name,
    recipient: data.recipient.trim(),
    recipientPhone: data.recipientPhone?.trim() || undefined,
    recipientAddress: data.recipientAddress?.trim() || undefined,
    place: data.place.trim() || "Ponorogo",
    date: data.date,
    dueDate: data.dueDate || undefined,
    subject: data.subject.trim() || chrome.subject,
    reference: data.reference?.trim() || undefined,
    opening: data.opening.trim(),
    closing: data.closing.trim(),
    lines,
    total,
    bankInfo: data.bankInfo?.trim() || undefined,
    purpose: chrome.id,
    heading: chrome.heading,
    code: chrome.code,
    columns: chrome.columns,
    totalLabel: chrome.totalLabel,
    paymentTitle: chrome.paymentTitle,
    signOff: chrome.signOff,
    // Tanda tangan mengikuti isi yang baru disimpan. Bila TTE dimatikan,
    // sidik lama tidak dipertahankan.
    signature: data.signature,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
  return { ok: true, letter };
}

// Kunci data bisnis yang ikut dicadangkan/dipulihkan (sama dengan data ter-sync).
const BACKUP_KEYS = WORKSPACE_KEYS;

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
  letters: OfficialLetter[];
  reportProfiles: ReportProfile[];
  weeklyReports: WeeklyReport[];
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
  createInvoice: (data: InvoiceInput) => { ok: boolean; message?: string; invoice?: Invoice };
  updateInvoice: (id: string, data: InvoiceInput) => { ok: boolean; message?: string; invoice?: Invoice };
  deleteInvoice: (id: string) => void;
  createLetter: (data: LetterInput) => { ok: boolean; message?: string; letter?: OfficialLetter };
  updateLetter: (id: string, data: LetterInput) => { ok: boolean; message?: string; letter?: OfficialLetter };
  deleteLetter: (id: string) => void;

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
    eSignAt?: string;
    activities: WeeklyActivity[];
  }) => { ok: boolean; message?: string; report?: WeeklyReport };
  duplicateWeeklyReport: (id: string) => { ok: boolean; report?: WeeklyReport };
  deleteWeeklyReport: (id: string) => void;

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
    letters: [],
    reportProfiles: seedReportProfiles,
    weeklyReports: [],
    auditLog: [],
    readNotifications: [],
    loginNoticeSeen: false,
    settings: defaultSettings,
  };
}

/** Factory-seed snapshot of the business data, for recognising a device that
 *  has never held real records (used by the initial sync decision). */
export function factorySnapshot(): Record<string, unknown> {
  const initial = buildInitial() as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of WORKSPACE_KEYS) out[key] = initial[key];
  return out;
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
          auditLog: [{ id: uid(), actor, action, entity, detail, createdAt: now() }, ...s.auditLog],
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
          ],
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
      createInvoice: (data) => {
        const store = get().stores.find((x) => x.id === data.storeId);
        if (!store) return { ok: false, message: "Toko tidak ditemukan." };
        const error = invoiceInputError(data);
        if (error) return { ok: false, message: error };
        const number = data.number?.trim() || suggestInvoiceNumber(store.invoicePrefix, get().invoices);
        if (get().invoices.some((inv) => inv.number === number)) return { ok: false, message: "Nomor invoice sudah digunakan." };
        const invoice: Invoice = {
          ...data, ...invoiceTotals(data.lines, data.shipping, data.discount ?? 0),
          id: uid(), number, storeName: data.seller?.name ?? store.name, buyer: data.buyer.trim(),
          lines: data.lines.map((line) => ({ ...line, name: line.name.trim(), unit: line.unit.trim() })),
          note: data.note ?? store.note, seller: snapshotInvoiceSeller(data.seller ?? store), createdAt: now(),
        };
        set((s) => ({ invoices: [invoice, ...s.invoices] }));
        get().audit("Buat", "Invoice", `${number} · ${invoice.buyer}`);
        return { ok: true, invoice };
      },
      updateInvoice: (id, data) => {
        const existing = get().invoices.find((x) => x.id === id);
        if (!existing) return { ok: false, message: "Invoice tidak ditemukan." };
        const store = get().stores.find((x) => x.id === data.storeId);
        if (!store) return { ok: false, message: "Toko tidak ditemukan." };
        const error = invoiceInputError(data);
        if (error) return { ok: false, message: error };
        const number = data.number?.trim() || existing.number;
        if (get().invoices.some((inv) => inv.id !== id && inv.number === number)) return { ok: false, message: "Nomor invoice sudah digunakan." };
        const invoice: Invoice = {
          ...existing, ...data, ...invoiceTotals(data.lines, data.shipping, data.discount ?? 0), number,
          storeName: data.seller?.name ?? store.name, buyer: data.buyer.trim(),
          lines: data.lines.map((line) => ({ ...line, name: line.name.trim(), unit: line.unit.trim() })),
          seller: snapshotInvoiceSeller(data.seller ?? (existing.storeId === data.storeId ? existing.seller ?? store : store)),
          // Jangan mempertahankan hash isi lama ketika dokumen diperbarui.
          signature: data.signature,
        };
        set((s) => ({ invoices: s.invoices.map((x) => x.id === id ? invoice : x) }));
        get().audit("Ubah", "Invoice", `${number} · ${invoice.buyer}`);
        return { ok: true, invoice };
      },
      deleteInvoice: (id) => {
        const inv = get().invoices.find((x) => x.id === id);
        set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) }));
        get().audit("Hapus", "Invoice", inv?.number ?? id);
      },

      createLetter: (data) => {
        const built = buildLetterRecord(get(), data);
        if (!built.ok || !built.letter) return { ok: false, message: built.message };
        set((s) => ({ letters: [built.letter!, ...s.letters] }));
        get().audit("Buat", "Surat", `${built.letter.number} · ${built.letter.recipient}`);
        return { ok: true, letter: built.letter };
      },
      updateLetter: (id, data) => {
        const existing = get().letters.find((x) => x.id === id);
        if (!existing) return { ok: false, message: "Surat tidak ditemukan." };
        const built = buildLetterRecord(get(), data, existing);
        if (!built.ok || !built.letter) return { ok: false, message: built.message };
        set((s) => ({ letters: s.letters.map((x) => (x.id === id ? built.letter! : x)) }));
        get().audit("Ubah", "Surat", `${built.letter.number} · ${built.letter.recipient}`);
        return { ok: true, letter: built.letter };
      },
      deleteLetter: (id) => {
        const letter = get().letters.find((x) => x.id === id);
        set((s) => ({ letters: s.letters.filter((x) => x.id !== id) }));
        get().audit("Hapus", "Surat", letter?.number ?? id);
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
          eSignAt: data.eSignAt || existing?.eSignAt,
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

      // ── backup & restore ────────────────────────────────────────────────
      exportBackup: () => {
        const s = get();
        const payload: Record<string, unknown> = { __backup: "arfarmjaya", version: 3, exportedAt: now() };
        for (const k of BACKUP_KEYS) payload[k] = (s as unknown as Record<string, unknown>)[k];
        return JSON.stringify(payload, null, 2);
      },
      importBackup: (json) => {
        let patch: Record<string, unknown>;
        try { patch = parseWorkspace(JSON.parse(json)); }
        catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Berkas cadangan tidak valid." }; }
        const previous: Record<string, unknown> = {};
        for (const k of BACKUP_KEYS) previous[k] = (get() as unknown as Record<string, unknown>)[k];
        if (!preserveLocalSnapshot(previous)) return { ok: false, message: "Cadangan sebelum pemulihan gagal disimpan. Unduh cadangan dan kosongkan ruang penyimpanan sebelum mengulangi." };
        const found = Object.keys(patch).length;
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
        const previous: Record<string, unknown> = {};
        for (const k of BACKUP_KEYS) previous[k] = (get() as unknown as Record<string, unknown>)[k];
        if (!preserveLocalSnapshot(previous)) throw new Error("Reset dibatalkan: cadangan lokal gagal disimpan.");
        const fresh = buildInitial();
        set({ ...fresh, hasHydrated: true, user: get().user, theme: get().theme });
      },
    }),
    {
      name: "arfarmjaya-wms",
      version: 3,
      storage: createJSONStorage(() => persistStorage),
      // Backfill field baru pada profil laporan yang tersimpan dari versi lama
      // agar kolom "Bukti Pembayaran" langsung aktif tanpa menghapus data.
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== "object") return current;
        const cache = persisted as Record<string, unknown>;
        const business = parseWorkspace(cache);
        return { ...current, ...business, theme: cache.theme === "dark" ? "dark" : "light", user: cache.user as State["user"], loginNoticeSeen: cache.loginNoticeSeen === true };
      },
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
        letters: s.letters,
        reportProfiles: s.reportProfiles,
        weeklyReports: s.weeklyReports,
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

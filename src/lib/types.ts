export type Role =
  | "admin"
  | "manajer"
  | "gudang"
  | "pembelian"
  | "kasir"
  | "driver"
  | "viewer"
  | "karyawan";

export type SessionUser = {
  id: string;
  name: string;
  username: string;
  role: Role;
  label: string;
};

export type ManagedUser = {
  id: string;
  name: string;
  username: string;
  role: Role;
  active: boolean;
  createdAt: string;
};

export type MasterRecord = {
  id: string;
  name: string;
  note?: string;
  createdAt: string;
};

export type Category = MasterRecord;

export type Supplier = MasterRecord & {
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export type Warehouse = MasterRecord & {
  location?: string;
};

export type Rack = MasterRecord & {
  code: string;
  warehouse: string;
};

export type MovementType = "in" | "out" | "adjust" | "sale" | "transfer";

export type StockMovement = {
  id: string;
  type: MovementType;
  sku: string;
  productName: string;
  quantity: number;
  unit: string;
  note: string;
  reference?: string;
  actor: string;
  createdAt: string;
};

export type OrderStatus =
  | "Draft"
  | "Menunggu Persetujuan"
  | "Disetujui"
  | "Ditolak"
  | "Diproses"
  | "Dikirim"
  | "Selesai"
  | "Dibatalkan";

export type OrderLine = {
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
};

export type PurchaseOrder = {
  id: string;
  number: string;
  supplier: string;
  status: OrderStatus;
  lines: OrderLine[];
  total: number;
  note?: string;
  actor: string;
  createdAt: string;
};

export type Receipt = {
  id: string;
  number: string;
  supplier: string;
  sku: string;
  productName: string;
  quantity: number;
  unit: string;
  batch: string;
  expirationDate: string;
  actor: string;
  createdAt: string;
};

export type Distribution = {
  id: string;
  number: string;
  destination: string;
  status: OrderStatus;
  lines: OrderLine[];
  driver?: string;
  actor: string;
  createdAt: string;
};

export type ItemRequest = {
  id: string;
  number: string;
  requester: string;
  status: OrderStatus;
  lines: OrderLine[];
  note?: string;
  actor: string;
  createdAt: string;
};

export type OpnameLine = {
  sku: string;
  name: string;
  unit: string;
  systemStock: number;
  actualStock: number;
};

export type OpnameSession = {
  id: string;
  number: string;
  warehouse: string;
  status: "Draft" | "Diposting";
  lines: OpnameLine[];
  reason?: string;
  actor: string;
  createdAt: string;
};

export type PaymentMethod = "Tunai" | "Transfer" | "QRIS";

export type PosSale = {
  id: string;
  number: string;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  total: number;
  payment: PaymentMethod;
  paid: number;
  change: number;
  actor: string;
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  detail: string;
  createdAt: string;
};

export type AppSettings = {
  companyName: string;
  address: string;
  phone: string;
  taxNumber: string;
  lowStockThreshold: number;
  expiryWarningDays: number;
  currency: string;
};

export type Store = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  logo?: string; // data URL
  bankInfo?: string; // e.g. "BNI 2024501132 a.n. ALIF LOLITA"
  invoicePrefix: string; // e.g. "INVAL"
  signatureName?: string; // name shown above seller signature line
  note?: string; // default catatan / perhatian
  accent?: string; // hex accent color for the invoice header
  createdAt: string;
};

export type InvoiceLine = {
  name: string;
  unit: string;
  quantity: number;
  price: number;
};

export type Invoice = {
  id: string;
  number: string;
  storeId: string;
  storeName: string;
  buyer: string;
  buyerPhone?: string;
  date: string; // yyyy-mm-dd
  lines: InvoiceLine[];
  subtotal: number;
  shipping: number;
  total: number;
  note?: string;
  createdAt: string;
};

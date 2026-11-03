import type { AppRole } from "@/lib/rbac";

export type Role =
  | "admin"
  | "manajer"
  | "gudang"
  | "pembelian"
  | "kasir"
  | "driver"
  | "viewer"
  | "karyawan";

// Pengguna yang sedang login. `role` memakai peran RBAC baru (AppRole).
export type SessionUser = {
  id: string;
  name: string;
  username: string;
  role: AppRole;
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

export type InvoiceColors = {
  brand: string;
  tagline: string;
  heading: string;
  headingText: string;
  text: string;
  detail: string;
  muted: string;
  border: string;
  tableHeader: string;
  tableHeaderText: string;
  alternateRow: string;
  total: string;
  totalText: string;
  footer: string;
};

export type InvoiceVisibility = {
  logo: boolean;
  tagline: boolean;
  storeAddress: boolean;
  storePhone: boolean;
  storeEmail: boolean;
  buyerAddress: boolean;
  buyerPhone: boolean;
  dueDate: boolean;
  rowNumber: boolean;
  unit: boolean;
  price: boolean;
  subtotal: boolean;
  shipping: boolean;
  discount: boolean;
  payment: boolean;
  terbilang: boolean;
  signature: boolean;
  note: boolean;
  footer: boolean;
};

export type InvoiceDesign = {
  layout: "classic" | "modern";
  logoWidth: number;
  colors: InvoiceColors;
  visible: InvoiceVisibility;
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
  accent?: string; // fallback untuk toko lama
  tagline?: string;
  paymentMethod?: string;
  footerText?: string;
  invoiceDesign?: InvoiceDesign;
  /** Aktifkan tanda tangan elektronik sebagai default saat membuat invoice toko ini. */
  eSignEnabled?: boolean;
  /** Nama penanda tangan elektronik (fallback: signatureName lalu name). */
  eSignerName?: string;
  /** Katalog barang/daftar harga toko — dipakai untuk mengisi invoice cepat. */
  catalog?: StoreItem[];
  /** Pelanggan/pembeli tersimpan toko — mengisi data pembeli invoice cepat. Per toko. */
  buyers?: StoreBuyer[];
  createdAt: string;
};

/** Satu barang di katalog toko (daftar harga yang bisa dipilih saat buat invoice). */
export type StoreItem = {
  id: string;
  name: string;
  unit: string;
  price: number;
};

/** Pelanggan tersimpan milik sebuah toko (tidak dicampur antar toko). */
export type StoreBuyer = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
};

export type InvoiceLine = {
  name: string;
  unit: string;
  quantity: number;
  price: number;
};

/**
 * Tanda tangan elektronik invoice atau surat. Bukan PSrE bersertifikat negara,
 * melainkan tanda tangan kriptografis internal: `hash` adalah SHA-256 atas isi
 * dokumen (berubah bila isi diubah), `code` diturunkan dari hash untuk QR.
 */
export type InvoiceSignature = {
  signedBy: string; // nama penanda tangan
  signedAt: string; // ISO timestamp
  hash: string; // SHA-256 hex atas isi dokumen
  code: string; // kode dokumen (turunan hash), mis. AFJ-9F2A-77C1-1B0E
  algo: string; // "SHA-256"
};

/** Identitas dan desain saat invoice disimpan; katalog & pelanggan tidak disalin. */
export type InvoiceSeller = Omit<Store, "id" | "createdAt" | "catalog" | "buyers">;

export type InvoiceInput = {
  storeId: string;
  buyer: string;
  buyerPhone?: string;
  buyerAddress?: string;
  date: string;
  dueDate?: string;
  number?: string;
  lines: InvoiceLine[];
  shipping: number;
  discount?: number;
  note?: string;
  signature?: InvoiceSignature;
  seller?: InvoiceSeller;
};

export type Invoice = {
  id: string;
  number: string;
  storeId: string;
  storeName: string;
  buyer: string;
  buyerPhone?: string;
  buyerAddress?: string;
  dueDate?: string;
  discount?: number;
  seller?: InvoiceSeller;
  date: string; // yyyy-mm-dd
  lines: InvoiceLine[];
  subtotal: number;
  shipping: number;
  total: number;
  note?: string;
  signature?: InvoiceSignature; // ada bila ditandatangani elektronik
  createdAt: string;
};

/** Jenis surat. Tetap satu jenis tersimpan agar surat lama tidak perlu migrasi. */
export type LetterKind = "penagihan";

/**
 * Maksud surat. Mengatur teks awal dan label baku.
 * Isi kertas tetap bisa diganti satu per satu setelah pilihan ini.
 */
export type LetterPurposeId = "barang" | "kasbon" | "gaji" | "perusahaan" | "bebas";

/** Judul kolom tabel di tengah surat. */
export type LetterColumns = {
  item: string;
  quantity: string;
  note: string;
  amount: string;
};

/** Satu baris di tengah surat: uraian, jumlah, keterangan, dan nilai rupiah. */
export type LetterLine = {
  name: string;
  quantity: number;
  unit: string;
  note: string;
  amount: number;
};

/** Data yang dikirim saat membuat atau memperbarui surat. */
export type LetterInput = {
  storeId: string;
  recipient: string;
  recipientPhone?: string;
  recipientAddress?: string;
  place: string;
  date: string;
  dueDate?: string;
  number?: string;
  subject: string;
  reference?: string;
  opening: string;
  closing: string;
  lines: LetterLine[];
  bankInfo?: string;
  purpose?: LetterPurposeId;
  heading?: string;
  code?: string;
  columns?: Partial<LetterColumns>;
  totalLabel?: string;
  paymentTitle?: string;
  signOff?: string;
  /** Ada bila ditandatangani elektronik. Kosong berarti surat tanpa TTE. */
  signature?: InvoiceSignature;
};

/**
 * Surat resmi yang disimpan terpisah dari invoice.
 * Kop memakai data toko; isi teks, label, dan tabel milik surat itu sendiri.
 * Surat lama tanpa purpose tetap sah dan tampil sebagai penagihan barang.
 */
export type OfficialLetter = {
  id: string;
  kind: LetterKind;
  number: string;
  storeId: string;
  storeName: string;
  recipient: string;
  recipientPhone?: string;
  recipientAddress?: string;
  place: string;
  date: string; // yyyy-mm-dd
  dueDate?: string; // yyyy-mm-dd
  subject: string;
  reference?: string;
  opening: string;
  closing: string;
  lines: LetterLine[];
  total: number;
  bankInfo?: string;
  purpose?: LetterPurposeId;
  heading?: string;
  code?: string;
  columns?: LetterColumns;
  totalLabel?: string;
  paymentTitle?: string;
  signOff?: string;
  /** Ada bila surat ditandatangani elektronik. Surat lama tanpa field ini tetap sah. */
  signature?: InvoiceSignature;
  createdAt: string;
  updatedAt: string;
};

/* ── Laporan Pelaksanaan Mingguan (laporan kegiatan lapangan) ───────────── */

/**
 * Kop surat + format cetak laporan. Semua bagian laporan (identitas lembaga,
 * judul, kolom yang tampil, blok tanda tangan, dan catatan kaki) diatur lewat
 * profil ini sehingga template bisa dipakai ulang untuk program lain.
 */
/** Kolom tabel laporan yang bisa diatur tampil/sembunyi dan lebarnya. */
export type ReportColumnKey =
  | "no"
  | "date"
  | "activity"
  | "purpose"
  | "hst"
  | "amount"
  | "output"
  | "photo"
  | "payment";

export type ReportColumnSetting = {
  key: ReportColumnKey;
  visible: boolean;
  /** Lebar kolom dalam persen (0–100). Kosong/0 = dibagi otomatis. */
  width?: number;
};

export type ReportProfile = {
  id: string;
  name: string; // nama profil di daftar pilihan
  organization: string; // baris utama kop surat
  tagline?: string;
  program?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string; // data URL atau path publik
  accent: string; // warna aksen kop, judul, dan header tabel
  reportTitle: string;
  currencyLabel: string; // label kolom nominal, mis. "Nominal (Rp)"
  signaturePlace?: string;
  signatureRole: string;
  signatureName?: string;
  signatureId?: string;
  signatureImage?: string; // data URL tanda tangan (opsional)
  approverRole?: string; // blok "Mengetahui" (opsional)
  approverName?: string;
  approverId?: string;
  notes: string[]; // keterangan pengisian di kaki laporan
  showHst: boolean;
  showAmount: boolean;
  showOutput: boolean;
  showPhoto: boolean;
  showPayment: boolean; // kolom bukti pembayaran (nota/kwitansi)
  showSummary: boolean;
  showNotes: boolean;
  autoFit: boolean; // perkecil otomatis agar muat satu halaman saat dicetak
  minRows: number; // baris kosong minimum agar form tetap rapi saat dicetak
  /**
   * Tinggi tiap baris tabel & kotak foto/bukti pembayaran dalam px. Semakin
   * besar, kotak "Bukti Pembayaran"/"Foto" makin tinggi sehingga gambar/tempat
   * tempel nota terlihat jelas. Kosong = tinggi bawaan (70px).
   */
  rowHeight?: number;
  /**
   * Pengaturan kolom tabel: urutan, tampil/sembunyi, dan lebar (%). Bila kosong
   * (profil lama), tampilan diturunkan dari flag show* di atas dengan lebar
   * bawaan. Ini yang membuat SEMUA kolom — termasuk No, Tanggal, Jenis Kegiatan,
   * dan Tujuan — bisa dicentang dan diatur lebarnya.
   */
  columns?: ReportColumnSetting[];
  /** Kartu ringkasan eksekutif di atas tabel (serapan, jumlah kegiatan, periode). */
  showExecutiveSummary?: boolean;
  /** Blok tanda tangan "Dibuat oleh" (pelaksana). Default aktif. */
  signExecutor?: boolean;
  /** Blok tanda tangan "Mengetahui/Menyetujui" (manajer/yayasan). */
  signApprover?: boolean;
  /** Tanda tangan elektronik (QR + hash SHA-256) pada blok "Dibuat oleh". */
  showESign?: boolean;
  /** Blok klaim reimbursement (instruksi pembayaran). Default nonaktif. */
  showReimbursement?: boolean;
  reimbursementBank?: string;
  reimbursementAccount?: string;
  reimbursementHolder?: string;
  createdAt: string;
};

export type WeeklyActivity = {
  id: string;
  date: string; // yyyy-mm-dd
  activity: string;
  purpose: string;
  hst: string; // umur tanaman, mis. "0 HST"
  amount: number;
  output: string;
  photo?: string; // data URL — foto kegiatan (foto pertama; dipertahankan agar data lama tetap terbaca)
  photos?: string[]; // beberapa foto kegiatan; bila ada, ini yang dipakai
  paymentProof?: string; // data URL — foto nota/kwitansi/bukti pembayaran
};

export type WeeklyReport = {
  id: string;
  number: string;
  profileId: string;
  profileName: string;
  executor: string; // nama pelaksana / penyuluh
  group: string; // kelompok tani
  location: string; // lokasi / desa
  week: string; // minggu ke- / periode
  periodStart?: string;
  periodEnd?: string;
  signPlace: string;
  signDate: string; // yyyy-mm-dd
  eSignAt?: string; // ISO — waktu tanda tangan elektronik yang dapat dipilih manual
  activities: WeeklyActivity[];
  total: number;
  actor: string;
  createdAt: string;
  updatedAt: string;
};

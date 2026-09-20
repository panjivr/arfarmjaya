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

/* ── Laporan Pelaksanaan Mingguan (laporan kegiatan lapangan) ───────────── */

/**
 * Kop surat + format cetak laporan. Semua bagian laporan (identitas lembaga,
 * judul, kolom yang tampil, blok tanda tangan, dan catatan kaki) diatur lewat
 * profil ini sehingga template bisa dipakai ulang untuk program lain.
 */
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
  photo?: string; // data URL — foto kegiatan
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
  activities: WeeklyActivity[];
  total: number;
  actor: string;
  createdAt: string;
  updatedAt: string;
};

/* ── Budidaya Lele (peternakan / monitoring kolam) ─────────────────────── */

export type PondType = "Terpal" | "Tanah" | "Beton" | "Bioflok";
export type PondStatus = "Kosong" | "Aktif" | "Perlu Panen" | "Nonaktif";
export type CycleStatus = "Aktif" | "Selesai" | "Gagal";

/** Peran kolam: produksi (pembesaran) atau tampungan/stok siap jual (T1–T4). */
export type PondKind = "produksi" | "tampungan";

/** Satu kolam fisik dengan kode unik (mis. "A12"). Bisa dipakai berulang
 *  lewat beberapa siklus tebar–panen sepanjang waktu. */
export type Pond = {
  id: string;
  code: string; // kode unik kolam, mis. "A12"
  name?: string;
  type: PondType;
  kind?: PondKind; // default "produksi"; "tampungan" = kolam siap jual (T1–T4)
  areaM2?: number; // luas kolam
  note?: string;
  active: boolean; // kolam dipakai / dinonaktifkan
  createdAt: string;
};

/** Satu siklus budidaya pada sebuah kolam: dari tebar benih sampai panen. */
export type FishCycle = {
  id: string;
  pondId: string;
  pondCode: string; // snapshot kode kolam untuk tampilan
  species: string; // mis. "Lele Sangkuriang"
  stockDate: string; // tanggal tebar benih (yyyy-mm-dd)
  source: string; // asal benih (hatchery/pemasok)
  initialCount: number; // jumlah benih ditebar (ekor)
  sizeAtStock?: string; // ukuran benih, mis. "5-7 cm"
  seedCostRp: number; // total biaya benih
  otherCostRp: number; // biaya awal lain (kapur, probiotik, dll)
  targetDate?: string; // target tanggal panen
  targetWeightG?: number; // target bobot rata-rata per ekor (gram)
  status: CycleStatus;
  closedAt?: string;
  note?: string;
  actor: string;
  createdAt: string;
};

/** Catatan harian per siklus: pakan, kematian, dan sampling bobot. */
export type PondDailyLog = {
  id: string;
  cycleId: string;
  pondId: string;
  date: string; // yyyy-mm-dd
  session?: "Pagi" | "Sore" | "Tambahan"; // sesi pemberian pakan
  feedKg: number; // pakan hari itu (kg)
  feedBrand?: string; // merk pakan, mis. "Hi-Pro-Vite"
  feedType?: string; // jenis/kode pakan, mis. "781-2"
  feedCostRp: number; // biaya pakan hari itu (Rp)
  deaths: number; // kematian (ekor)
  avgWeightG?: number; // hasil sampling bobot rata-rata (gram/ekor)
  waterChanged?: boolean; // ganti/kuras air
  note?: string;
  actor: string;
  createdAt: string;
};

/** Panen (bisa sebagian/sortir atau total menutup siklus). */
export type PondHarvest = {
  id: string;
  cycleId: string;
  pondId: string;
  date: string; // yyyy-mm-dd
  count: number; // jumlah ekor dipanen
  weightKg: number; // total bobot panen (kg)
  pricePerKg: number; // harga jual per kg
  revenueRp: number; // weightKg * pricePerKg
  buyer?: string;
  isFinal: boolean; // true = panen total, menutup siklus
  note?: string;
  actor: string;
  createdAt: string;
};

export type JournalCategory =
  | "Kualitas Air"
  | "Kesehatan & Penyakit"
  | "Perlakuan"
  | "Cuaca"
  | "Pemeliharaan"
  | "Catatan Umum";

/** Jurnal/diary kolam: catatan kejadian, perlakuan, kondisi air, cuaca, dll. */
export type PondJournal = {
  id: string;
  pondId?: string; // kolam terkait (opsional; kosong = catatan umum)
  pondCode?: string;
  cycleId?: string;
  date: string; // yyyy-mm-dd
  category: JournalCategory;
  title: string;
  note: string;
  // ukuran air (opsional) untuk jurnal kualitas air
  waterTemp?: number; // suhu (°C)
  waterPh?: number; // pH
  photo?: string; // data URL
  actor: string;
  createdAt: string;
};

/* ── Keuangan Lele (penjualan, piutang, utang usaha, kas) ──────────────── */

export type PayMethod = "Tunai" | "Transfer" | "QRIS" | "Tempo";

/** Satu kali pembayaran/cicilan pada piutang atau utang. */
export type PaymentEntry = {
  id: string;
  date: string; // yyyy-mm-dd
  amount: number;
  method: PayMethod;
  note?: string;
};

/**
 * Penjualan lele (konsumsi/sortir/tampungan). PENTING: tidak ada validasi
 * bobot terhadap tebar — biomassa tumbuh, jumlah panen bisa jauh > tebar.
 */
export type LeleSale = {
  id: string;
  number: string;
  date: string; // yyyy-mm-dd
  buyer: string;
  item: string; // mis. "Lele Konsumsi", "Brojolan", "Sortir"
  pondCode?: string; // asal kolam (opsional)
  weightKg: number;
  pricePerKg: number;
  total: number; // total nilai penjualan (bisa diedit manual utk borongan)
  paid: number; // dibayar saat transaksi (sisa → piutang)
  method: PayMethod;
  note?: string;
  actor: string;
  createdAt: string;
};

/** Piutang: tagihan ke pembeli (penjualan tempo / kurang bayar). */
export type Receivable = {
  id: string;
  saleId?: string; // penjualan terkait (opsional)
  party: string; // nama pembeli
  description: string;
  amount: number; // total tagihan
  payments: PaymentEntry[]; // cicilan (bisa beberapa kali)
  dueDate?: string;
  actor: string;
  createdAt: string;
};

/** Utang usaha: kewajiban ke pemasok/pihak lain (pakan, benih, dll). */
export type Payable = {
  id: string;
  party: string; // pemasok / pihak
  description: string;
  amount: number;
  payments: PaymentEntry[];
  dueDate?: string;
  actor: string;
  createdAt: string;
};

export type FinanceKind = "masuk" | "keluar";

/** Kategori keuangan yang bisa diedit admin (mis. Bon, Ops Ardhi, Inves). */
export type FinanceCategory = {
  id: string;
  name: string;
  kind: FinanceKind | "both";
  createdAt: string;
};

/* ── Mutasi stok lele (ledger pergerakan biomassa antar-kolam) ─────────── */

export type LeleMoveType =
  | "MASUK" // tebar/masuk luar
  | "KELUAR" // keluar umum
  | "TRANSFER_KELUAR" // pindah ke kolam lain (sisi asal)
  | "TRANSFER_MASUK" // pindah dari kolam lain (sisi tujuan)
  | "SORTIR" // sortir grading
  | "PANEN" // panen
  | "PENJUALAN" // terjual
  | "KEMATIAN" // mati
  | "PENYUSUTAN" // susut (bukan omzet)
  | "PENYESUAIAN"; // koreksi stok

export type SortirKategori = "Konsumsi" | "Brojolan" | "Pemindahan";

/** Satu baris pergerakan fisik lele pada sebuah kolam. Informatif untuk laporan
 *  & jejak; transfer antar-kolam selalu tercatat berpasangan (keluar + masuk). */
export type LeleMovement = {
  id: string;
  date: string; // yyyy-mm-dd
  type: LeleMoveType;
  pondId: string;
  pondCode: string;
  toPondId?: string; // tujuan (transfer)
  toPondCode?: string;
  kategori?: SortirKategori;
  qtyKg?: number; // bobot (kg)
  qtyEkor?: number; // jumlah ekor
  ref?: string; // pasangan transfer / nomor rujukan
  note?: string;
  actor: string;
  createdAt: string;
};

/** Transaksi kas/keuangan umum di luar penjualan lele. */
export type FinanceTx = {
  id: string;
  date: string; // yyyy-mm-dd
  kind: FinanceKind;
  category: string; // nama kategori
  amount: number;
  party?: string;
  note?: string;
  actor: string;
  createdAt: string;
};

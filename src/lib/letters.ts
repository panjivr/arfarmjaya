import type { InvoiceLine, LetterColumns, LetterLine, LetterPurposeId } from "@/lib/types";

/** Perihal baku surat penagihan pertama (bukan somasi). */
export const PENAGIHAN_SUBJECT = "Penagihan Piutang Usaha";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

/** Tanggal kalender yyyy-mm-dd, tanpa geser zona waktu. */
export function formatLongDate(value?: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
  if (!match) return "-";
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return "-";
  return `${Number(match[3])} ${month} ${match[1]}`;
}

export function addCalendarDays(value: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Kode nomor surat: huruf dan angka, paling panjang 8 karakter. Kosong berarti SPH. */
export function sanitizeLetterCode(code?: string): string {
  return (code ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

/** Nomor surat resmi: 001/SPH/X/2026. Urutan mengikuti jumlah surat yang sudah ada. */
export function suggestLetterNumber(date: string, existingCount: number, code = "SPH"): string {
  const match = /^(\d{4})-(\d{2})/.exec(date);
  const year = match?.[1] ?? String(new Date().getFullYear());
  const month = match ? ROMAN[Number(match[2]) - 1] ?? ROMAN[new Date().getMonth()] : ROMAN[new Date().getMonth()];
  const prefix = sanitizeLetterCode(code) || "SPH";
  return `${String(existingCount + 1).padStart(3, "0")}/${prefix}/${month}/${year}`;
}

/** Angka menjadi kalimat terbilang rupiah. */
export function terbilang(value: number): string {
  const n = Math.floor(Math.abs(Number.isFinite(value) ? value : 0));
  const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  const words = (x: number): string => {
    if (x < 12) return satuan[x];
    if (x < 20) return `${words(x - 10)} belas`;
    if (x < 100) return `${words(Math.floor(x / 10))} puluh${x % 10 ? ` ${words(x % 10)}` : ""}`;
    if (x < 200) return `seratus${x - 100 ? ` ${words(x - 100)}` : ""}`;
    if (x < 1000) return `${words(Math.floor(x / 100))} ratus${x % 100 ? ` ${words(x % 100)}` : ""}`;
    if (x < 2000) return `seribu${x - 1000 ? ` ${words(x - 1000)}` : ""}`;
    if (x < 1_000_000) return `${words(Math.floor(x / 1000))} ribu${x % 1000 ? ` ${words(x % 1000)}` : ""}`;
    if (x < 1_000_000_000) return `${words(Math.floor(x / 1_000_000))} juta${x % 1_000_000 ? ` ${words(x % 1_000_000)}` : ""}`;
    if (x < 1_000_000_000_000) return `${words(Math.floor(x / 1_000_000_000))} miliar${x % 1_000_000_000 ? ` ${words(x % 1_000_000_000)}` : ""}`;
    return `${words(Math.floor(x / 1_000_000_000_000))} triliun${x % 1_000_000_000_000 ? ` ${words(x % 1_000_000_000_000)}` : ""}`;
  };
  const text = (n === 0 ? "nol" : words(n)).replace(/\s+/g, " ").trim();
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} rupiah`;
}

export function letterTotal(lines: Pick<LetterLine, "amount">[]): number {
  return lines.reduce((sum, line) => sum + (Number.isFinite(line.amount) ? line.amount : 0), 0);
}

export type PenagihanContext = {
  storeName: string;
  recipient: string;
  reference?: string;
  dueDate?: string;
  total: number;
};

/**
 * Paragraf pembuka surat penagihan pertama.
 * Nada formal dan sopan: menyatakan piutang, lalu mengantar tabel rincian.
 */
export function penagihanOpening(ctx: PenagihanContext): string {
  const who = ctx.recipient.trim() || "Bapak/Ibu";
  const store = ctx.storeName.trim() || "kami";
  const reference = ctx.reference?.trim();
  const lead = reference
    ? `Merujuk pada ${reference}, bersama surat ini kami sampaikan penagihan atas kewajiban pembayaran ${who} kepada ${store} yang hingga tanggal surat ini belum kami terima.`
    : `Bersama surat ini kami sampaikan penagihan atas kewajiban pembayaran ${who} kepada ${store} yang hingga tanggal surat ini belum kami terima.`;
  return [
    "Dengan hormat,",
    "",
    lead,
    "",
    "Adapun rincian barang dan nilai tagihan yang menjadi dasar penagihan adalah sebagai berikut:",
  ].join("\n");
}

/**
 * Paragraf penutup: nominal, batas waktu, cara bayar, klausul bila sudah lunas,
 * dan ucapan terima kasih. Klausul "abaikan bila sudah dibayar" adalah kelaziman
 * surat penagihan komersial agar tidak menagih piutang yang sudah diselesaikan.
 */
export function penagihanClosing(ctx: PenagihanContext): string {
  const due = ctx.dueDate ? formatLongDate(ctx.dueDate) : "tanggal yang kami sepakati bersama";
  const nominal = rupiah.format(Math.round(ctx.total) || 0);
  return [
    `Jumlah seluruh tagihan adalah ${nominal} (${terbilang(ctx.total)}).`,
    "",
    `Kami mohon kesediaan Bapak/Ibu untuk menyelesaikan pembayaran tersebut paling lambat pada ${due}. Pembayaran dapat ditransfer ke rekening yang tercantum pada surat ini. Mohon mencantumkan nomor surat pada berita transfer agar pencatatan dapat dilakukan dengan tepat.`,
    "",
    "Apabila pembayaran telah dilakukan sebelum surat ini diterima, mohon abaikan surat penagihan ini dan sampaikan bukti pembayaran kepada kami agar catatan piutang dapat segera disesuaikan.",
    "",
    "Demikian surat penagihan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.",
  ].join("\n");
}

/** Salin baris invoice menjadi baris tagihan tanpa mengubah invoice asalnya. */
export function linesFromInvoice(lines: InvoiceLine[]): LetterLine[] {
  return lines.map((line) => ({
    name: line.name,
    quantity: line.quantity,
    unit: line.unit,
    note: "",
    amount: Math.round((Number(line.price) || 0) * (Number(line.quantity) || 0)),
  }));
}

export function cleanLetterLines(lines: LetterLine[]): LetterLine[] {
  return lines
    .map((line) => ({
      name: line.name.trim(),
      quantity: Number(line.quantity) || 0,
      unit: line.unit.trim() || "Pcs",
      note: line.note.trim(),
      amount: Number(line.amount) || 0,
    }))
    .filter((line) => line.name.length > 0);
}

export type LetterPurpose = {
  id: LetterPurposeId;
  label: string;
  hint: string;
  heading: string;
  code: string;
  subject: string;
  columns: LetterColumns;
  totalLabel: string;
  paymentTitle: string;
  paymentHint: string;
  signOff: string;
  itemPlaceholder: string;
  unit: string;
};

export const LETTER_PURPOSES: LetterPurpose[] = [
  {
    id: "barang",
    label: "Penagihan hutang barang",
    hint: "Anda menagih pembeli atas barang yang belum dibayar.",
    heading: "Surat Penagihan",
    code: "SPH",
    subject: PENAGIHAN_SUBJECT,
    columns: { item: "Barang", quantity: "Jumlah", note: "Keterangan", amount: "Jumlah (Rp)" },
    totalLabel: "TOTAL TAGIHAN",
    paymentTitle: "Informasi Pembayaran",
    paymentHint: "Rekening yang menerima pembayaran dari pelanggan.",
    signOff: "Hormat kami,",
    itemPlaceholder: "Pakcoy",
    unit: "Kg",
  },
  {
    id: "kasbon",
    label: "Penagihan kasbon karyawan",
    hint: "Anda menagih karyawan atas kasbon atau pinjaman. Kolom uraian, bukan barang.",
    heading: "Surat Penagihan",
    code: "SPK",
    subject: "Penagihan Kasbon Karyawan",
    columns: { item: "Uraian", quantity: "Jumlah", note: "Keterangan", amount: "Nominal (Rp)" },
    totalLabel: "TOTAL TAGIHAN",
    paymentTitle: "Informasi Pembayaran",
    paymentHint: "Rekening yang menerima pelunasan kasbon.",
    signOff: "Hormat kami,",
    itemPlaceholder: "Kasbon Oktober 2026",
    unit: "Kali",
  },
  {
    id: "gaji",
    label: "Pemberitahuan hutang gaji",
    hint: "Anda memberitahu karyawan bahwa gaji belum dibayar. Kolom komponen, bukan barang.",
    heading: "Surat Pemberitahuan",
    code: "SHG",
    subject: "Pemberitahuan Hutang Gaji",
    columns: { item: "Komponen", quantity: "Jumlah", note: "Keterangan", amount: "Nominal (Rp)" },
    totalLabel: "TOTAL HUTANG",
    paymentTitle: "Informasi Pembayaran",
    paymentHint: "Rekening karyawan, bila gaji ditransfer.",
    signOff: "Hormat kami,",
    itemPlaceholder: "Gaji pokok Oktober 2026",
    unit: "Bulan",
  },
  {
    id: "perusahaan",
    label: "Pemberitahuan hutang ke perusahaan",
    hint: "Anda menyatakan hutang kepada perusahaan atau vendor lain.",
    heading: "Surat Pemberitahuan",
    code: "SHU",
    subject: "Pemberitahuan Hutang Usaha",
    columns: { item: "Uraian", quantity: "Jumlah", note: "Keterangan", amount: "Nilai (Rp)" },
    totalLabel: "TOTAL HUTANG",
    paymentTitle: "Informasi Pembayaran",
    paymentHint: "Rekening perusahaan yang akan menerima pembayaran.",
    signOff: "Hormat kami,",
    itemPlaceholder: "Jasa angkut September 2026",
    unit: "Inv",
  },
  {
    id: "bebas",
    label: "Surat bebas",
    hint: "Teks netral. Semua judul, kolom, dan isi Anda atur sendiri.",
    heading: "Surat",
    code: "SRT",
    subject: "Pemberitahuan",
    columns: { item: "Uraian", quantity: "Jumlah", note: "Keterangan", amount: "Jumlah (Rp)" },
    totalLabel: "TOTAL",
    paymentTitle: "Informasi Pembayaran",
    paymentHint: "Rekening atau catatan pembayaran, bila perlu.",
    signOff: "Hormat kami,",
    itemPlaceholder: "Uraian",
    unit: "Pcs",
  },
];

export function letterPurpose(id?: string): LetterPurpose {
  return LETTER_PURPOSES.find((item) => item.id === id) ?? LETTER_PURPOSES[0];
}

type LetterChromeInput = {
  purpose?: string;
  heading?: string;
  code?: string;
  subject?: string;
  columns?: Partial<LetterColumns>;
  totalLabel?: string;
  paymentTitle?: string;
  signOff?: string;
};

/** Label yang benar-benar tercetak. Field kosong jatuh ke baku maksud surat. Surat lama tanpa field tetap penagihan barang. */
export function resolveLetterChrome(input?: LetterChromeInput): LetterPurpose {
  const base = letterPurpose(input?.purpose);
  const columns = input?.columns;
  return {
    ...base,
    heading: input?.heading?.trim() || base.heading,
    code: sanitizeLetterCode(input?.code) || base.code,
    subject: input?.subject?.trim() || base.subject,
    columns: {
      item: columns?.item?.trim() || base.columns.item,
      quantity: columns?.quantity?.trim() || base.columns.quantity,
      note: columns?.note?.trim() || base.columns.note,
      amount: columns?.amount?.trim() || base.columns.amount,
    },
    totalLabel: input?.totalLabel?.trim() || base.totalLabel,
    paymentTitle: input?.paymentTitle?.trim() || base.paymentTitle,
    signOff: input?.signOff?.trim() || base.signOff,
  };
}

function parties(ctx: PenagihanContext) {
  return {
    who: ctx.recipient.trim() || "Bapak/Ibu",
    store: ctx.storeName.trim() || "kami",
    reference: ctx.reference?.trim() ?? "",
    due: ctx.dueDate ? formatLongDate(ctx.dueDate) : "tanggal yang kami sepakati bersama",
    nominal: rupiah.format(Math.round(ctx.total) || 0),
    words: terbilang(ctx.total),
  };
}

function withReference(reference: string, sentence: string): string {
  if (reference) return `Merujuk pada ${reference}, ${sentence}`;
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}`;
}

function kasbonOpening(ctx: PenagihanContext): string {
  const { who, store, reference } = parties(ctx);
  const lead = withReference(
    reference,
    `bersama surat ini kami sampaikan penagihan atas kasbon atau pinjaman ${who} kepada ${store} yang hingga tanggal surat ini belum diselesaikan.`,
  );
  return ["Dengan hormat,", "", lead, "", "Adapun rincian kewajiban tersebut adalah sebagai berikut:"].join("\n");
}

function kasbonClosing(ctx: PenagihanContext): string {
  const { due, nominal, words } = parties(ctx);
  return [
    `Jumlah seluruh tagihan adalah ${nominal} (${words}).`,
    "",
    `Kami mohon kesediaan Bapak/Ibu untuk menyelesaikan kewajiban tersebut paling lambat pada ${due}. Pelunasan dapat dilakukan secara tunai, ditransfer ke rekening pada surat ini, atau diperhitungkan pada gaji sesuai kesepakatan. Mohon mencantumkan nomor surat pada berita transfer bila dibayar melalui transfer.`,
    "",
    "Apabila kewajiban telah diselesaikan sebelum surat ini diterima, mohon abaikan surat ini dan sampaikan bukti pelunasan agar catatan dapat segera disesuaikan.",
    "",
    "Demikian surat penagihan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.",
  ].join("\n");
}

function gajiOpening(ctx: PenagihanContext): string {
  const { who, store, reference } = parties(ctx);
  const lead = withReference(
    reference,
    `bersama surat ini kami memberitahukan bahwa ${store} masih memiliki kewajiban pembayaran gaji dan tunjangan kepada ${who} yang hingga tanggal surat ini belum diselesaikan.`,
  );
  return ["Dengan hormat,", "", lead, "", "Adapun rincian komponen kewajiban tersebut adalah sebagai berikut:"].join("\n");
}

function gajiClosing(ctx: PenagihanContext): string {
  const { due, nominal, words } = parties(ctx);
  return [
    `Jumlah seluruh kewajiban adalah ${nominal} (${words}).`,
    "",
    `Pembayaran akan kami selesaikan paling lambat pada ${due}. Apabila terdapat perbedaan rincian, mohon disampaikan kepada kami agar catatan dapat segera disesuaikan.`,
    "",
    "Apabila pembayaran telah kami lakukan sebelum surat ini diterima, mohon abaikan pemberitahuan ini dan sampaikan bukti penerimaan agar catatan hutang dapat ditutup.",
    "",
    "Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.",
  ].join("\n");
}

function perusahaanOpening(ctx: PenagihanContext): string {
  const { who, store, reference } = parties(ctx);
  const lead = withReference(
    reference,
    `bersama surat ini kami memberitahukan bahwa ${store} masih memiliki kewajiban pembayaran kepada ${who} yang hingga tanggal surat ini belum kami selesaikan.`,
  );
  return ["Dengan hormat,", "", lead, "", "Adapun rincian kewajiban yang menjadi dasar surat ini adalah sebagai berikut:"].join("\n");
}

function perusahaanClosing(ctx: PenagihanContext): string {
  const { due, nominal, words } = parties(ctx);
  return [
    `Jumlah seluruh kewajiban adalah ${nominal} (${words}).`,
    "",
    `Kami akan menyelesaikan pembayaran tersebut paling lambat pada ${due}. Pembayaran ditransfer ke rekening yang tercantum pada surat ini. Mohon konfirmasi penerimaan agar pencatatan kedua belah pihak sesuai.`,
    "",
    "Apabila pembayaran telah kami lakukan sebelum surat ini diterima, mohon abaikan pemberitahuan ini dan sampaikan bukti penerimaan.",
    "",
    "Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.",
  ].join("\n");
}

function bebasOpening(ctx: PenagihanContext): string {
  const { who, reference } = parties(ctx);
  const lead = withReference(
    reference,
    `bersama surat ini kami sampaikan kepada ${who} hal sebagaimana tercantum pada perihal.`,
  );
  return ["Dengan hormat,", "", lead, "", "Rincian yang menyertai surat ini adalah sebagai berikut:"].join("\n");
}

function bebasClosing(ctx: PenagihanContext): string {
  const { due, nominal, words } = parties(ctx);
  return [
    `Jumlah seluruhnya adalah ${nominal} (${words}).`,
    "",
    `Mohon perhatian Bapak/Ibu atas hal tersebut paling lambat pada ${due}.`,
    "",
    "Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.",
  ].join("\n");
}

/** Teks profesional sesuai maksud surat. Penagihan barang memakai naskah yang sudah ada. */
export function letterProse(purpose: LetterPurposeId, ctx: PenagihanContext): { opening: string; closing: string } {
  if (purpose === "kasbon") return { opening: kasbonOpening(ctx), closing: kasbonClosing(ctx) };
  if (purpose === "gaji") return { opening: gajiOpening(ctx), closing: gajiClosing(ctx) };
  if (purpose === "perusahaan") return { opening: perusahaanOpening(ctx), closing: perusahaanClosing(ctx) };
  if (purpose === "bebas") return { opening: bebasOpening(ctx), closing: bebasClosing(ctx) };
  return { opening: penagihanOpening(ctx), closing: penagihanClosing(ctx) };
}

import type { InvoiceLine, LetterLine } from "@/lib/types";

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

/** Nomor surat resmi: 001/SPH/X/2026. Urutan mengikuti jumlah surat yang sudah ada. */
export function suggestLetterNumber(date: string, existingCount: number): string {
  const match = /^(\d{4})-(\d{2})/.exec(date);
  const year = match?.[1] ?? String(new Date().getFullYear());
  const month = match ? ROMAN[Number(match[2]) - 1] ?? ROMAN[new Date().getMonth()] : ROMAN[new Date().getMonth()];
  return `${String(existingCount + 1).padStart(3, "0")}/SPH/${month}/${year}`;
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

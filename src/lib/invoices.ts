import type { Invoice, InvoiceInput, InvoiceLine } from "./types";

// Rupiah bulat, sama dengan format angka yang dicetak. Pembulatan per baris
// membuat penjumlahan kolom Jumlah selalu cocok dengan subtotal.
export function invoiceLineTotal(line: InvoiceLine): number {
  return Math.round(line.price * line.quantity);
}

export function invoiceTotals(lines: InvoiceLine[], shipping = 0, discount = 0) {
  const subtotal = lines.reduce((sum, line) => sum + invoiceLineTotal(line), 0);
  return { subtotal, shipping, discount, total: subtotal + shipping - discount };
}

export function suggestInvoiceNumber(prefix: string, invoices: Pick<Invoice, "number">[]): string {
  const normalized = prefix.trim() || "INV";
  let next = 1;
  for (const inv of invoices) {
    if (!inv.number.startsWith(normalized)) continue;
    const suffix = inv.number.slice(normalized.length);
    if (/^\d+$/.test(suffix) && Number.isSafeInteger(Number(suffix))) next = Math.max(next, Number(suffix) + 1);
  }
  const used = new Set(invoices.map((i) => i.number));
  while (used.has(`${normalized}${String(next).padStart(4, "0")}`)) next++;
  return `${normalized}${String(next).padStart(4, "0")}`;
}

const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export function invoiceInputError(data: InvoiceInput): string | null {
  if (!data.buyer.trim()) return "Nama pembeli wajib diisi.";
  if (!validDate(data.date)) return "Tanggal invoice tidak valid.";
  if (data.dueDate && (!validDate(data.dueDate) || data.dueDate < data.date)) return "Jatuh tempo harus sama atau setelah tanggal invoice.";
  if (data.lines.length === 0) return "Tambahkan minimal satu barang.";
  if (data.lines.some((line) => !line.name.trim() || !line.unit.trim() || !Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(line.price) || line.price < 0)) return "Periksa nama, satuan, jumlah, dan harga barang. Jumlah harus lebih dari nol dan harga tidak boleh negatif.";
  const { subtotal, total } = invoiceTotals(data.lines, data.shipping, data.discount ?? 0);
  if (![subtotal, total, data.shipping, data.discount ?? 0].every((n) => Number.isSafeInteger(n) && n >= 0)) return "Ongkir dan diskon harus berupa rupiah bulat yang valid. Diskon tidak boleh melebihi subtotal + ongkir.";
  return null;
}

/** Ubah angka menjadi kalimat "terbilang" bahasa Indonesia. */
export function invoiceInWords(value: number): string {
  const n = Math.floor(Math.abs(value));
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

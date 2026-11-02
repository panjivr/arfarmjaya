// Tanda tangan elektronik surat. Pola yang sama dengan invoice: SHA-256 atas
// isi yang dikanonikalisasi, kode dokumen dari hash, QR ringkas untuk dipindai.
// Bukan PSrE negara. Format kanonik invoice tidak diubah di sini.

import type { InvoiceSignature } from "@/lib/types";

export type SignableLetter = {
  number: string;
  storeName: string;
  recipient: string;
  place: string;
  date: string;
  dueDate?: string;
  subject: string;
  reference?: string;
  opening: string;
  closing: string;
  lines: { name: string; unit: string; quantity: number; note: string; amount: number }[];
  total: number;
  purpose?: string;
  heading?: string;
  code?: string;
  columns?: { item: string; quantity: string; note: string; amount: string };
  totalLabel?: string;
  paymentTitle?: string;
  signOff?: string;
};

/** String kanonik yang di-hash. Urutan tetap agar surat yang sama selalu menghasilkan sidik yang sama. */
export function letterCanonical(letter: SignableLetter): string {
  const lines = letter.lines
    .map((line) => `${line.name.trim()}|${line.unit.trim()}|${line.quantity}|${line.note.trim()}|${line.amount}`)
    .join(";");
  const columns = letter.columns;
  return [
    `no=${letter.number.trim()}`,
    `toko=${letter.storeName.trim()}`,
    `penerima=${letter.recipient.trim()}`,
    `tempat=${letter.place.trim()}`,
    `tgl=${letter.date}`,
    `tempo=${letter.dueDate ?? ""}`,
    `perihal=${letter.subject.trim()}`,
    `ref=${(letter.reference ?? "").trim()}`,
    `buka=${letter.opening.trim()}`,
    `tutup=${letter.closing.trim()}`,
    `items=${lines}`,
    `total=${letter.total}`,
    `maksud=${letter.purpose ?? ""}`,
    `judul=${(letter.heading ?? "").trim()}`,
    `kode=${(letter.code ?? "").trim()}`,
    `kolom=${columns ? `${columns.item.trim()}|${columns.quantity.trim()}|${columns.note.trim()}|${columns.amount.trim()}` : ""}`,
    `label=${(letter.totalLabel ?? "").trim()}`,
    `bayar=${(letter.paymentTitle ?? "").trim()}`,
    `salam=${(letter.signOff ?? "").trim()}`,
  ].join("\n");
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function orgInitials(name?: string): string {
  const skip = new Set(["PT", "CV", "UD", "PD", "YAYASAN", "KOPERASI"]);
  const words = (name ?? "")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !skip.has(word.toUpperCase()));
  return words.slice(0, 3).map((word) => word[0]).join("").toUpperCase() || "TTE";
}

function codeFromHash(hash: string, storeName?: string): string {
  const up = hash.toUpperCase();
  return `${orgInitials(storeName)}-${up.slice(0, 4)}-${up.slice(4, 8)}-${up.slice(8, 12)}`;
}

/**
 * Bangun tanda tangan elektronik surat.
 * `signedAt` (ISO) boleh diisi; bila kosong memakai waktu sekarang.
 * Waktu tanda tangan tidak masuk hash — yang di-hash adalah isi surat.
 */
export async function buildLetterSignature(
  letter: SignableLetter,
  signerName: string,
  signedAt?: string,
): Promise<InvoiceSignature> {
  const hash = await sha256Hex(letterCanonical(letter));
  const when = signedAt && !Number.isNaN(Date.parse(signedAt)) ? new Date(signedAt).toISOString() : new Date().toISOString();
  return {
    signedBy: signerName.trim() || letter.storeName.trim() || "Penandatangan",
    signedAt: when,
    hash,
    code: codeFromHash(hash, letter.storeName),
    algo: "SHA-256",
  };
}

/** Isi QR sengaja ringkas agar kotak tetap besar dan mudah dipindai. Hash lengkap tercetak sebagai teks. */
export function letterQrPayload(letter: SignableLetter, sig: InvoiceSignature): string {
  return [
    `${letter.storeName || "Dokumen"} e-TTD`,
    `No:${letter.number}`,
    `Rp${letter.total.toLocaleString("id-ID")}`,
    `Kode:${sig.code}`,
  ].join("\n");
}

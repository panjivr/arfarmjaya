// Tanda tangan elektronik invoice (kriptografis, internal — bukan PSrE negara).
//
// Prinsip: kita hitung SHA-256 atas ISI invoice yang dikanonikalisasi. Hash ini
// menjadi sidik jari dokumen: bila satu angka/nama pun berubah, hash berubah,
// sehingga cetakan lama tak lagi cocok — inilah bukti keutuhan (integritas).
// `code` diturunkan dari hash agar mudah dirujuk, dan QR memuat fakta + hash
// untuk verifikasi manual saat dipindai.

import type { InvoiceSignature } from "@/lib/types";

export type SignableInvoice = {
  number: string;
  storeName: string;
  buyer: string;
  date: string;
  lines: { name: string; unit: string; quantity: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
};

/** String kanonik yang di-hash — urutan & format tetap agar hasil konsisten. */
function canonical(inv: SignableInvoice): string {
  const lines = inv.lines
    .map((l) => `${l.name.trim()}|${l.unit.trim()}|${l.quantity}|${l.price}`)
    .join(";");
  return [
    `no=${inv.number.trim()}`,
    `toko=${inv.storeName.trim()}`,
    `pembeli=${inv.buyer.trim()}`,
    `tgl=${inv.date}`,
    `items=${lines}`,
    `sub=${inv.subtotal}`,
    `ongkir=${inv.shipping}`,
    `total=${inv.total}`,
  ].join("\n");
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Kode dokumen singkat & mudah dibaca dari hash: AFJ-XXXX-XXXX-XXXX. */
function codeFromHash(hash: string): string {
  const up = hash.toUpperCase();
  return `AFJ-${up.slice(0, 4)}-${up.slice(4, 8)}-${up.slice(8, 12)}`;
}

/**
 * Bangun tanda tangan elektronik untuk sebuah invoice.
 * `signedAt` (ISO) boleh diisi agar tanggal/waktu tanda tangan dapat dipilih;
 * bila kosong memakai waktu sekarang.
 */
export async function buildInvoiceSignature(
  inv: SignableInvoice,
  signerName: string,
  signedAt?: string,
): Promise<InvoiceSignature> {
  const hash = await sha256Hex(canonical(inv));
  const when = signedAt && !Number.isNaN(Date.parse(signedAt)) ? new Date(signedAt).toISOString() : new Date().toISOString();
  return {
    signedBy: signerName.trim() || inv.storeName.trim() || "Penjual",
    signedAt: when,
    hash,
    code: codeFromHash(hash),
    algo: "SHA-256",
  };
}

/**
 * Isi QR verifikasi — SENGAJA ringkas agar kotak QR besar & mudah dipindai.
 * Hash lengkap tetap tercetak sebagai teks; QR memuat kode dokumen (turunan
 * hash) + fakta utama, cukup untuk merujuk & mengecek keaslian invoice.
 */
export function invoiceQrPayload(inv: SignableInvoice, sig: InvoiceSignature): string {
  return [
    "AR FARM JAYA e-TTD",
    `No:${inv.number}`,
    `Rp${inv.total.toLocaleString("id-ID")}`,
    `Kode:${sig.code}`,
  ].join("\n");
}

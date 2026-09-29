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

/** Bangun tanda tangan elektronik untuk sebuah invoice. */
export async function buildInvoiceSignature(inv: SignableInvoice, signerName: string): Promise<InvoiceSignature> {
  const hash = await sha256Hex(canonical(inv));
  return {
    signedBy: signerName.trim() || inv.storeName.trim() || "Penjual",
    signedAt: new Date().toISOString(),
    hash,
    code: codeFromHash(hash),
    algo: "SHA-256",
  };
}

/** Isi QR verifikasi — memuat fakta utama + hash agar bisa dicek saat dipindai. */
export function invoiceQrPayload(inv: SignableInvoice, sig: InvoiceSignature): string {
  return [
    "AR FARM JAYA - Tanda Tangan Elektronik",
    `No: ${inv.number}`,
    `Tanggal: ${inv.date}`,
    `Pembeli: ${inv.buyer}`,
    `Total: Rp${inv.total.toLocaleString("id-ID")}`,
    `Penandatangan: ${sig.signedBy}`,
    `Kode: ${sig.code}`,
    `Algoritma: ${sig.algo}`,
    `Hash: ${sig.hash}`,
  ].join("\n");
}

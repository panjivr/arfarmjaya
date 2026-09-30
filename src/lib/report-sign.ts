// Tanda tangan elektronik untuk Laporan/LPJ (kriptografis internal, bukan PSrE
// negara). Hash SHA-256 atas isi laporan menjadi sidik jari dokumen; kode
// dokumen diturunkan dari hash dan dipakai pada QR verifikasi di blok tanda
// tangan. Selaras dengan tanda tangan elektronik invoice.

export type ReportSignature = { hash: string; code: string; algo: string; signedAt: string };

export async function buildReportSignature(canonical: string, signedAt?: string): Promise<ReportSignature> {
  const data = new TextEncoder().encode(canonical);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const hash = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const up = hash.toUpperCase();
  const code = `AFJ-${up.slice(0, 4)}-${up.slice(4, 8)}-${up.slice(8, 12)}`;
  const when = signedAt && !Number.isNaN(Date.parse(signedAt)) ? new Date(signedAt).toISOString() : new Date().toISOString();
  return { hash, code, algo: "SHA-256", signedAt: when };
}

/**
 * QR verifikasi — memuat nama terang penanda tangan & waktu tanda tangan
 * agar terlihat saat dipindai, tetap ringkas supaya kotak besar & mudah dibaca.
 */
export function reportQrPayload(input: {
  number: string;
  total: number;
  code: string;
  signer: string;
  signedAt: string; // sudah diformat untuk ditampilkan
}): string {
  return [
    "AR FARM JAYA e-TTD",
    `No:${input.number}`,
    `Rp${input.total.toLocaleString("id-ID")}`,
    `Penandatangan:${input.signer}`,
    `Waktu:${input.signedAt}`,
    `Kode:${input.code}`,
  ].join("\n");
}

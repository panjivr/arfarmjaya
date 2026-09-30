// Tanda tangan elektronik untuk Laporan/LPJ (kriptografis internal, bukan PSrE
// negara). Hash SHA-256 atas isi laporan menjadi sidik jari dokumen; kode
// dokumen diturunkan dari hash dan dipakai pada QR verifikasi di blok tanda
// tangan. Selaras dengan tanda tangan elektronik invoice.

export type ReportSignature = { hash: string; code: string; algo: string };

export async function buildReportSignature(canonical: string): Promise<ReportSignature> {
  const data = new TextEncoder().encode(canonical);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const hash = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const up = hash.toUpperCase();
  const code = `AFJ-${up.slice(0, 4)}-${up.slice(4, 8)}-${up.slice(8, 12)}`;
  return { hash, code, algo: "SHA-256" };
}

/** QR verifikasi ringkas — kotak besar & mudah dipindai; hash lengkap tercetak sebagai teks. */
export function reportQrPayload(input: { number: string; total: number; code: string }): string {
  return [
    "AR FARM JAYA e-TTD",
    `No:${input.number}`,
    `Rp${input.total.toLocaleString("id-ID")}`,
    `Kode:${input.code}`,
  ].join("\n");
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLetterSignature, letterCanonical, letterQrPayload, type SignableLetter } from "../src/lib/letter-sign";

const sample = (): SignableLetter => ({
  number: "001/SPH/XI/2026",
  storeName: "UD Gemilang",
  recipient: "SPPG Ngraket",
  place: "Ponorogo",
  date: "2026-11-02",
  dueDate: "2026-11-09",
  subject: "Penagihan Piutang Usaha",
  reference: "Invoice INV0007",
  opening: "Dengan hormat,",
  closing: "Mohon pembayaran.",
  lines: [{ name: "Pakcoy", unit: "Kg", quantity: 2, note: "minggu lalu", amount: 16000 }],
  total: 16000,
  purpose: "barang",
  heading: "Surat Penagihan",
  code: "SPH",
  columns: { item: "Barang", quantity: "Jumlah", note: "Keterangan", amount: "Jumlah (Rp)" },
  totalLabel: "TOTAL TAGIHAN",
  paymentTitle: "Pembayaran",
  signOff: "Hormat kami,",
});

test("sidik surat stabil untuk isi yang sama dan berubah bila nominal berubah", async () => {
  const when = "2026-11-02T01:00:00.000Z";
  const first = await buildLetterSignature(sample(), "AR FARM JAYA", when);
  const second = await buildLetterSignature(sample(), "AR FARM JAYA", when);
  assert.equal(first.hash, second.hash);
  assert.equal(first.hash.length, 64);
  assert.match(first.hash, /^[0-9a-f]{64}$/);
  assert.equal(first.code, second.code);
  assert.match(first.code, /^G-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
  assert.equal(first.algo, "SHA-256");
  assert.equal(first.signedBy, "AR FARM JAYA");
  assert.equal(first.signedAt, when);

  const changed = sample();
  changed.lines = [{ ...changed.lines[0], amount: 17000 }];
  changed.total = 17000;
  const next = await buildLetterSignature(changed, "AR FARM JAYA", when);
  assert.notEqual(next.hash, first.hash);
  assert.notEqual(next.code, first.code);
});

test("waktu tanda tangan tidak mengubah hash, isi kanonik memuat teks surat", async () => {
  const letter = sample();
  const early = await buildLetterSignature(letter, "Bendahara", "2026-11-02T01:00:00.000Z");
  const later = await buildLetterSignature(letter, "Bendahara", "2026-11-03T08:30:00.000Z");
  assert.equal(early.hash, later.hash);
  assert.equal(later.signedAt, "2026-11-03T08:30:00.000Z");

  const text = letterCanonical(letter);
  assert.match(text, /no=001\/SPH\/XI\/2026/);
  assert.match(text, /toko=UD Gemilang/);
  assert.match(text, /items=Pakcoy\|Kg\|2\|minggu lalu\|16000/);
  assert.match(text, /judul=Surat Penagihan/);
  assert.doesNotMatch(text, /signedAt|Bendahara/);
});

test("kode mengikuti inisial toko dan QR tetap ringkas", async () => {
  const letter = { ...sample(), storeName: "AR FARM JAYA" };
  const sig = await buildLetterSignature(letter, "", "2026-11-02T01:00:00.000Z");
  assert.match(sig.code, /^AFJ-/);
  assert.equal(sig.signedBy, "AR FARM JAYA");
  const qr = letterQrPayload(letter, sig);
  assert.match(qr, /No:001\/SPH\/XI\/2026/);
  assert.match(qr, new RegExp(`Kode:${sig.code}`));
  assert.equal(qr.includes(sig.hash), false);
});

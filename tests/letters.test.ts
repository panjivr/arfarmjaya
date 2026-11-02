import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PENAGIHAN_SUBJECT,
  addCalendarDays,
  cleanLetterLines,
  formatLongDate,
  letterProse,
  letterTotal,
  linesFromInvoice,
  penagihanClosing,
  penagihanOpening,
  resolveLetterChrome,
  suggestLetterNumber,
  terbilang,
} from "../src/lib/letters";
import { parseWorkspace, WORKSPACE_KEYS } from "../src/lib/workspace-data";

test("surat ikut koleksi yang disinkronkan, cadangan lama tanpa surat tetap sah", () => {
  assert.ok(WORKSPACE_KEYS.includes("letters"));
  const full = Object.fromEntries(WORKSPACE_KEYS.map((key) => [key, key === "settings"
    ? { companyName: "Perusahaan", address: "", phone: "", taxNumber: "", currency: "IDR", lowStockThreshold: 5, expiryWarningDays: 30 }
    : []]));
  const { letters: _letters, ...legacy } = full;
  const parsed = parseWorkspace(legacy);
  assert.equal("letters" in parsed, false);
  assert.equal(parseWorkspace(full, true).letters instanceof Array, true);
});

test("nomor, tanggal, dan jatuh tempo surat penagihan", () => {
  assert.equal(suggestLetterNumber("2026-10-31", 0), "001/SPH/X/2026");
  assert.equal(suggestLetterNumber("2026-10-31", 11), "012/SPH/X/2026");
  assert.equal(formatLongDate("2026-10-31"), "31 Oktober 2026");
  assert.equal(addCalendarDays("2026-10-31", 7), "2026-11-07");
  assert.equal(terbilang(1500000), "Satu juta lima ratus ribu rupiah");
  assert.equal(terbilang(0), "Nol rupiah");
});

test("teks profesional memuat unsur surat penagihan pertama", () => {
  const ctx = {
    storeName: "AR FARM JAYA",
    recipient: "SPPG Ngraket",
    reference: "Invoice INV0007 tanggal 1 Oktober 2026",
    dueDate: "2026-11-07",
    total: 250000,
  };
  const opening = penagihanOpening(ctx);
  const closing = penagihanClosing(ctx);
  assert.match(opening, /^Dengan hormat,/);
  assert.match(opening, /Invoice INV0007/);
  assert.match(opening, /SPPG Ngraket/);
  assert.match(opening, /AR FARM JAYA/);
  assert.match(opening, /rincian barang/i);
  assert.match(closing, /Rp\s*250\.000/);
  assert.match(closing, /7 November 2026/);
  assert.match(closing, /paling lambat/i);
  assert.match(closing, /bukti pembayaran/i);
  assert.match(closing, /abaikan surat penagihan/i);
  assert.match(closing, /terima kasih/i);
  assert.equal(PENAGIHAN_SUBJECT, "Penagihan Piutang Usaha");
});

test("baris tagihan dijumlahkan dan bisa disalin dari invoice tanpa mengubah sumber", () => {
  const invoiceLines = [
    { name: "Pakcoy", unit: "Kg", quantity: 2, price: 8000 },
    { name: "Kangkung", unit: "Ikat", quantity: 3, price: 2000 },
  ];
  const copied = linesFromInvoice(invoiceLines);
  assert.deepEqual(copied, [
    { name: "Pakcoy", quantity: 2, unit: "Kg", note: "", amount: 16000 },
    { name: "Kangkung", quantity: 3, unit: "Ikat", note: "", amount: 6000 },
  ]);
  assert.equal(invoiceLines[0].price, 8000);
  const cleaned = cleanLetterLines([
    { name: "  Beras  ", quantity: 1, unit: "", note: "  hutang minggu lalu ", amount: 50000 },
    { name: "   ", quantity: 4, unit: "Kg", note: "kosong", amount: 1000 },
  ]);
  assert.deepEqual(cleaned, [{ name: "Beras", quantity: 1, unit: "Pcs", note: "hutang minggu lalu", amount: 50000 }]);
  assert.equal(letterTotal(cleaned), 50000);
  assert.equal(letterTotal([{ amount: Number.NaN }, { amount: 10 }]), 10);
});

test("maksud surat mengganti nada dan judul kolom tanpa mengunci kata barang", () => {
  const ctx = {
    storeName: "AR FARM JAYA",
    recipient: "Siti Aminah",
    reference: "rekap gaji Oktober 2026",
    dueDate: "2026-11-07",
    total: 250000,
  };
  for (const purpose of ["kasbon", "gaji", "perusahaan", "bebas"] as const) {
    const prose = letterProse(purpose, ctx);
    assert.equal(prose.opening.startsWith("Dengan hormat,"), true, purpose);
    assert.doesNotMatch(`${prose.opening}\n${prose.closing}`, /barang/i, purpose);
    assert.match(prose.closing, /250\.000/);
    assert.match(prose.closing, /7 November 2026/);
  }
  assert.match(letterProse("kasbon", ctx).opening, /kasbon atau pinjaman Siti Aminah/i);
  assert.match(letterProse("gaji", ctx).opening, /gaji dan tunjangan kepada Siti Aminah/i);
  assert.match(letterProse("gaji", ctx).closing, /akan kami selesaikan/i);
  assert.match(letterProse("perusahaan", ctx).opening, /kewajiban pembayaran kepada Siti Aminah/i);
  assert.match(letterProse("perusahaan", ctx).closing, /akan menyelesaikan pembayaran/i);
  assert.match(letterProse("bebas", ctx).opening, /hal sebagaimana tercantum pada perihal/i);
  assert.equal(letterProse("kasbon", { ...ctx, reference: "" }).opening.includes("Merujuk"), false);
  assert.match(letterProse("gaji", { ...ctx, reference: "" }).opening, /^Dengan hormat,\n\nBersama surat/);

  assert.equal(resolveLetterChrome().columns.item, "Barang");
  assert.equal(resolveLetterChrome().heading, "Surat Penagihan");
  assert.equal(resolveLetterChrome({ purpose: "gaji" }).columns.item, "Komponen");
  assert.equal(resolveLetterChrome({ purpose: "gaji" }).totalLabel, "TOTAL HUTANG");
  assert.equal(resolveLetterChrome({ purpose: "perusahaan" }).columns.item, "Uraian");
  assert.equal(
    resolveLetterChrome({ purpose: "gaji", columns: { item: "Potongan" }, heading: "Surat Khusus" }).columns.item,
    "Potongan",
  );
  assert.equal(resolveLetterChrome({ subject: "Hal lain" }).heading, "Surat Penagihan");
  assert.equal(resolveLetterChrome({ subject: "Hal lain" }).subject, "Hal lain");
  assert.equal(suggestLetterNumber("2026-10-31", 0, "shg"), "001/SHG/X/2026");
  assert.equal(suggestLetterNumber("2026-10-31", 0, "  "), "001/SPH/X/2026");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { invoiceInputError, invoiceTotals, suggestInvoiceNumber } from "../src/lib/invoices";
import { resolveInvoiceDesign, snapshotInvoiceSeller } from "../src/lib/invoice-design";
import { buildInvoiceSignature } from "../src/lib/invoice-sign";
import { parseWorkspace } from "../src/lib/workspace-data";
import { useUiStore } from "../src/lib/store";
import type { InvoiceInput, Store } from "../src/lib/types";

const seller: Store = { id: "store-test", name: "Toko Contoh", address: "Ponorogo", phone: "0800", invoicePrefix: "INV/", tagline: "Supplier kebutuhan harian", bankInfo: "Rekening contoh", createdAt: "2026-11-03T00:00:00Z", catalog: [{ id: "item", name: "Wortel", price: 16000, unit: "kg" }] };
const input: InvoiceInput = { storeId: seller.id, buyer: "Pelanggan", buyerAddress: "Alamat pelanggan", buyerPhone: "0811", date: "2026-11-03", dueDate: "2026-11-10", lines: [{ name: "Wortel", quantity: 28, unit: "kg", price: 16000 }], shipping: 10000, discount: 5000, note: "Catatan khusus" };

test("invoice amounts match printed rounded line amounts and reject invalid financial data", () => {
  assert.deepEqual(invoiceTotals(input.lines, 10000, 5000), { subtotal: 448000, shipping: 10000, discount: 5000, total: 453000 });
  assert.equal(invoiceTotals([{ name: "A", unit: "kg", quantity: 0.333, price: 1000 }, { name: "B", unit: "kg", quantity: 0.333, price: 1000 }]).total, 666);
  assert.equal(invoiceInputError(input), null);
  for (const patch of [{ shipping: -1 }, { discount: 500000 }, { discount: 0.5 }, { dueDate: "2026-11-01" }, { date: "2026-02-30" }, { lines: [{ ...input.lines[0], quantity: Infinity }] }, { lines: [{ ...input.lines[0], price: -1 }] }, { lines: [{ ...input.lines[0], quantity: 0 }] }]) assert.ok(invoiceInputError({ ...input, ...patch }));
});

test("automatic invoice numbers do not collide after deletion or across shops sharing a prefix", () => {
  assert.equal(suggestInvoiceNumber("INV/", [{ number: "INV/0001" }, { number: "INV/0003" }, { number: "OTHER0099" }]), "INV/0004");
});

test("old stores get independent safe design defaults; seller snapshots do not retain catalog or live references", () => {
  const original = { ...seller, invoiceDesign: resolveInvoiceDesign(seller) };
  const saved = snapshotInvoiceSeller(original);
  original.invoiceDesign.colors.tableHeader = "#ff0000";
  original.name = "Nama baru";
  assert.equal(saved.name, seller.name);
  assert.notEqual(saved.invoiceDesign?.colors.tableHeader, "#ff0000");
  assert.equal("catalog" in saved, false);
  const invalid = JSON.parse(JSON.stringify(saved));
  invalid.invoiceDesign.logoWidth = 900;
  invalid.invoiceDesign.colors.brand = "url(https://example.com)";
  assert.equal(resolveInvoiceDesign(invalid).logoWidth, 180);
  assert.equal(resolveInvoiceDesign(invalid).colors.brand, "#166534");
});

test("new invoice details and seller design affect hashes, while legacy signatures remain compatible", async () => {
  const legacy = { number: "INV/0001", storeName: seller.name, buyer: input.buyer, date: input.date, lines: input.lines, ...invoiceTotals(input.lines, 10000) };
  // No extra fields means the historical canonical format is unchanged.
  const old = { number: legacy.number, storeName: legacy.storeName, buyer: legacy.buyer, date: legacy.date, lines: legacy.lines, subtotal: legacy.subtotal, shipping: legacy.shipping, total: legacy.total };
  const expected = createHash("sha256").update(`no=INV/0001\ntoko=Toko Contoh\npembeli=Pelanggan\ntgl=2026-11-03\nitems=Wortel|kg|28|16000\nsub=448000\nongkir=10000\ntotal=458000`).digest("hex");
  assert.equal((await buildInvoiceSignature(old, "Penjual")).hash, expected);
  const current = { ...old, ...input, ...invoiceTotals(input.lines, input.shipping, input.discount), number: "INV/0001", storeName: seller.name, seller: snapshotInvoiceSeller(seller) };
  const signature = await buildInvoiceSignature(current, "Penjual");
  for (const patch of [{ buyerAddress: "Alamat baru" }, { dueDate: "2026-11-12" }, { discount: 10000 }, { note: "Catatan lain" }, { seller: { ...current.seller, bankInfo: "Rekening lain" } }]) assert.notEqual((await buildInvoiceSignature({ ...current, ...patch }, "Penjual")).hash, signature.hash);
});

test("structured new hashes cannot confuse delimiters in line names and units", async () => {
  const base = { number: "1", storeName: "Store", buyer: "Buyer", date: "2026-11-03", subtotal: 1, shipping: 0, total: 1, discount: 0 };
  const a = await buildInvoiceSignature({ ...base, lines: [{ name: "a|b", unit: "c", quantity: 1, price: 1 }] }, "Owner");
  const b = await buildInvoiceSignature({ ...base, lines: [{ name: "a", unit: "b|c", quantity: 1, price: 1 }] }, "Owner");
  assert.notEqual(a.hash, b.hash);
});

test("store actions preserve complete invoices through save, workspace JSON roundtrip, edit and seller changes", () => {
  useUiStore.setState({ stores: [seller], invoices: [] });
  const created = useUiStore.getState().createInvoice(input);
  assert.equal(created.ok, true);
  const invoice = created.invoice!;
  assert.equal(invoice.discount, 5000);
  assert.equal(invoice.total, 453000);
  assert.equal(invoice.buyerAddress, input.buyerAddress);
  assert.equal(useUiStore.getState().createInvoice({ ...input, number: invoice.number }).ok, false);
  useUiStore.getState().updateStore(seller.id, { name: "Nama toko baru", tagline: "Tagline baru" });
  assert.equal(invoice.seller?.name, seller.name);
  const edited = useUiStore.getState().updateInvoice(invoice.id, { ...input, number: invoice.number, buyerAddress: "Alamat baru", discount: 10000, note: "" });
  assert.equal(edited.invoice?.total, 448000);
  assert.equal(edited.invoice?.seller?.tagline, seller.tagline);
  assert.equal(edited.invoice?.note, "");
  const workspace = parseWorkspace(JSON.parse(JSON.stringify({ products: [], movements: [], settings: useUiStore.getState().settings, stores: useUiStore.getState().stores, invoices: useUiStore.getState().invoices })));
  assert.deepEqual(workspace.invoices, JSON.parse(JSON.stringify(useUiStore.getState().invoices)));
});

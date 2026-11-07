import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { INVOICE_TEMPLATES, getInvoiceTemplate, applyInvoiceTemplate } from "../src/lib/invoice-templates";
import { contrastRatio, resolveInvoiceDesign, snapshotInvoiceSeller } from "../src/lib/invoice-design";
import { InvoiceDocument } from "../src/components/invoice/invoice-document";
import { buildInvoiceSignature } from "../src/lib/invoice-sign";
import { useUiStore } from "../src/lib/store";
import type { Store } from "../src/lib/types";

const store: Store = { id: "template-store", name: "TOKO PENGUJIAN", address: "Alamat penjual rahasia", phone: "0800-PENJUAL", email: "penjual@example.test", tagline: "Tagline pengujian", invoicePrefix: "T-", paymentMethod: "Transfer bank", bankInfo: "Rekening Pengujian", signatureName: "Pemilik Toko", footerText: "Terima kasih", createdAt: "2026-11-07" };
const invoice = { number: "T-0001", buyer: "PEMBELI PENGUJIAN", buyerAddress: "Alamat pembeli rahasia", buyerPhone: "0800-PEMBELI", date: "2026-11-07", dueDate: "2026-11-14", lines: [{ name: "Barang khusus pengujian", unit: "kg", quantity: 2, price: 10000 }], subtotal: 20000, shipping: 1000, discount: 500, total: 20500, note: "Catatan pengujian" };

test("32 versioned templates have distinct structural compositions, not palette-only copies", () => {
  assert.equal(INVOICE_TEMPLATES.length, 32);
  assert.equal(new Set(INVOICE_TEMPLATES.map((t) => t.id)).size, 32);
  assert.equal(new Set(INVOICE_TEMPLATES.map(({ header, metadata, table, totals, closing, flow, font, density }) => JSON.stringify([header, metadata, table, totals, closing, flow, font, density]))).size, 32);
  assert.equal(new Set(INVOICE_TEMPLATES.map((t) => t.header)).size, 16);
  for (const t of INVOICE_TEMPLATES) {
    assert.match(t.id, /-v1$/);
    assert.ok(contrastRatio(t.colors.tableHeader, t.colors.tableHeaderText) >= 4.5, t.id);
    assert.ok(contrastRatio(t.colors.total, t.colors.totalText) >= 4.5, t.id);
  }
});

test("every template renders mandatory billing details and obeys visibility without hiding nonzero adjustments", () => {
  for (const t of INVOICE_TEMPLATES) {
    const design = applyInvoiceTemplate(resolveInvoiceDesign(), t.id);
    const html = renderToStaticMarkup(createElement(InvoiceDocument, { store: { ...store, invoiceDesign: design }, invoice }));
    for (const text of [store.name, invoice.buyer, invoice.number, invoice.lines[0].name, "Total tagihan", "Ongkos kirim", "Diskon"]) assert.ok(html.includes(text), `${t.id}: ${text}`);
    assert.ok(html.includes(`data-invoice-template="${t.id}"`));
    for (const key of ["logo", "storeAddress", "storePhone", "storeEmail", "buyerAddress", "buyerPhone", "tagline", "note", "footer", "shipping", "discount", "unit", "price"] as const) design.visible[key] = false;
    const hidden = renderToStaticMarkup(createElement(InvoiceDocument, { store: { ...store, invoiceDesign: design }, invoice }));
    for (const text of [store.address, store.phone, store.email!, store.tagline!, store.footerText!, invoice.buyerAddress, invoice.buyerPhone, invoice.note]) assert.ok(!hidden.includes(text), `${t.id} leaked ${text}`);
    assert.ok(hidden.includes("Ongkos kirim") && hidden.includes("Diskon"), t.id);
    assert.ok(!hidden.includes(">Satuan</th>") && !hidden.includes("Harga satuan (Rp)"), t.id);
  }
});

test("legacy and unknown template IDs keep the old renderer; selecting a preset preserves field choices and copies palettes", () => {
  const old = resolveInvoiceDesign();
  const preset = applyInvoiceTemplate({ ...old, visible: { ...old.visible, buyerPhone: false } }, "atlas-v1");
  assert.equal(preset.visible.buyerPhone, false);
  preset.colors.brand = "#123456";
  assert.notEqual(getInvoiceTemplate("atlas-v1")?.colors.brand, "#123456");
  assert.equal(applyInvoiceTemplate(old, "missing"), old);
  const invalid = resolveInvoiceDesign({ invoiceDesign: { ...old, templateId: "missing" } });
  assert.equal(invalid.templateId, undefined);
  assert.equal(renderToStaticMarkup(createElement(InvoiceDocument, { store: { ...store, invoiceDesign: invalid }, invoice })).includes("data-invoice-template"), false);
  assert.equal("templateId" in snapshotInvoiceSeller(store).invoiceDesign!, false);
});

test("each store persists its own template and issued invoice snapshots survive later template changes", async () => {
  const first = { ...store, invoiceDesign: applyInvoiceTemplate(resolveInvoiceDesign(), "atlas-v1") };
  const second = { ...store, id: "other-store", name: "TOKO KEDUA", invoiceDesign: applyInvoiceTemplate(resolveInvoiceDesign(), "flux-v1") };
  useUiStore.setState({ stores: [first, second], invoices: [] });
  const a = useUiStore.getState().createInvoice({ ...invoice, storeId: first.id });
  const b = useUiStore.getState().createInvoice({ ...invoice, number: "T-0002", storeId: second.id });
  assert.equal(a.invoice?.seller?.invoiceDesign?.templateId, "atlas-v1");
  assert.equal(b.invoice?.seller?.invoiceDesign?.templateId, "flux-v1");
  useUiStore.getState().updateStore(first.id, { invoiceDesign: applyInvoiceTemplate(first.invoiceDesign, "mono-v1") });
  assert.equal(a.invoice?.seller?.invoiceDesign?.templateId, "atlas-v1");
  const saved = JSON.parse(useUiStore.getState().exportBackup());
  assert.equal(saved.invoices[1].seller.invoiceDesign.templateId, "atlas-v1");
  assert.equal(saved.stores[0].invoiceDesign.templateId, "mono-v1");
  const override = useUiStore.getState().createInvoice({ ...invoice, number: "T-0003", storeId: first.id, seller: snapshotInvoiceSeller({ ...first, invoiceDesign: applyInvoiceTemplate(first.invoiceDesign, "pulse-v1") }) });
  assert.equal(override.invoice?.seller?.invoiceDesign?.templateId, "pulse-v1");
  assert.equal(useUiStore.getState().stores[0].invoiceDesign?.templateId, "mono-v1");
  const signed = { ...invoice, storeName: store.name, seller: snapshotInvoiceSeller(first) };
  const hash = (await buildInvoiceSignature(signed, "Owner")).hash;
  assert.notEqual((await buildInvoiceSignature({ ...signed, seller: { ...signed.seller, invoiceDesign: applyInvoiceTemplate(first.invoiceDesign, "flux-v1") } }, "Owner")).hash, hash);
});

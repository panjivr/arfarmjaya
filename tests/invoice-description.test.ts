import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { InvoiceDocument } from "../src/components/invoice/invoice-document";
import { INVOICE_TEMPLATES, applyInvoiceTemplate } from "../src/lib/invoice-templates";
import { resolveInvoiceDesign } from "../src/lib/invoice-design";
import { buildInvoiceSignature } from "../src/lib/invoice-sign";
import { useUiStore } from "../src/lib/store";
import { parseWorkspace } from "../src/lib/workspace-data";
import type { InvoiceDesign, Store } from "../src/lib/types";

const store: Store = { id: "description-store", name: "TOKO KETERANGAN", address: "Ponorogo", phone: "0800", invoicePrefix: "KET-", createdAt: "2026-11-09" };
const invoice = { number: "KET-0001", buyer: "Pembeli", date: "2026-11-09", lines: [{ name: "Wortel", description: "Ukuran besar\nKemasan khusus", unit: "kg", price: 10000, quantity: 2 }], subtotal: 20000, shipping: 0, total: 20000 };
const designs: InvoiceDesign[] = [resolveInvoiceDesign(), { ...resolveInvoiceDesign(), layout: "modern" }, ...INVOICE_TEMPLATES.map((t) => applyInvoiceTemplate(resolveInvoiceDesign(), t.id))];

test("optional description column works in all 34 layouts and hidden content never appears in printed markup", () => {
  for (const base of designs) {
    const design = { ...base, visible: { ...base.visible, description: true } };
    const render = (data = invoice) => renderToStaticMarkup(createElement(InvoiceDocument, { store: { ...store, invoiceDesign: design }, invoice: data }));
    const shown = render();
    assert.match(shown, />Keterangan<\/th>/);
    assert.ok(shown.includes(invoice.lines[0].description));
    assert.equal((shown.match(/<th\b/g) ?? []).length, 7);
    const empty = render({ ...invoice, lines: [] });
    assert.match(empty, /colSpan="7"|colspan="7"/);
    design.visible.description = false;
    const hidden = render();
    assert.ok(!hidden.includes(invoice.lines[0].description));
    assert.ok(!hidden.includes(">Keterangan</th>"));
    assert.equal((hidden.match(/<th\b/g) ?? []).length, 6);
  }
});

test("old design normalization does not inject a new field into archived seller snapshots", () => {
  const old = resolveInvoiceDesign();
  assert.equal(old.visible.description, undefined);
  assert.equal("description" in old.visible, false);
  assert.equal(resolveInvoiceDesign({ invoiceDesign: { ...old, visible: { ...old.visible, description: true } } }).visible.description, true);
});

test("descriptions survive save/edit/hidden-column snapshots and backup serialization without affecting money", () => {
  const design = { ...resolveInvoiceDesign(), visible: { ...resolveInvoiceDesign().visible, description: true } };
  useUiStore.setState({ stores: [{ ...store, invoiceDesign: design }], invoices: [] });
  const created = useUiStore.getState().createInvoice({ ...invoice, storeId: store.id });
  assert.equal(created.ok, true);
  assert.equal(created.invoice?.lines[0].description, invoice.lines[0].description);
  const seller = created.invoice!.seller!;
  const edited = useUiStore.getState().updateInvoice(created.invoice!.id, { ...invoice, storeId: store.id, seller: { ...seller, invoiceDesign: { ...design, visible: { ...design.visible, description: false } } } });
  assert.equal(edited.invoice?.seller?.invoiceDesign?.visible.description, false);
  assert.equal(edited.invoice?.lines[0].description, invoice.lines[0].description);
  assert.equal(edited.invoice?.total, 20000);
  const restored = parseWorkspace(JSON.parse(useUiStore.getState().exportBackup()));
  assert.deepEqual(restored.invoices, JSON.parse(JSON.stringify(useUiStore.getState().invoices)));
});

test("description changes affect both new and otherwise legacy invoice hashes", async () => {
  const original = { ...invoice, storeName: store.name };
  const a = await buildInvoiceSignature(original, "Owner");
  const b = await buildInvoiceSignature({ ...original, lines: [{ ...original.lines[0], description: "Kemasan lain" }] }, "Owner");
  assert.notEqual(a.hash, b.hash);
  const { description: removed, ...oldLine } = original.lines[0];
  assert.ok(removed);
  const old = { ...original, lines: [oldLine] };
  assert.equal((await buildInvoiceSignature(old, "Owner")).hash, (await buildInvoiceSignature({ ...old, lines: [{ ...oldLine }] }, "Owner")).hash);
});

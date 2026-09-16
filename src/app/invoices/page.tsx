"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Printer, Save, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { ScaledPreview } from "@/components/ui/scaled-preview";
import { InvoiceDocument, type InvoiceData } from "@/components/invoice/invoice-document";
import { useUiStore } from "@/lib/store";
import { currency, formatDate } from "@/lib/utils";
import type { InvoiceLine, Store } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

export default function InvoicesPage() {
  const stores = useUiStore((s) => s.stores);
  const invoices = useUiStore((s) => s.invoices);
  const createInvoice = useUiStore((s) => s.createInvoice);
  const deleteInvoice = useUiStore((s) => s.deleteInvoice);

  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [buyer, setBuyer] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [date, setDate] = useState(today());
  const [numberOverride, setNumberOverride] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [shipping, setShipping] = useState(0);
  const [draft, setDraft] = useState({ name: "", unit: "Kg", quantity: "", price: "" });

  // After store hydration/sync the store ids can change; keep the selected
  // store valid so createInvoice always resolves it.
  useEffect(() => {
    if (stores.length && !stores.some((s) => s.id === storeId)) {
      setStoreId(stores[0].id);
    }
  }, [stores, storeId]);

  const [printTarget, setPrintTarget] = useState<{ store?: Store; data: InvoiceData } | null>(null);

  const store = stores.find((s) => s.id === storeId);
  const subtotal = useMemo(() => lines.reduce((t, l) => t + l.price * l.quantity, 0), [lines]);
  const total = subtotal + (shipping || 0);
  const suggestedNumber = store ? `${store.invoicePrefix}${String(invoices.length + 1).padStart(4, "0")}` : "";
  const invoiceNumber = numberOverride.trim() || suggestedNumber;

  const previewData: InvoiceData = { number: invoiceNumber, buyer, buyerPhone, date, lines, subtotal, shipping: shipping || 0, total, note: store?.note };

  function addLine() {
    const quantity = Number(draft.quantity);
    const price = Number(draft.price);
    if (!draft.name.trim() || !(quantity > 0)) return toast.error("Isi nama barang dan jumlah.");
    setLines((prev) => [...prev, { name: draft.name.trim(), unit: draft.unit.trim() || "Pcs", quantity, price: price || 0 }]);
    setDraft({ name: "", unit: draft.unit, quantity: "", price: "" });
  }

  function save() {
    const result = createInvoice({ storeId, buyer, buyerPhone: buyerPhone || undefined, date, number: invoiceNumber, lines, shipping: shipping || 0, note: store?.note });
    if (!result.ok) return toast.error(result.message ?? "Gagal menyimpan.");
    toast.success(`Invoice ${result.invoice?.number} tersimpan.`);
    setLines([]);
    setBuyer("");
    setBuyerPhone("");
    setNumberOverride("");
    setShipping(0);
  }

  function printData(data: InvoiceData, s?: Store) {
    setPrintTarget({ store: s, data });
    setTimeout(() => window.print(), 250);
  }

  if (stores.length === 0) {
    return (
      <AppShell>
        <PageHeader eyebrow="Penjualan" title="Invoice" description="Buat dan cetak invoice untuk toko Anda." />
        <EmptyState icon={FileText} title="Belum ada toko" description="Tambahkan toko dulu di menu Toko sebelum membuat invoice." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Penjualan"
        title="Invoice"
        description="Pilih toko, isi pembeli dan daftar barang, lalu simpan atau cetak invoice siap kirim."
      />

      <section className="no-print mb-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <StatCard label="Total Invoice" value={invoices.length} icon={FileText} />
        <StatCard label="Nilai Invoice" value={currency.format(invoices.reduce((t, i) => t + i.total, 0))} icon={FileText} tone="primary" />
        <StatCard label="Toko Aktif" value={stores.length} icon={FileText} tone="amber" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Editor */}
        <div className="no-print min-w-0 space-y-4">
          <Card>
            <CardHeader><h2 className="font-semibold">Data Invoice</h2></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Toko">
                <Select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
                  {stores.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="No Invoice"><Input value={numberOverride} onChange={(e) => setNumberOverride(e.target.value)} placeholder={suggestedNumber} /></Field>
                <Field label="Tanggal"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
              </div>
              <Field label="Pembeli"><Input value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="SPPG NGRAKET BALONG" /></Field>
              <Field label="Telepon Pembeli"><Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="081216101267" /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Tambah Barang</h2></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Nama Barang"><Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Pakcoy" /></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Satuan"><Input value={draft.unit} onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))} /></Field>
                <Field label="Jumlah"><Input type="number" min={0} step="any" value={draft.quantity} onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))} /></Field>
                <Field label="Harga"><Input type="number" min={0} value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} /></Field>
              </div>
              <Button type="button" variant="secondary" className="w-full" onClick={addLine}><Plus className="h-4 w-4" /> Tambah ke Invoice</Button>

              {lines.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {lines.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
                      <span className="min-w-0 flex-1 truncate">{l.name} · {l.quantity} {l.unit}</span>
                      <span className="font-medium">{currency.format(l.price * l.quantity)}</span>
                      <button type="button" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))} className="text-danger"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}

              <Field label="Ongkos Kirim (Rp)"><Input type="number" min={0} value={shipping || ""} onChange={(e) => setShipping(Number(e.target.value) || 0)} placeholder="0" /></Field>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <span className="text-muted">Total</span>
                <span className="text-lg font-bold">{currency.format(total)}</span>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={save}><Save className="h-4 w-4" /> Simpan</Button>
                <Button variant="secondary" onClick={() => printData(previewData, store)} disabled={lines.length === 0}><Printer className="h-4 w-4" /> Cetak</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live preview */}
        <div className="no-print min-w-0">
          <Card className="bg-slate-100 p-3 sm:p-4 lg:sticky lg:top-20 dark:bg-slate-900">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted sm:mb-3">Pratinjau invoice</p>
            <ScaledPreview baseWidth={800}>
              <div className="shadow-lg"><InvoiceDocument store={store} invoice={previewData} /></div>
            </ScaledPreview>
          </Card>
        </div>
      </div>

      {/* Saved invoices */}
      <div className="no-print mt-6">
        <h2 className="mb-3 text-lg font-bold">Invoice Tersimpan</h2>
        {invoices.length === 0 ? (
          <EmptyState icon={FileText} title="Belum ada invoice tersimpan" description="Invoice yang disimpan akan muncul di sini." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {invoices.map((inv) => {
              const s = stores.find((x) => x.id === inv.storeId);
              return (
                <Card key={inv.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-bold">{inv.number}</p>
                        <p className="truncate text-sm text-muted">{inv.buyer}</p>
                        <p className="text-xs text-muted">{inv.storeName} · {formatDate(inv.date)}</p>
                      </div>
                      <span className="shrink-0 font-bold">{currency.format(inv.total)}</span>
                    </div>
                    <div className="mt-3 flex justify-end gap-1">
                      <Button variant="secondary" className="h-8" onClick={() => printData({ number: inv.number, buyer: inv.buyer, buyerPhone: inv.buyerPhone, date: inv.date, lines: inv.lines, subtotal: inv.subtotal, shipping: inv.shipping, total: inv.total, note: inv.note }, s)}><Printer className="h-4 w-4" /> Cetak</Button>
                      <Button variant="ghost" className="h-8 w-8 px-0 text-danger" aria-label="Hapus" onClick={() => { if (confirm(`Hapus invoice ${inv.number}?`)) { deleteInvoice(inv.id); toast.success("Invoice dihapus."); } }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Print area */}
      {printTarget && (
        <div id="print-area">
          <InvoiceDocument store={printTarget.store} invoice={printTarget.data} />
        </div>
      )}
    </AppShell>
  );
}

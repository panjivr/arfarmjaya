"use client";

import { useState } from "react";
import { PackageCheck, Plus } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export default function ReceivingPage() {
  const receipts = useUiStore((s) => s.receipts);
  const products = useUiStore((s) => s.products);
  const createReceipt = useUiStore((s) => s.createReceipt);

  const [open, setOpen] = useState(false);
  const [sku, setSku] = useState(products[0]?.sku ?? "");
  const [quantity, setQuantity] = useState(1);
  const [batch, setBatch] = useState(`STOCK-${todayStamp()}`);
  const [expirationDate, setExpirationDate] = useState("");

  const totalUnits = receipts.reduce((t, r) => t + r.quantity, 0);
  const selected = products.find((p) => p.sku === sku);

  function reset() {
    setSku(products[0]?.sku ?? "");
    setQuantity(1);
    setBatch(`STOCK-${todayStamp()}`);
    setExpirationDate("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const product = products.find((p) => p.sku === sku);
    if (!product) return toast.error("Pilih barang.");
    if (quantity <= 0) return toast.error("Jumlah harus lebih dari 0.");
    createReceipt({
      supplier: product.supplier,
      sku: product.sku,
      productName: product.name,
      quantity,
      unit: product.unit,
      batch: batch || `STOCK-${todayStamp()}`,
      expirationDate,
    });
    toast.success("Penerimaan dibuat, stok diperbarui.");
    setOpen(false);
    reset();
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Operasional"
        title="Penerimaan Barang"
        description="Catat penerimaan barang (GRN) dari pemasok. Stok otomatis bertambah setelah penerimaan disimpan."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Terima Barang</Button>}
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2">
        <StatCard label="Total Penerimaan" value={receipts.length} icon={PackageCheck} />
        <StatCard label="Total Unit Diterima" value={totalUnits} icon={PackageCheck} tone="primary" />
      </section>

      {receipts.length === 0 ? (
        <EmptyState icon={PackageCheck} title="Belum ada penerimaan" description="Buat penerimaan barang pertama untuk menambah stok." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Terima Barang</Button>} />
      ) : (
        <div className="space-y-3">
          {receipts.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{r.number}</span>
                    <span className="inline-flex items-center rounded-full bg-leaf/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      +{r.quantity} {r.unit}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{r.productName} · {r.supplier} · {formatDateTime(r.createdAt)}</p>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
                <div><span className="text-muted">Batch:</span> <span className="font-medium">{r.batch}</span></div>
                <div><span className="text-muted">Kedaluwarsa:</span> <span className="font-medium">{r.expirationDate || "-"}</span></div>
                <div><span className="text-muted">Pemasok:</span> <span className="font-medium">{r.supplier}</span></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Penerimaan Barang Baru" description="Pilih barang yang diterima, jumlah, batch, dan tanggal kedaluwarsa.">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Pilih Barang">
            <Select value={sku} onChange={(e) => setSku(e.target.value)}>
              {products.map((p) => (<option key={p.sku} value={p.sku}>{p.name}</option>))}
            </Select>
          </Field>
          {selected && (
            <div className="grid gap-2 rounded-lg border border-border bg-background p-3 text-sm sm:grid-cols-3">
              <div><span className="text-muted">Nama:</span> <span className="font-medium">{selected.name}</span></div>
              <div><span className="text-muted">Satuan:</span> <span className="font-medium">{selected.unit}</span></div>
              <div><span className="text-muted">Pemasok:</span> <span className="font-medium">{selected.supplier}</span></div>
            </div>
          )}
          <Field label="Jumlah">
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} />
          </Field>
          <Field label="Batch">
            <Input value={batch} onChange={(e) => setBatch(e.target.value)} />
          </Field>
          <Field label="Tanggal Kedaluwarsa">
            <Input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit">Simpan Penerimaan</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

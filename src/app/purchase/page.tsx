"use client";

import { useState } from "react";
import { Check, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { OrderStatusBadge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { currency, formatDateTime } from "@/lib/utils";
import type { OrderLine } from "@/lib/types";

export default function PurchasePage() {
  const orders = useUiStore((s) => s.purchaseOrders);
  const suppliers = useUiStore((s) => s.suppliers);
  const products = useUiStore((s) => s.products);
  const createPurchaseOrder = useUiStore((s) => s.createPurchaseOrder);
  const setPurchaseStatus = useUiStore((s) => s.setPurchaseStatus);

  const [open, setOpen] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [sku, setSku] = useState(products[0]?.sku ?? "");
  const [qty, setQty] = useState(1);

  const pending = orders.filter((o) => o.status === "Menunggu Persetujuan").length;
  const totalValue = orders.reduce((t, o) => t + o.total, 0);

  function addLine() {
    const product = products.find((p) => p.sku === sku);
    if (!product || qty <= 0) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.sku === sku);
      if (existing) return prev.map((l) => (l.sku === sku ? { ...l, quantity: l.quantity + qty } : l));
      return [...prev, { sku: product.sku, name: product.name, unit: product.unit, quantity: qty, price: product.purchasePrice }];
    });
    setQty(1);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplier) return toast.error("Pilih pemasok.");
    if (lines.length === 0) return toast.error("Tambahkan minimal satu item.");
    createPurchaseOrder({ supplier, lines, note });
    toast.success("Pesanan pembelian dibuat.");
    setOpen(false);
    setLines([]);
    setSupplier("");
    setNote("");
  }

  const total = lines.reduce((t, l) => t + l.price * l.quantity, 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Operasional"
        title="Pembelian"
        description="Buat pesanan pembelian ke pemasok, ajukan persetujuan, dan pantau status hingga barang diterima."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Pesanan Baru</Button>}
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard label="Total Pesanan" value={orders.length} icon={ShoppingCart} />
        <StatCard label="Menunggu Persetujuan" value={pending} icon={ShoppingCart} tone="amber" />
        <StatCard label="Total Nilai" value={currency.format(totalValue)} icon={ShoppingCart} tone="primary" />
      </section>

      {orders.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Belum ada pesanan pembelian" description="Buat pesanan pembelian pertama untuk restok barang." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Pesanan Baru</Button>} />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{o.number}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">{o.supplier} · {formatDateTime(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{currency.format(o.total)}</span>
                  {o.status === "Menunggu Persetujuan" && (
                    <div className="flex gap-2">
                      <Button className="h-9" onClick={() => { setPurchaseStatus(o.id, "Disetujui"); toast.success("Pesanan disetujui."); }}><Check className="h-4 w-4" /> Setujui</Button>
                      <Button variant="secondary" className="h-9" onClick={() => { setPurchaseStatus(o.id, "Ditolak"); toast.info("Pesanan ditolak."); }}><X className="h-4 w-4" /> Tolak</Button>
                    </div>
                  )}
                  {o.status === "Disetujui" && (
                    <Button variant="secondary" className="h-9" onClick={() => { setPurchaseStatus(o.id, "Selesai"); toast.success("Pesanan selesai."); }}>Tandai Selesai</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Barang</th>
                        <th className="px-4 py-2 text-right font-semibold">Qty</th>
                        <th className="px-4 py-2 text-right font-semibold">Harga</th>
                        <th className="px-4 py-2 text-right font-semibold">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {o.lines.map((l) => (
                        <tr key={l.sku} className="border-t border-border">
                          <td className="px-4 py-2">{l.name}</td>
                          <td className="px-4 py-2 text-right">{l.quantity} {l.unit}</td>
                          <td className="px-4 py-2 text-right">{currency.format(l.price)}</td>
                          <td className="px-4 py-2 text-right font-medium">{currency.format(l.price * l.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Pesanan Pembelian Baru" description="Pilih pemasok dan tambahkan item yang dipesan." size="lg">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Pemasok">
            <Select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              <option value="">Pilih pemasok</option>
              {suppliers.map((s) => (<option key={s.id} value={s.name}>{s.name}</option>))}
            </Select>
          </Field>

          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-sm font-semibold">Tambah Item</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={sku} onChange={(e) => setSku(e.target.value)} className="flex-1">
                {products.map((p) => (<option key={p.sku} value={p.sku}>{p.name}</option>))}
              </Select>
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="sm:w-28" />
              <Button type="button" variant="secondary" onClick={addLine}><Plus className="h-4 w-4" /> Tambah</Button>
            </div>
            {lines.length > 0 && (
              <div className="mt-3 space-y-2">
                {lines.map((l) => (
                  <div key={l.sku} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{l.name} × {l.quantity}</span>
                    <span className="mx-3 font-medium">{currency.format(l.price * l.quantity)}</span>
                    <button type="button" onClick={() => setLines((prev) => prev.filter((x) => x.sku !== l.sku))} className="text-danger"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <p className="text-right text-sm font-bold">Total: {currency.format(total)}</p>
              </div>
            )}
          </div>

          <Field label="Catatan (opsional)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit">Buat Pesanan</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

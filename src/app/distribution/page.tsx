"use client";

import { useState } from "react";
import { Plus, Trash2, Truck } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { OrderStatusBadge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { currency, formatDateTime } from "@/lib/utils";
import type { OrderLine } from "@/lib/types";

export default function DistributionPage() {
  const distributions = useUiStore((s) => s.distributions);
  const products = useUiStore((s) => s.products);
  const createDistribution = useUiStore((s) => s.createDistribution);
  const setDistributionStatus = useUiStore((s) => s.setDistributionStatus);

  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [driver, setDriver] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [sku, setSku] = useState(products[0]?.sku ?? "");
  const [qty, setQty] = useState(1);

  const processing = distributions.filter((d) => d.status === "Diproses").length;
  const done = distributions.filter((d) => d.status === "Selesai").length;

  function addLine() {
    const product = products.find((p) => p.sku === sku);
    if (!product || qty <= 0) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.sku === sku);
      if (existing) return prev.map((l) => (l.sku === sku ? { ...l, quantity: l.quantity + qty } : l));
      return [...prev, { sku: product.sku, name: product.name, unit: product.unit, quantity: qty, price: product.retailPrice }];
    });
    setQty(1);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!destination) return toast.error("Isi tujuan distribusi.");
    if (lines.length === 0) return toast.error("Tambahkan minimal satu item.");
    const res = createDistribution({ destination, driver: driver || undefined, lines });
    if (!res.ok) return toast.error(res.message ?? "Gagal membuat distribusi.");
    toast.success("Surat jalan dibuat, stok berkurang.");
    setOpen(false);
    setLines([]);
    setDestination("");
    setDriver("");
  }

  const total = lines.reduce((t, l) => t + l.price * l.quantity, 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Operasional"
        title="Distribusi"
        description="Buat surat jalan (DO) untuk mengirim barang ke tujuan, tugaskan driver, dan pantau status pengiriman."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Distribusi Baru</Button>}
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard label="Total DO" value={distributions.length} icon={Truck} />
        <StatCard label="Sedang Diproses" value={processing} icon={Truck} tone="amber" />
        <StatCard label="Selesai" value={done} icon={Truck} tone="primary" />
      </section>

      {distributions.length === 0 ? (
        <EmptyState icon={Truck} title="Belum ada distribusi" description="Buat surat jalan pertama untuk mengirim barang." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Distribusi Baru</Button>} />
      ) : (
        <div className="space-y-3">
          {distributions.map((d) => (
            <Card key={d.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{d.number}</span>
                    <OrderStatusBadge status={d.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {d.destination}{d.driver ? ` · Driver: ${d.driver}` : ""} · {formatDateTime(d.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {d.status === "Diproses" && (
                    <Button className="h-9" onClick={() => { setDistributionStatus(d.id, "Dikirim"); toast.success("Distribusi dikirim."); }}>Dikirim</Button>
                  )}
                  {d.status === "Dikirim" && (
                    <Button className="h-9" onClick={() => { setDistributionStatus(d.id, "Selesai"); toast.success("Distribusi selesai."); }}>Selesai</Button>
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
                      {d.lines.map((l) => (
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

      <Modal open={open} onClose={() => setOpen(false)} title="Distribusi Baru" description="Tentukan tujuan, driver, dan barang yang dikirim." size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tujuan"><Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Cabang / Toko / Dapur" /></Field>
            <Field label="Driver (opsional)"><Input value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="Nama driver" /></Field>
          </div>

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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit">Buat Distribusi</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

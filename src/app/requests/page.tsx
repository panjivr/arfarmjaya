"use client";

import { useState } from "react";
import { Check, ClipboardList, Plus, Trash2, X } from "lucide-react";
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

export default function RequestsPage() {
  const requests = useUiStore((s) => s.requests);
  const products = useUiStore((s) => s.products);
  const createRequest = useUiStore((s) => s.createRequest);
  const setRequestStatus = useUiStore((s) => s.setRequestStatus);

  const [open, setOpen] = useState(false);
  const [requester, setRequester] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [sku, setSku] = useState(products[0]?.sku ?? "");
  const [qty, setQty] = useState(1);

  const waiting = requests.filter((r) => r.status === "Menunggu Persetujuan").length;
  const done = requests.filter((r) => r.status === "Selesai").length;

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
    if (!requester) return toast.error("Isi nama peminta.");
    if (lines.length === 0) return toast.error("Tambahkan minimal satu item.");
    createRequest({ requester, lines, note: note || undefined });
    toast.success("Permintaan barang dibuat.");
    setOpen(false);
    setLines([]);
    setRequester("");
    setNote("");
  }

  const total = lines.reduce((t, l) => t + l.price * l.quantity, 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Operasional"
        title="Permintaan Barang"
        description="Cabang atau dapur mengajukan permintaan barang. Setujui, tolak, atau penuhi permintaan untuk mengurangi stok."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Permintaan Baru</Button>}
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard label="Total Permintaan" value={requests.length} icon={ClipboardList} />
        <StatCard label="Menunggu Persetujuan" value={waiting} icon={ClipboardList} tone="amber" />
        <StatCard label="Selesai" value={done} icon={ClipboardList} tone="primary" />
      </section>

      {requests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Belum ada permintaan" description="Buat permintaan barang pertama dari cabang atau dapur." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Permintaan Baru</Button>} />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{r.number}</span>
                    <OrderStatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">{r.requester} · {formatDateTime(r.createdAt)}{r.note ? ` · ${r.note}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === "Menunggu Persetujuan" && (
                    <>
                      <Button className="h-9" onClick={() => { setRequestStatus(r.id, "Disetujui"); toast.success("Permintaan disetujui."); }}><Check className="h-4 w-4" /> Setujui</Button>
                      <Button variant="secondary" className="h-9" onClick={() => { setRequestStatus(r.id, "Ditolak"); toast.info("Permintaan ditolak."); }}><X className="h-4 w-4" /> Tolak</Button>
                    </>
                  )}
                  {r.status === "Disetujui" && (
                    <Button className="h-9" onClick={() => { setRequestStatus(r.id, "Selesai"); toast.success("Permintaan dipenuhi, stok berkurang."); }}>Penuhi &amp; Kurangi Stok</Button>
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
                      {r.lines.map((l) => (
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

      <Modal open={open} onClose={() => setOpen(false)} title="Permintaan Barang Baru" description="Isi peminta dan tambahkan barang yang diminta." size="lg">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Peminta"><Input value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="Cabang / Dapur / Divisi" /></Field>

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
            <Button type="submit">Buat Permintaan</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

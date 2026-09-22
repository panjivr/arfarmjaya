"use client";

import { useMemo, useState } from "react";
import { Fish, ArrowDownToLine, ShoppingBag, Trash2, Wallet } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { stockByPond } from "@/lib/lele";
import { currency, formatDate, numberFmt } from "@/lib/utils";
import type { Pond, PayMethod } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const PAY_METHODS: PayMethod[] = ["Tunai", "Transfer", "QRIS", "Tempo"];
const IN_TYPES = new Set(["PANEN", "MASUK", "TRANSFER_MASUK"]);

export function TampunganDetailModal({ pond, onClose }: { pond: Pond; onClose: () => void }) {
  const movements = useUiStore((s) => s.leleMovements);
  const sales = useUiStore((s) => s.leleSales);
  const recordSale = useUiStore((s) => s.recordSale);
  const removeSale = useUiStore((s) => s.removeSale);

  const stock = useMemo(() => stockByPond(movements, sales).get(pond.code), [movements, sales, pond.code]);

  // Ikan yang MASUK ke kolam ini, dikelompokkan per kolam asal (riwayat asal).
  const inbound = useMemo(
    () => movements.filter((m) => m.pondCode === pond.code && IN_TYPES.has(m.type)).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)),
    [movements, pond.code],
  );
  const bySource = useMemo(() => {
    const map = new Map<string, { kg: number; ekor: number; last: string }>();
    for (const m of inbound) {
      const src = m.toPondCode || "Luar/manual";
      const cur = map.get(src) ?? { kg: 0, ekor: 0, last: m.date };
      cur.kg += m.qtyKg ?? 0;
      cur.ekor += m.qtyEkor ?? 0;
      if (m.date > cur.last) cur.last = m.date;
      map.set(src, cur);
    }
    return Array.from(map.entries()).map(([src, v]) => ({ src, ...v, kg: Math.round(v.kg * 10) / 10 })).sort((a, b) => b.kg - a.kg);
  }, [inbound]);
  const totalInKg = bySource.reduce((t, s) => t + s.kg, 0);

  const pondSales = useMemo(
    () => sales.filter((s) => s.pondCode === pond.code).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)),
    [sales, pond.code],
  );

  const currentKg = stock?.totalKg ?? 0;

  // Form jual langsung dari tampungan.
  const [sale, setSale] = useState({ date: today(), buyer: "", item: "Lele Konsumsi", weightKg: "", pricePerKg: "", paid: "", method: "Tunai" as PayMethod, dueDate: "", note: "" });
  const auto = (Number(sale.weightKg) || 0) * (Number(sale.pricePerKg) || 0);
  function submitSale() {
    if (!sale.buyer.trim()) return toast.error("Isi nama pembeli.");
    if (!(Number(sale.weightKg) > 0)) return toast.error("Isi berat ikan (kg).");
    const total = auto;
    const res = recordSale({
      date: sale.date,
      buyer: sale.buyer,
      item: sale.item,
      pondCode: pond.code,
      weightKg: Number(sale.weightKg) || 0,
      pricePerKg: Number(sale.pricePerKg) || 0,
      total: total > 0 ? total : undefined,
      paid: sale.paid === "" ? total : Number(sale.paid) || 0,
      method: sale.method,
      dueDate: sale.dueDate || undefined,
      note: sale.note.trim() || undefined,
    });
    if (!res.ok) return toast.error(res.message ?? "Gagal mencatat penjualan.");
    toast.success(`Terjual ${sale.weightKg} kg dari ${pond.code}. Stok berkurang otomatis.`);
    setSale((f) => ({ ...f, buyer: "", weightKg: "", paid: "", note: "" }));
  }

  return (
    <Modal open onClose={onClose} title={`Tampungan ${pond.code}`} description="Stok siap jual, asal ikan, dan penjualan langsung ke pembeli." size="lg">
      <div className="space-y-5">
        {/* Ringkasan stok */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-emerald-50 p-3 dark:bg-emerald-950/30">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Stok sekarang</p>
            <p className="mt-0.5 text-xl font-bold text-primary">{numberFmt.format(currentKg)} kg</p>
          </div>
          <div className="rounded-xl border border-border bg-card-muted p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Konsumsi</p>
            <p className="mt-0.5 text-lg font-bold">{numberFmt.format(stock?.konsumsiKg ?? 0)} kg</p>
          </div>
          <div className="rounded-xl border border-border bg-card-muted p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Brojolan</p>
            <p className="mt-0.5 text-lg font-bold">{numberFmt.format(stock?.brojolanKg ?? 0)} kg</p>
          </div>
          <div className="rounded-xl border border-border bg-card-muted p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Total masuk</p>
            <p className="mt-0.5 text-lg font-bold">{numberFmt.format(totalInKg)} kg</p>
          </div>
        </div>

        {/* Asal ikan per kolam (riwayat asal tidak hilang) */}
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><ArrowDownToLine className="h-4 w-4 text-primary" /> Asal Ikan (per kolam)</p>
          {bySource.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">Belum ada ikan masuk. Panen dari kolam lain lalu taruh di {pond.code}.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <tbody>
                  {bySource.map((s) => (
                    <tr key={s.src} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-medium"><span className="inline-flex items-center gap-2"><Fish className="h-4 w-4 text-sky-500" /> {s.src}</span></td>
                      <td className="px-3 py-2 text-right font-semibold">{numberFmt.format(s.kg)} kg</td>
                      <td className="px-3 py-2 text-right text-muted">{s.ekor > 0 ? `${numberFmt.format(s.ekor)} ekor` : ""}</td>
                      <td className="px-3 py-2 text-right text-[11px] text-muted">terakhir {formatDate(s.last)}</td>
                    </tr>
                  ))}
                  <tr className="bg-card-muted">
                    <td className="px-3 py-2 font-bold">Total masuk {pond.code}</td>
                    <td className="px-3 py-2 text-right font-bold text-primary">{numberFmt.format(totalInKg)} kg</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Jual langsung ke pembeli */}
        <div className="rounded-xl border border-border bg-background p-3 sm:p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><ShoppingBag className="h-4 w-4 text-primary" /> Jual dari {pond.code}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Field label="Tanggal"><Input type="date" value={sale.date} onChange={(e) => setSale((f) => ({ ...f, date: e.target.value }))} /></Field>
            <Field label="Pembeli"><Input value={sale.buyer} onChange={(e) => setSale((f) => ({ ...f, buyer: e.target.value }))} placeholder="Nama pembeli" /></Field>
            <Field label="Item"><Input value={sale.item} onChange={(e) => setSale((f) => ({ ...f, item: e.target.value }))} /></Field>
            <Field label="Berat (kg)" hint={currentKg > 0 ? `stok ${numberFmt.format(currentKg)} kg` : undefined}><Input type="number" min={0} step="any" value={sale.weightKg} onChange={(e) => setSale((f) => ({ ...f, weightKg: e.target.value }))} /></Field>
            <Field label="Harga/kg (Rp)"><Input type="number" min={0} value={sale.pricePerKg} onChange={(e) => setSale((f) => ({ ...f, pricePerKg: e.target.value }))} placeholder="20000" /></Field>
            <Field label="Metode"><Select value={sale.method} onChange={(e) => setSale((f) => ({ ...f, method: e.target.value as PayMethod }))}>{PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</Select></Field>
            <Field label="Dibayar (Rp)" hint="kosong = lunas"><Input type="number" min={0} value={sale.paid} onChange={(e) => setSale((f) => ({ ...f, paid: e.target.value }))} placeholder={String(Math.round(auto) || 0)} /></Field>
            <div className="col-span-2 sm:col-span-1"><Field label="Catatan"><Input value={sale.note} onChange={(e) => setSale((f) => ({ ...f, note: e.target.value }))} placeholder="opsional" /></Field></div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">Total: <span className="font-bold text-foreground">{currency.format(auto)}</span></p>
            <Button onClick={submitSale}><Wallet className="h-4 w-4" /> Catat Penjualan</Button>
          </div>
          <p className="mt-1 text-[11px] text-muted">Stok {pond.code} otomatis berkurang. Kurang bayar tercatat sebagai piutang di Keuangan Lele.</p>
        </div>

        {/* Riwayat penjualan dari kolam ini */}
        <div>
          <p className="mb-2 text-sm font-semibold">Riwayat Penjualan {pond.code}</p>
          {pondSales.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">Belum ada penjualan dari kolam ini.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900/60">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Tanggal</th>
                    <th className="px-3 py-2 font-semibold">Pembeli</th>
                    <th className="px-3 py-2 text-right font-semibold">Kg</th>
                    <th className="px-3 py-2 text-right font-semibold">Total</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {pondSales.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="whitespace-nowrap px-3 py-2">{formatDate(s.date)}<span className="block text-[11px] text-muted">{s.number}</span></td>
                      <td className="px-3 py-2">{s.buyer}{s.paid < s.total && <Badge className="ml-1 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">piutang</Badge>}</td>
                      <td className="px-3 py-2 text-right">{s.weightKg ? numberFmt.format(s.weightKg) : "-"}</td>
                      <td className="px-3 py-2 text-right font-semibold">{currency.format(s.total)}</td>
                      <td className="px-3 py-2 text-right"><button onClick={() => { if (confirm("Hapus penjualan ini? Stok akan kembali.")) removeSale(s.id); }} className="text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

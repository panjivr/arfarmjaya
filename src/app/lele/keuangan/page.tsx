"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  HandCoins,
  Receipt,
  Plus,
  Trash2,
  Banknote,
  Tag,
} from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { currency, formatDate, numberFmt, exportCsv } from "@/lib/utils";
import type { PayMethod, Receivable, Payable, FinanceKind } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const PAY_METHODS: PayMethod[] = ["Tunai", "Transfer", "QRIS", "Tempo"];

const paidOf = (r: Receivable | Payable) => r.payments.reduce((t, p) => t + p.amount, 0);
const outstanding = (r: Receivable | Payable) => Math.max(0, r.amount - paidOf(r));

type Tab = "penjualan" | "piutang" | "utang" | "kas";

export default function KeuanganLelePage() {
  const sales = useUiStore((s) => s.leleSales);
  const receivables = useUiStore((s) => s.receivables);
  const payables = useUiStore((s) => s.payables);
  const financeTx = useUiStore((s) => s.financeTx);
  const categories = useUiStore((s) => s.financeCategories);
  const ponds = useUiStore((s) => s.ponds);

  const recordSale = useUiStore((s) => s.recordSale);
  const removeSale = useUiStore((s) => s.removeSale);
  const payReceivable = useUiStore((s) => s.payReceivable);
  const removeReceivable = useUiStore((s) => s.removeReceivable);
  const addPayable = useUiStore((s) => s.addPayable);
  const payPayable = useUiStore((s) => s.payPayable);
  const removePayable = useUiStore((s) => s.removePayable);
  const addFinanceTx = useUiStore((s) => s.addFinanceTx);
  const removeFinanceTx = useUiStore((s) => s.removeFinanceTx);
  const addFinanceCategory = useUiStore((s) => s.addFinanceCategory);

  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [tab, setTab] = useState<Tab>("penjualan");

  const inRange = useCallback((d: string) => (!from || d >= from) && (!to || d <= to), [from, to]);

  // Ringkasan periode
  const summary = useMemo(() => {
    const salesR = sales.filter((s) => inRange(s.date));
    const txR = financeTx.filter((t) => inRange(t.date));
    const omzet = salesR.reduce((t, s) => t + s.total, 0);
    const kasMasuk = txR.filter((t) => t.kind === "masuk").reduce((t, x) => t + x.amount, 0);
    const kasKeluar = txR.filter((t) => t.kind === "keluar").reduce((t, x) => t + x.amount, 0);
    const piutangAktif = receivables.reduce((t, r) => t + outstanding(r), 0);
    const utangAktif = payables.reduce((t, p) => t + outstanding(p), 0);
    return { omzet, kasMasuk, kasKeluar, arusKas: kasMasuk - kasKeluar, piutangAktif, utangAktif, salesCount: salesR.length };
  }, [sales, financeTx, receivables, payables, inRange]);

  // ── Form Penjualan ──
  const [sale, setSale] = useState({ date: today(), buyer: "", item: "Lele Konsumsi", pondCode: "", weightKg: "", pricePerKg: "", total: "", paid: "", method: "Tunai" as PayMethod, dueDate: "", note: "" });
  const saleAuto = (Number(sale.weightKg) || 0) * (Number(sale.pricePerKg) || 0);
  const saleTotal = sale.total ? Number(sale.total) : saleAuto;
  function submitSale() {
    const res = recordSale({
      date: sale.date,
      buyer: sale.buyer,
      item: sale.item,
      pondCode: sale.pondCode || undefined,
      weightKg: Number(sale.weightKg) || 0,
      pricePerKg: Number(sale.pricePerKg) || 0,
      total: sale.total ? Number(sale.total) : undefined,
      paid: sale.paid === "" ? saleTotal : Number(sale.paid) || 0,
      method: sale.method,
      dueDate: sale.dueDate || undefined,
      note: sale.note.trim() || undefined,
    });
    if (!res.ok) return toast.error(res.message ?? "Gagal menyimpan penjualan.");
    toast.success(`Penjualan ${res.sale?.number} tersimpan.`);
    setSale({ date: today(), buyer: "", item: sale.item, pondCode: "", weightKg: "", pricePerKg: sale.pricePerKg, total: "", paid: "", method: sale.method, dueDate: "", note: "" });
  }

  // ── Form Utang ──
  const [payable, setPayable] = useState({ party: "", description: "", amount: "", dueDate: "" });
  function submitPayable() {
    if (!payable.party.trim() || !(Number(payable.amount) > 0)) return toast.error("Isi pihak dan nominal utang.");
    addPayable({ party: payable.party.trim(), description: payable.description.trim(), amount: Number(payable.amount), dueDate: payable.dueDate || undefined });
    toast.success("Utang dicatat.");
    setPayable({ party: "", description: "", amount: "", dueDate: "" });
  }

  // ── Form Kas ──
  const [tx, setTx] = useState({ date: today(), kind: "keluar" as FinanceKind, category: "", amount: "", party: "", note: "" });
  const catOptions = categories.filter((c) => c.kind === tx.kind || c.kind === "both");
  function submitTx() {
    const category = tx.category || catOptions[0]?.name || "Lain-lain";
    const res = addFinanceTx({ date: tx.date, kind: tx.kind, category, amount: Number(tx.amount) || 0, party: tx.party.trim() || undefined, note: tx.note.trim() || undefined });
    if (!res.ok) return toast.error(res.message ?? "Gagal menyimpan.");
    toast.success("Transaksi kas tersimpan.");
    setTx({ date: today(), kind: tx.kind, category: "", amount: "", party: "", note: "" });
  }
  const [newCat, setNewCat] = useState("");
  function addCat() {
    const res = addFinanceCategory(newCat, tx.kind);
    if (!res.ok) return toast.error(res.message ?? "Gagal.");
    toast.success(`Kategori "${newCat.trim()}" ditambahkan.`);
    setNewCat("");
  }

  // ── Pembayaran (piutang/utang) ──
  function pay(kind: "piutang" | "utang", id: string) {
    const amountStr = prompt("Nominal pembayaran (Rp):", "");
    if (amountStr == null) return;
    const amount = Number(amountStr.replace(/[^\d]/g, ""));
    if (!(amount > 0)) return toast.error("Nominal tidak valid.");
    const entry = { date: today(), amount, method: "Tunai" as PayMethod };
    const res = kind === "piutang" ? payReceivable(id, entry) : payPayable(id, entry);
    if (!res.ok) return toast.error(res.message ?? "Gagal.");
    toast.success("Pembayaran tercatat.");
  }

  const salesInRange = sales.filter((s) => inRange(s.date)).sort((a, b) => b.date.localeCompare(a.date));
  const txInRange = financeTx.filter((t) => inRange(t.date)).sort((a, b) => b.date.localeCompare(a.date));
  const producePonds = ponds.filter((p) => p.active);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "penjualan", label: "Penjualan", count: salesInRange.length },
    { key: "piutang", label: "Piutang", count: receivables.filter((r) => outstanding(r) > 0).length },
    { key: "utang", label: "Utang", count: payables.filter((p) => outstanding(p) > 0).length },
    { key: "kas", label: "Kas & Keuangan", count: txInRange.length },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Budidaya Lele"
        title="Keuangan Lele"
        description="Penjualan, piutang pembeli, utang usaha, dan arus kas dalam satu tempat. Pilih rentang tanggal untuk melihat ringkasan periode mana pun. Penjualan tidak dibatasi bobot tebar — biomassa memang tumbuh."
      />

      {/* Rentang tanggal */}
      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Dari"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10" /></Field>
            <Field label="Sampai"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10" /></Field>
            <div className="flex gap-1.5">
              <Button variant="secondary" className="h-10" onClick={() => { setFrom(monthStart()); setTo(today()); }}>Bulan ini</Button>
              <Button variant="ghost" className="h-10" onClick={() => { setFrom(""); setTo(""); }}>Semua</Button>
            </div>
          </div>
          <p className="text-xs text-muted">{summary.salesCount} penjualan pada periode ini</p>
        </CardContent>
      </Card>

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Omzet" value={currency.format(summary.omzet)} hint="nilai penjualan periode" icon={TrendingUp} tone="primary" />
        <StatCard label="Kas Masuk" value={currency.format(summary.kasMasuk)} icon={Coins} tone="sky" />
        <StatCard label="Kas Keluar" value={currency.format(summary.kasKeluar)} icon={TrendingDown} tone="amber" />
        <StatCard label="Arus Kas" value={currency.format(summary.arusKas)} hint="masuk − keluar" icon={Wallet} tone={summary.arusKas >= 0 ? "primary" : "danger"} />
        <StatCard label="Piutang Aktif" value={currency.format(summary.piutangAktif)} hint="belum tertagih" icon={HandCoins} tone={summary.piutangAktif > 0 ? "amber" : "slate"} />
        <StatCard label="Utang Aktif" value={currency.format(summary.utangAktif)} hint="belum dibayar" icon={Banknote} tone={summary.utangAktif > 0 ? "danger" : "slate"} />
      </section>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"}`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === "penjualan" && (
        <div className="space-y-4">
          <Card>
            <CardContent>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Receipt className="h-4 w-4 text-primary" /> Catat Penjualan</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Tanggal"><Input type="date" value={sale.date} onChange={(e) => setSale((f) => ({ ...f, date: e.target.value }))} /></Field>
                <Field label="Pembeli"><Input value={sale.buyer} onChange={(e) => setSale((f) => ({ ...f, buyer: e.target.value }))} placeholder="Pengepul / nama" /></Field>
                <Field label="Item"><Input value={sale.item} onChange={(e) => setSale((f) => ({ ...f, item: e.target.value }))} placeholder="Lele Konsumsi" /></Field>
                <Field label="Kolam (opsional)">
                  <Select value={sale.pondCode} onChange={(e) => setSale((f) => ({ ...f, pondCode: e.target.value }))}>
                    <option value="">—</option>
                    {producePonds.map((p) => <option key={p.id} value={p.code}>{p.code}</option>)}
                  </Select>
                </Field>
                <Field label="Bobot (kg)"><Input type="number" min={0} step="any" value={sale.weightKg} onChange={(e) => setSale((f) => ({ ...f, weightKg: e.target.value }))} /></Field>
                <Field label="Harga/kg (Rp)"><Input type="number" min={0} value={sale.pricePerKg} onChange={(e) => setSale((f) => ({ ...f, pricePerKg: e.target.value }))} placeholder="20000" /></Field>
                <Field label="Total (Rp)" hint={sale.total ? undefined : (saleAuto > 0 ? `otomatis ${currency.format(saleAuto)}` : "borongan? isi manual")}><Input type="number" min={0} value={sale.total} onChange={(e) => setSale((f) => ({ ...f, total: e.target.value }))} placeholder={saleAuto > 0 ? String(saleAuto) : "0"} /></Field>
                <Field label="Dibayar (Rp)" hint="kosong = lunas"><Input type="number" min={0} value={sale.paid} onChange={(e) => setSale((f) => ({ ...f, paid: e.target.value }))} placeholder={String(saleTotal || 0)} /></Field>
                <Field label="Metode"><Select value={sale.method} onChange={(e) => setSale((f) => ({ ...f, method: e.target.value as PayMethod }))}>{PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</Select></Field>
                <Field label="Jatuh tempo (jika tempo)"><Input type="date" value={sale.dueDate} onChange={(e) => setSale((f) => ({ ...f, dueDate: e.target.value }))} /></Field>
                <div className="col-span-2"><Field label="Catatan"><Input value={sale.note} onChange={(e) => setSale((f) => ({ ...f, note: e.target.value }))} placeholder="opsional" /></Field></div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-sm text-muted">Total: <span className="font-bold text-foreground">{currency.format(saleTotal)}</span>{sale.paid !== "" && Number(sale.paid) < saleTotal && <span className="text-amber-600"> · piutang {currency.format(saleTotal - Number(sale.paid))}</span>}</p>
                <Button onClick={submitSale}><Plus className="h-4 w-4" /> Simpan Penjualan</Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => exportCsv(`penjualan-lele-${from || "semua"}`, salesInRange.map((s) => ({ Tanggal: s.date, Nomor: s.number, Pembeli: s.buyer, Item: s.item, Kolam: s.pondCode ?? "", Kg: s.weightKg, HargaKg: s.pricePerKg, Total: s.total, Dibayar: s.paid, Metode: s.method })))} disabled={salesInRange.length === 0}>Ekspor CSV</Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900/60">
                <tr>
                  <th className="px-3 py-2 font-semibold">Tanggal</th>
                  <th className="px-3 py-2 font-semibold">Pembeli / Item</th>
                  <th className="px-3 py-2 text-right font-semibold">Kg</th>
                  <th className="px-3 py-2 text-right font-semibold">Total</th>
                  <th className="px-3 py-2 text-right font-semibold">Dibayar</th>
                  <th className="px-3 py-2 font-semibold">Metode</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {salesInRange.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-muted">Belum ada penjualan pada periode ini.</td></tr>
                ) : (
                  salesInRange.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="whitespace-nowrap px-3 py-2">{formatDate(s.date)}<span className="block text-[11px] text-muted">{s.number}</span></td>
                      <td className="px-3 py-2"><span className="font-medium">{s.buyer}</span><span className="block text-[11px] text-muted">{s.item}{s.pondCode ? ` · ${s.pondCode}` : ""}</span></td>
                      <td className="px-3 py-2 text-right">{s.weightKg ? numberFmt.format(s.weightKg) : "-"}</td>
                      <td className="px-3 py-2 text-right font-semibold">{currency.format(s.total)}</td>
                      <td className="px-3 py-2 text-right">{currency.format(s.paid)}{s.paid < s.total && <span className="block text-[11px] text-amber-600">piutang {currency.format(s.total - s.paid)}</span>}</td>
                      <td className="px-3 py-2"><Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{s.method}</Badge></td>
                      <td className="px-3 py-2 text-right"><button onClick={() => { if (confirm("Hapus penjualan ini? Piutang terkait ikut terhapus.")) removeSale(s.id); }} className="text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "piutang" && (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900/60">
              <tr>
                <th className="px-3 py-2 font-semibold">Pembeli</th>
                <th className="px-3 py-2 font-semibold">Keterangan</th>
                <th className="px-3 py-2 text-right font-semibold">Tagihan</th>
                <th className="px-3 py-2 text-right font-semibold">Terbayar</th>
                <th className="px-3 py-2 text-right font-semibold">Sisa</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {receivables.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-muted">Belum ada piutang. Piutang muncul otomatis dari penjualan yang belum lunas.</td></tr>
              ) : (
                [...receivables].sort((a, b) => outstanding(b) - outstanding(a)).map((r) => {
                  const sisa = outstanding(r);
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{r.party}<span className="block text-[11px] text-muted">{formatDate(r.createdAt.slice(0, 10))}{r.dueDate ? ` · tempo ${formatDate(r.dueDate)}` : ""}</span></td>
                      <td className="px-3 py-2 text-muted">{r.description}</td>
                      <td className="px-3 py-2 text-right">{currency.format(r.amount)}</td>
                      <td className="px-3 py-2 text-right">{currency.format(paidOf(r))}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${sisa > 0 ? "text-amber-600" : "text-primary"}`}>{sisa > 0 ? currency.format(sisa) : "Lunas"}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          {sisa > 0 && <Button variant="secondary" className="h-8" onClick={() => pay("piutang", r.id)}>Bayar</Button>}
                          <button onClick={() => { if (confirm("Hapus piutang ini?")) removeReceivable(r.id); }} className="px-1 text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "utang" && (
        <div className="space-y-4">
          <Card>
            <CardContent>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Banknote className="h-4 w-4 text-primary" /> Catat Utang Usaha</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Pihak / Pemasok"><Input value={payable.party} onChange={(e) => setPayable((f) => ({ ...f, party: e.target.value }))} placeholder="Toko Pakan" /></Field>
                <div className="sm:col-span-2"><Field label="Keterangan"><Input value={payable.description} onChange={(e) => setPayable((f) => ({ ...f, description: e.target.value }))} placeholder="Pakan 781 5 sak" /></Field></div>
                <Field label="Nominal (Rp)"><Input type="number" min={0} value={payable.amount} onChange={(e) => setPayable((f) => ({ ...f, amount: e.target.value }))} /></Field>
                <Field label="Jatuh tempo"><Input type="date" value={payable.dueDate} onChange={(e) => setPayable((f) => ({ ...f, dueDate: e.target.value }))} /></Field>
              </div>
              <div className="mt-3 flex justify-end"><Button onClick={submitPayable}><Plus className="h-4 w-4" /> Simpan Utang</Button></div>
            </CardContent>
          </Card>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900/60">
                <tr>
                  <th className="px-3 py-2 font-semibold">Pihak</th>
                  <th className="px-3 py-2 font-semibold">Keterangan</th>
                  <th className="px-3 py-2 text-right font-semibold">Utang</th>
                  <th className="px-3 py-2 text-right font-semibold">Terbayar</th>
                  <th className="px-3 py-2 text-right font-semibold">Sisa</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {payables.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-muted">Belum ada utang usaha.</td></tr>
                ) : (
                  [...payables].sort((a, b) => outstanding(b) - outstanding(a)).map((p) => {
                    const sisa = outstanding(p);
                    return (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">{p.party}<span className="block text-[11px] text-muted">{formatDate(p.createdAt.slice(0, 10))}{p.dueDate ? ` · tempo ${formatDate(p.dueDate)}` : ""}</span></td>
                        <td className="px-3 py-2 text-muted">{p.description}</td>
                        <td className="px-3 py-2 text-right">{currency.format(p.amount)}</td>
                        <td className="px-3 py-2 text-right">{currency.format(paidOf(p))}</td>
                        <td className={`px-3 py-2 text-right font-semibold ${sisa > 0 ? "text-danger" : "text-primary"}`}>{sisa > 0 ? currency.format(sisa) : "Lunas"}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            {sisa > 0 && <Button variant="secondary" className="h-8" onClick={() => pay("utang", p.id)}>Bayar</Button>}
                            <button onClick={() => { if (confirm("Hapus utang ini?")) removePayable(p.id); }} className="px-1 text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "kas" && (
        <div className="space-y-4">
          <Card>
            <CardContent>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Wallet className="h-4 w-4 text-primary" /> Catat Kas Masuk / Keluar</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Tanggal"><Input type="date" value={tx.date} onChange={(e) => setTx((f) => ({ ...f, date: e.target.value }))} /></Field>
                <Field label="Jenis"><Select value={tx.kind} onChange={(e) => setTx((f) => ({ ...f, kind: e.target.value as FinanceKind, category: "" }))}><option value="masuk">Kas Masuk</option><option value="keluar">Kas Keluar</option></Select></Field>
                <Field label="Kategori"><Select value={tx.category} onChange={(e) => setTx((f) => ({ ...f, category: e.target.value }))}>{catOptions.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</Select></Field>
                <Field label="Nominal (Rp)"><Input type="number" min={0} value={tx.amount} onChange={(e) => setTx((f) => ({ ...f, amount: e.target.value }))} /></Field>
                <Field label="Pihak (opsional)"><Input value={tx.party} onChange={(e) => setTx((f) => ({ ...f, party: e.target.value }))} /></Field>
                <div className="sm:col-span-3"><Field label="Catatan"><Input value={tx.note} onChange={(e) => setTx((f) => ({ ...f, note: e.target.value }))} placeholder="opsional" /></Field></div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-end gap-1.5">
                  <Field label="Kategori baru"><Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="mis. Ops Ardhi" className="h-10" /></Field>
                  <Button variant="ghost" className="h-10" onClick={addCat} disabled={!newCat.trim()}><Tag className="h-4 w-4" /> Tambah</Button>
                </div>
                <Button onClick={submitTx}><Plus className="h-4 w-4" /> Simpan Transaksi</Button>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => exportCsv(`kas-lele-${from || "semua"}`, txInRange.map((t) => ({ Tanggal: t.date, Jenis: t.kind, Kategori: t.category, Nominal: t.amount, Pihak: t.party ?? "", Catatan: t.note ?? "" })))} disabled={txInRange.length === 0}>Ekspor CSV</Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900/60">
                <tr>
                  <th className="px-3 py-2 font-semibold">Tanggal</th>
                  <th className="px-3 py-2 font-semibold">Kategori</th>
                  <th className="px-3 py-2 font-semibold">Keterangan</th>
                  <th className="px-3 py-2 text-right font-semibold">Masuk</th>
                  <th className="px-3 py-2 text-right font-semibold">Keluar</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {txInRange.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-muted">Belum ada transaksi kas pada periode ini.</td></tr>
                ) : (
                  txInRange.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="whitespace-nowrap px-3 py-2">{formatDate(t.date)}</td>
                      <td className="px-3 py-2"><Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{t.category}</Badge></td>
                      <td className="px-3 py-2 text-muted">{t.note || t.party || "-"}</td>
                      <td className="px-3 py-2 text-right font-semibold text-primary">{t.kind === "masuk" ? currency.format(t.amount) : "-"}</td>
                      <td className="px-3 py-2 text-right font-semibold text-danger">{t.kind === "keluar" ? currency.format(t.amount) : "-"}</td>
                      <td className="px-3 py-2 text-right"><button onClick={() => { if (confirm("Hapus transaksi ini?")) removeFinanceTx(t.id); }} className="text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}

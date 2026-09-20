"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Scissors, TrendingDown, Trash2, Plus, PackageMinus } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { formatDate, numberFmt, exportCsv } from "@/lib/utils";
import type { SortirKategori, LeleMoveType } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };
const SORTIR_KATEGORI: SortirKategori[] = ["Konsumsi", "Brojolan", "Pemindahan"];

const typeLabel: Record<LeleMoveType, string> = {
  MASUK: "Masuk", KELUAR: "Keluar", TRANSFER_KELUAR: "Transfer Keluar", TRANSFER_MASUK: "Transfer Masuk",
  SORTIR: "Sortir", PANEN: "Panen", PENJUALAN: "Penjualan", KEMATIAN: "Kematian", PENYUSUTAN: "Penyusutan", PENYESUAIAN: "Penyesuaian",
};
const typeTone: Partial<Record<LeleMoveType, string>> = {
  TRANSFER_MASUK: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  TRANSFER_KELUAR: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  SORTIR: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  PENYUSUTAN: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  KEMATIAN: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

export default function MutasiLelePage() {
  const ponds = useUiStore((s) => s.ponds);
  const movements = useUiStore((s) => s.leleMovements);
  const transferLele = useUiStore((s) => s.transferLele);
  const recordLeleMovement = useUiStore((s) => s.recordLeleMovement);
  const removeLeleMovement = useUiStore((s) => s.removeLeleMovement);

  const active = useMemo(() => ponds.filter((p) => p.active).sort((a, b) => a.code.localeCompare(b.code, "id", { numeric: true })), [ponds]);
  const first = active[0]?.id ?? "";
  const second = active.find((p) => p.id !== first)?.id ?? first;

  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const inRange = useCallback((d: string) => (!from || d >= from) && (!to || d <= to), [from, to]);

  const [tf, setTf] = useState({ date: today(), fromPondId: first, toPondId: second, qtyKg: "", qtyEkor: "", kategori: "Pemindahan" as SortirKategori, note: "" });
  const [sr, setSr] = useState({ date: today(), pondId: first, kategori: "Konsumsi" as SortirKategori, qtyKg: "", qtyEkor: "", note: "" });
  const [sk, setSk] = useState({ date: today(), pondId: first, qtyKg: "", qtyEkor: "", note: "" });

  // Kolam bisa termuat setelah render pertama (hydrate/sync). Pastikan pilihan
  // default selalu valid dan kolam asal ≠ tujuan saat kolam sudah tersedia.
  useEffect(() => {
    if (!active.length) return;
    const has = (id: string) => active.some((p) => p.id === id);
    setTf((f) => {
      const fromId = has(f.fromPondId) ? f.fromPondId : active[0].id;
      let toId = has(f.toPondId) ? f.toPondId : "";
      if (!toId || toId === fromId) toId = active.find((p) => p.id !== fromId)?.id ?? fromId;
      return fromId === f.fromPondId && toId === f.toPondId ? f : { ...f, fromPondId: fromId, toPondId: toId };
    });
    setSr((f) => (has(f.pondId) ? f : { ...f, pondId: active[0].id }));
    setSk((f) => (has(f.pondId) ? f : { ...f, pondId: active[0].id }));
  }, [active]);

  function submitTransfer() {
    const res = transferLele({ date: tf.date, fromPondId: tf.fromPondId, toPondId: tf.toPondId, qtyKg: tf.qtyKg ? Number(tf.qtyKg) : undefined, qtyEkor: tf.qtyEkor ? Number(tf.qtyEkor) : undefined, kategori: tf.kategori, note: tf.note.trim() || undefined });
    if (!res.ok) return toast.error(res.message ?? "Gagal.");
    toast.success("Transfer tercatat di kedua kolam.");
    setTf((f) => ({ ...f, qtyKg: "", qtyEkor: "", note: "" }));
  }
  function submitSortir() {
    const res = recordLeleMovement({ date: sr.date, type: "SORTIR", pondId: sr.pondId, kategori: sr.kategori, qtyKg: sr.qtyKg ? Number(sr.qtyKg) : undefined, qtyEkor: sr.qtyEkor ? Number(sr.qtyEkor) : undefined, note: sr.note.trim() || undefined });
    if (!res.ok) return toast.error(res.message ?? "Gagal.");
    toast.success("Sortir tercatat.");
    setSr((f) => ({ ...f, qtyKg: "", qtyEkor: "", note: "" }));
  }
  function submitSusut() {
    const res = recordLeleMovement({ date: sk.date, type: "PENYUSUTAN", pondId: sk.pondId, qtyKg: sk.qtyKg ? Number(sk.qtyKg) : undefined, qtyEkor: sk.qtyEkor ? Number(sk.qtyEkor) : undefined, note: sk.note.trim() || undefined });
    if (!res.ok) return toast.error(res.message ?? "Gagal.");
    toast.success("Penyusutan tercatat (bukan omzet).");
    setSk((f) => ({ ...f, qtyKg: "", qtyEkor: "", note: "" }));
  }

  const rows = useMemo(() => movements.filter((m) => inRange(m.date)).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)), [movements, inRange]);
  const summary = useMemo(() => {
    const sum = (t: LeleMoveType) => rows.filter((m) => m.type === t).reduce((s, m) => s + (m.qtyKg ?? 0), 0);
    return { transfer: rows.filter((m) => m.type === "TRANSFER_KELUAR").reduce((s, m) => s + (m.qtyKg ?? 0), 0), sortir: sum("SORTIR"), susut: sum("PENYUSUTAN"), total: rows.length };
  }, [rows]);

  if (active.length === 0) {
    return (
      <AppShell>
        <PageHeader eyebrow="Budidaya Lele" title="Mutasi & Sortir" description="Catat sortir, transfer antar-kolam, dan penyusutan." />
        <Card><CardContent className="py-10 text-center text-muted">Belum ada kolam. Tambahkan kolam dulu di menu Kolam &amp; Tebar (tombol Kolam Standar).</CardContent></Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Budidaya Lele" title="Mutasi & Sortir" description="Catat sortir (Konsumsi/Brojolan/Pemindahan), transfer antar-kolam yang selalu tercatat di kedua sisi, dan penyusutan yang tidak dihitung sebagai omzet." />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Mutasi" value={summary.total} icon={ArrowLeftRight} />
        <StatCard label="Transfer (kg)" value={numberFmt.format(Math.round(summary.transfer))} icon={ArrowLeftRight} tone="sky" />
        <StatCard label="Sortir (kg)" value={numberFmt.format(Math.round(summary.sortir))} icon={Scissors} tone="primary" />
        <StatCard label="Penyusutan (kg)" value={numberFmt.format(Math.round(summary.susut))} icon={TrendingDown} tone={summary.susut > 0 ? "danger" : "slate"} />
      </section>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        {/* Transfer */}
        <Card>
          <CardContent>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><ArrowLeftRight className="h-4 w-4 text-primary" /> Transfer Antar-Kolam</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal"><Input type="date" value={tf.date} onChange={(e) => setTf((f) => ({ ...f, date: e.target.value }))} /></Field>
              <Field label="Kategori"><Select value={tf.kategori} onChange={(e) => setTf((f) => ({ ...f, kategori: e.target.value as SortirKategori }))}>{SORTIR_KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}</Select></Field>
              <Field label="Dari"><Select value={tf.fromPondId} onChange={(e) => setTf((f) => ({ ...f, fromPondId: e.target.value }))}>{active.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</Select></Field>
              <Field label="Ke"><Select value={tf.toPondId} onChange={(e) => setTf((f) => ({ ...f, toPondId: e.target.value }))}>{active.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</Select></Field>
              <Field label="Bobot (kg)"><Input type="number" min={0} step="any" value={tf.qtyKg} onChange={(e) => setTf((f) => ({ ...f, qtyKg: e.target.value }))} /></Field>
              <Field label="Ekor"><Input type="number" min={0} value={tf.qtyEkor} onChange={(e) => setTf((f) => ({ ...f, qtyEkor: e.target.value }))} /></Field>
            </div>
            <div className="mt-3 flex justify-end"><Button onClick={submitTransfer}><ArrowLeftRight className="h-4 w-4" /> Transfer</Button></div>
          </CardContent>
        </Card>
        {/* Sortir */}
        <Card>
          <CardContent>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Scissors className="h-4 w-4 text-primary" /> Sortir / Grading</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal"><Input type="date" value={sr.date} onChange={(e) => setSr((f) => ({ ...f, date: e.target.value }))} /></Field>
              <Field label="Kolam"><Select value={sr.pondId} onChange={(e) => setSr((f) => ({ ...f, pondId: e.target.value }))}>{active.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</Select></Field>
              <Field label="Kategori"><Select value={sr.kategori} onChange={(e) => setSr((f) => ({ ...f, kategori: e.target.value as SortirKategori }))}>{SORTIR_KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}</Select></Field>
              <Field label="Bobot (kg)"><Input type="number" min={0} step="any" value={sr.qtyKg} onChange={(e) => setSr((f) => ({ ...f, qtyKg: e.target.value }))} /></Field>
              <Field label="Ekor"><Input type="number" min={0} value={sr.qtyEkor} onChange={(e) => setSr((f) => ({ ...f, qtyEkor: e.target.value }))} /></Field>
            </div>
            <div className="mt-3 flex justify-end"><Button onClick={submitSortir}><Plus className="h-4 w-4" /> Simpan Sortir</Button></div>
          </CardContent>
        </Card>
        {/* Penyusutan */}
        <Card>
          <CardContent>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><PackageMinus className="h-4 w-4 text-primary" /> Penyusutan</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal"><Input type="date" value={sk.date} onChange={(e) => setSk((f) => ({ ...f, date: e.target.value }))} /></Field>
              <Field label="Kolam"><Select value={sk.pondId} onChange={(e) => setSk((f) => ({ ...f, pondId: e.target.value }))}>{active.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</Select></Field>
              <Field label="Bobot (kg)"><Input type="number" min={0} step="any" value={sk.qtyKg} onChange={(e) => setSk((f) => ({ ...f, qtyKg: e.target.value }))} /></Field>
              <Field label="Ekor"><Input type="number" min={0} value={sk.qtyEkor} onChange={(e) => setSk((f) => ({ ...f, qtyEkor: e.target.value }))} /></Field>
              <div className="col-span-2"><Field label="Catatan"><Input value={sk.note} onChange={(e) => setSk((f) => ({ ...f, note: e.target.value }))} placeholder="opsional" /></Field></div>
            </div>
            <p className="mt-1 text-[11px] text-muted">Penyusutan dicatat sebagai kehilangan stok, bukan penjualan/omzet.</p>
            <div className="mt-2 flex justify-end"><Button onClick={submitSusut}><TrendingDown className="h-4 w-4" /> Simpan</Button></div>
          </CardContent>
        </Card>
      </div>

      {/* Riwayat */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Dari"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10" /></Field>
          <Field label="Sampai"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10" /></Field>
          <Button variant="ghost" className="h-10" onClick={() => { setFrom(""); setTo(""); }}>Semua</Button>
        </div>
        <Button variant="secondary" onClick={() => exportCsv(`mutasi-lele-${from || "semua"}`, rows.map((m) => ({ Tanggal: m.date, Jenis: typeLabel[m.type], Kolam: m.pondCode, Ke: m.toPondCode ?? "", Kategori: m.kategori ?? "", Kg: m.qtyKg ?? "", Ekor: m.qtyEkor ?? "", Catatan: m.note ?? "" })))} disabled={rows.length === 0}>Ekspor CSV</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900/60">
            <tr>
              <th className="px-3 py-2 font-semibold">Tanggal</th>
              <th className="px-3 py-2 font-semibold">Jenis</th>
              <th className="px-3 py-2 font-semibold">Kolam</th>
              <th className="px-3 py-2 font-semibold">Kategori</th>
              <th className="px-3 py-2 text-right font-semibold">Kg</th>
              <th className="px-3 py-2 text-right font-semibold">Ekor</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted">Belum ada mutasi pada periode ini.</td></tr>
            ) : (
              rows.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-3 py-2">{formatDate(m.date)}</td>
                  <td className="px-3 py-2"><Badge className={typeTone[m.type] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}>{typeLabel[m.type]}</Badge></td>
                  <td className="px-3 py-2 font-medium">{m.pondCode}{m.toPondCode && (m.type === "TRANSFER_KELUAR" ? ` → ${m.toPondCode}` : m.type === "TRANSFER_MASUK" ? ` ← ${m.toPondCode}` : "")}</td>
                  <td className="px-3 py-2 text-muted">{m.kategori ?? "-"}{m.note ? <span className="block text-[11px]">{m.note}</span> : null}</td>
                  <td className="px-3 py-2 text-right">{m.qtyKg ? numberFmt.format(m.qtyKg) : "-"}</td>
                  <td className="px-3 py-2 text-right">{m.qtyEkor ? numberFmt.format(m.qtyEkor) : "-"}</td>
                  <td className="px-3 py-2 text-right"><button onClick={() => { if (confirm(m.ref ? "Hapus transfer ini (kedua sisi)?" : "Hapus mutasi ini?")) removeLeleMovement(m.id); }} className="text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

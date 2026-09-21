"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Scissors, TrendingDown, Trash2, Plus, X, CalendarClock } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { cycleMetrics } from "@/lib/lele";
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

type SortOutput = { id: string; kategori: SortirKategori; qtyKg: string; qtyEkor: string; targetPondId: string };
const uid = () => Math.random().toString(36).slice(2);

export default function MutasiLelePage() {
  const ponds = useUiStore((s) => s.ponds);
  const cycles = useUiStore((s) => s.fishCycles);
  const logs = useUiStore((s) => s.pondLogs);
  const harvests = useUiStore((s) => s.pondHarvests);
  const movements = useUiStore((s) => s.leleMovements);
  const transferLele = useUiStore((s) => s.transferLele);
  const recordLeleMovement = useUiStore((s) => s.recordLeleMovement);
  const removeLeleMovement = useUiStore((s) => s.removeLeleMovement);

  const active = useMemo(() => ponds.filter((p) => p.active).sort((a, b) => a.code.localeCompare(b.code, "id", { numeric: true })), [ponds]);
  const first = active[0]?.id ?? "";

  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const inRange = useCallback((d: string) => (!from || d >= from) && (!to || d <= to), [from, to]);

  // Konteks stok kolam (umur/biomassa/estimasi ekor) untuk panel Sortir.
  const context = useCallback((pondId: string) => {
    const cyc = cycles.find((c) => c.pondId === pondId && c.status === "Aktif");
    if (!cyc) return null;
    const m = cycleMetrics(cyc, logs, harvests);
    return { species: cyc.species, ageLabel: m.ageLabel, biomassKg: m.biomassKg, currentCount: m.currentCount, avg: m.latestAvgWeightG };
  }, [cycles, logs, harvests]);

  // ── Modals ──
  const [openTransfer, setOpenTransfer] = useState(false);
  const [openSortir, setOpenSortir] = useState(false);
  const [openSusut, setOpenSusut] = useState(false);

  const [tf, setTf] = useState({ date: today(), fromPondId: first, toPondId: "", qtyKg: "", qtyEkor: "", kategori: "Pemindahan" as SortirKategori, note: "" });
  const [sk, setSk] = useState({ date: today(), pondId: first, qtyKg: "", qtyEkor: "", note: "" });
  const [sortir, setSortir] = useState<{ date: string; pondId: string; note: string; outputs: SortOutput[] }>({ date: today(), pondId: first, note: "", outputs: [{ id: uid(), kategori: "Konsumsi", qtyKg: "", qtyEkor: "", targetPondId: "" }] });

  useEffect(() => {
    if (!active.length) return;
    const has = (id: string) => active.some((p) => p.id === id);
    setTf((f) => {
      const fromId = has(f.fromPondId) ? f.fromPondId : active[0].id;
      let toId = has(f.toPondId) ? f.toPondId : "";
      if (!toId || toId === fromId) toId = active.find((p) => p.id !== fromId)?.id ?? fromId;
      return { ...f, fromPondId: fromId, toPondId: toId };
    });
    setSk((f) => (has(f.pondId) ? f : { ...f, pondId: active[0].id }));
    setSortir((f) => (has(f.pondId) ? f : { ...f, pondId: active[0].id }));
  }, [active]);

  function submitTransfer() {
    const res = transferLele({ date: tf.date, fromPondId: tf.fromPondId, toPondId: tf.toPondId, qtyKg: tf.qtyKg ? Number(tf.qtyKg) : undefined, qtyEkor: tf.qtyEkor ? Number(tf.qtyEkor) : undefined, kategori: tf.kategori, note: tf.note.trim() || undefined });
    if (!res.ok) return toast.error(res.message ?? "Gagal.");
    toast.success("Transfer tercatat di kedua kolam.");
    setTf((f) => ({ ...f, qtyKg: "", qtyEkor: "", note: "" }));
    setOpenTransfer(false);
  }
  function submitSusut() {
    const res = recordLeleMovement({ date: sk.date, type: "PENYUSUTAN", pondId: sk.pondId, qtyKg: sk.qtyKg ? Number(sk.qtyKg) : undefined, qtyEkor: sk.qtyEkor ? Number(sk.qtyEkor) : undefined, note: sk.note.trim() || undefined });
    if (!res.ok) return toast.error(res.message ?? "Gagal.");
    toast.success("Penyusutan tercatat (bukan omzet).");
    setSk((f) => ({ ...f, qtyKg: "", qtyEkor: "" }));
    setOpenSusut(false);
  }

  // ── Multi-output sortir ──
  const srcCtx = context(sortir.pondId);
  const sortirTotals = useMemo(() => {
    const kg = sortir.outputs.reduce((t, o) => t + (Number(o.qtyKg) || 0), 0);
    const ekor = sortir.outputs.reduce((t, o) => t + (Number(o.qtyEkor) || 0), 0);
    return { kg, ekor, rows: sortir.outputs.filter((o) => Number(o.qtyKg) > 0 || Number(o.qtyEkor) > 0).length };
  }, [sortir.outputs]);
  function setOutput(id: string, patch: Partial<SortOutput>) {
    setSortir((f) => ({ ...f, outputs: f.outputs.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
  }
  function addOutput() {
    setSortir((f) => ({ ...f, outputs: [...f.outputs, { id: uid(), kategori: "Konsumsi", qtyKg: "", qtyEkor: "", targetPondId: "" }] }));
  }
  function removeOutput(id: string) {
    setSortir((f) => ({ ...f, outputs: f.outputs.length > 1 ? f.outputs.filter((o) => o.id !== id) : f.outputs }));
  }
  function confirmSortir() {
    const valid = sortir.outputs.filter((o) => Number(o.qtyKg) > 0 || Number(o.qtyEkor) > 0);
    if (valid.length === 0) return toast.error("Isi minimal satu output sortir (kg atau ekor).");
    let ok = 0;
    for (const o of valid) {
      const kg = Number(o.qtyKg) || undefined;
      const ekor = Number(o.qtyEkor) || undefined;
      const note = sortir.note.trim() || undefined;
      const res = o.targetPondId
        ? transferLele({ date: sortir.date, fromPondId: sortir.pondId, toPondId: o.targetPondId, qtyKg: kg, qtyEkor: ekor, kategori: o.kategori, note })
        : recordLeleMovement({ date: sortir.date, type: "SORTIR", pondId: sortir.pondId, kategori: o.kategori, qtyKg: kg, qtyEkor: ekor, note });
      if (res.ok) ok++;
      else toast.error(res.message ?? "Sebagian output gagal.");
    }
    if (ok > 0) {
      toast.success(`Sortir dikonfirmasi: ${ok} output tercatat.`);
      setSortir((f) => ({ ...f, note: "", outputs: [{ id: uid(), kategori: "Konsumsi", qtyKg: "", qtyEkor: "", targetPondId: "" }] }));
      setOpenSortir(false);
    }
  }

  const rows = useMemo(() => movements.filter((m) => inRange(m.date)).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)), [movements, inRange]);
  const summary = useMemo(() => {
    const t = today();
    const sum = (ty: LeleMoveType) => rows.filter((m) => m.type === ty).reduce((s, m) => s + (m.qtyKg ?? 0), 0);
    return { todayCount: movements.filter((m) => m.date === t).length, transfer: sum("TRANSFER_KELUAR"), sortir: sum("SORTIR"), susut: sum("PENYUSUTAN") };
  }, [rows, movements]);

  if (active.length === 0) {
    return (
      <AppShell>
        <PageHeader eyebrow="Budidaya Lele" title="Mutasi & Sortir" description="Catat sortir, transfer antar-kolam, dan penyusutan." />
        <div className="rounded-2xl border border-dashed border-border-strong bg-card-muted p-10 text-center text-muted">Belum ada kolam. Tambahkan kolam dulu di menu Kolam &amp; Tebar (tombol Kolam Standar).</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Budidaya Lele"
        title="Mutasi & Sortir"
        description="Ringkasan pergerakan stok lele. Gunakan aksi cepat untuk mencatat — form tidak semuanya tampil sekaligus."
        action={
          <>
            <Button variant="secondary" onClick={() => setOpenTransfer(true)}><ArrowLeftRight className="h-4 w-4" /> Transfer</Button>
            <Button onClick={() => setOpenSortir(true)}><Scissors className="h-4 w-4" /> Sortir</Button>
            <Button variant="secondary" onClick={() => setOpenSusut(true)}><TrendingDown className="h-4 w-4" /> Penyusutan</Button>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Mutasi Hari Ini" value={summary.todayCount} icon={CalendarClock} />
        <StatCard label="Transfer (kg)" value={numberFmt.format(Math.round(summary.transfer))} icon={ArrowLeftRight} tone="sky" />
        <StatCard label="Sortir (kg)" value={numberFmt.format(Math.round(summary.sortir))} icon={Scissors} tone="primary" />
        <StatCard label="Penyusutan (kg)" value={numberFmt.format(Math.round(summary.susut))} icon={TrendingDown} tone={summary.susut > 0 ? "danger" : "slate"} />
      </section>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Dari"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10" /></Field>
          <Field label="Sampai"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10" /></Field>
          <Button variant="ghost" className="h-10" onClick={() => { setFrom(""); setTo(""); }}>Semua</Button>
        </div>
        <Button variant="secondary" onClick={() => exportCsv(`mutasi-lele-${from || "semua"}`, rows.map((m) => ({ Tanggal: m.date, Jenis: typeLabel[m.type], Kolam: m.pondCode, Ke: m.toPondCode ?? "", Kategori: m.kategori ?? "", Kg: m.qtyKg ?? "", Ekor: m.qtyEkor ?? "", Catatan: m.note ?? "" })))} disabled={rows.length === 0}>Ekspor CSV</Button>
      </div>

      {/* Desktop: tabel. Mobile: kartu. */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border sm:block">
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
      <div className="grid gap-2 sm:hidden">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-strong bg-card-muted p-6 text-center text-sm text-muted">Belum ada mutasi pada periode ini.</div>
        ) : rows.map((m) => (
          <div key={m.id} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <Badge className={typeTone[m.type] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}>{typeLabel[m.type]}</Badge>
              <span className="text-xs text-muted">{formatDate(m.date)}</span>
            </div>
            <p className="mt-1.5 font-semibold">{m.pondCode}{m.toPondCode && (m.type === "TRANSFER_KELUAR" ? ` → ${m.toPondCode}` : m.type === "TRANSFER_MASUK" ? ` ← ${m.toPondCode}` : "")}</p>
            <p className="text-sm text-muted">{m.kategori ?? "-"} · {m.qtyKg ? `${numberFmt.format(m.qtyKg)} kg` : ""}{m.qtyEkor ? ` ${numberFmt.format(m.qtyEkor)} ekor` : ""}</p>
            <div className="mt-1 flex justify-end"><button onClick={() => { if (confirm(m.ref ? "Hapus transfer ini (kedua sisi)?" : "Hapus mutasi ini?")) removeLeleMovement(m.id); }} className="text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button></div>
          </div>
        ))}
      </div>

      {/* Modal Transfer */}
      <Modal open={openTransfer} onClose={() => setOpenTransfer(false)} title="Transfer Antar-Kolam" description="Tercatat di kedua sisi: keluar di asal, masuk di tujuan.">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal"><Input type="date" value={tf.date} onChange={(e) => setTf((f) => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Kategori"><Select value={tf.kategori} onChange={(e) => setTf((f) => ({ ...f, kategori: e.target.value as SortirKategori }))}>{SORTIR_KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}</Select></Field>
          <Field label="Dari"><Select value={tf.fromPondId} onChange={(e) => setTf((f) => ({ ...f, fromPondId: e.target.value }))}>{active.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</Select></Field>
          <Field label="Ke"><Select value={tf.toPondId} onChange={(e) => setTf((f) => ({ ...f, toPondId: e.target.value }))}>{active.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</Select></Field>
          <Field label="Bobot (kg)"><Input type="number" min={0} step="any" value={tf.qtyKg} onChange={(e) => setTf((f) => ({ ...f, qtyKg: e.target.value }))} /></Field>
          <Field label="Ekor"><Input type="number" min={0} value={tf.qtyEkor} onChange={(e) => setTf((f) => ({ ...f, qtyEkor: e.target.value }))} /></Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpenTransfer(false)}>Batal</Button>
          <Button onClick={submitTransfer}><ArrowLeftRight className="h-4 w-4" /> Transfer</Button>
        </div>
      </Modal>

      {/* Modal Penyusutan */}
      <Modal open={openSusut} onClose={() => setOpenSusut(false)} title="Penyusutan" description="Kehilangan stok — bukan penjualan/omzet.">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal"><Input type="date" value={sk.date} onChange={(e) => setSk((f) => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Kolam"><Select value={sk.pondId} onChange={(e) => setSk((f) => ({ ...f, pondId: e.target.value }))}>{active.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</Select></Field>
          <Field label="Bobot (kg)"><Input type="number" min={0} step="any" value={sk.qtyKg} onChange={(e) => setSk((f) => ({ ...f, qtyKg: e.target.value }))} /></Field>
          <Field label="Ekor"><Input type="number" min={0} value={sk.qtyEkor} onChange={(e) => setSk((f) => ({ ...f, qtyEkor: e.target.value }))} /></Field>
          <div className="col-span-2"><Field label="Catatan"><Input value={sk.note} onChange={(e) => setSk((f) => ({ ...f, note: e.target.value }))} placeholder="opsional" /></Field></div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpenSusut(false)}>Batal</Button>
          <Button onClick={submitSusut}><TrendingDown className="h-4 w-4" /> Simpan</Button>
        </div>
      </Modal>

      {/* Modal Sortir multi-output */}
      <Modal open={openSortir} onClose={() => setOpenSortir(false)} title="Sortir / Grading" description="Pilih kolam sumber, tambah beberapa output, lalu konfirmasi." size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal"><Input type="date" value={sortir.date} onChange={(e) => setSortir((f) => ({ ...f, date: e.target.value }))} /></Field>
            <Field label="Kolam sumber"><Select value={sortir.pondId} onChange={(e) => setSortir((f) => ({ ...f, pondId: e.target.value }))}>{active.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</Select></Field>
          </div>
          {/* Konteks stok kolam sumber */}
          <div className="rounded-xl border border-border bg-card-muted p-3 text-sm">
            {srcCtx ? (
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <span><span className="text-muted">Umur:</span> <b>{srcCtx.ageLabel}</b></span>
                <span><span className="text-muted">Biomassa:</span> <b>{srcCtx.biomassKg != null ? `± ${srcCtx.biomassKg.toFixed(1)} kg` : "—"}</b></span>
                <span><span className="text-muted">Estimasi ekor:</span> <b>{numberFmt.format(srcCtx.currentCount)}</b></span>
                {srcCtx.avg != null && <span><span className="text-muted">Rata-rata:</span> <b>{srcCtx.avg} g</b></span>}
              </div>
            ) : (
              <span className="text-muted">Kolam ini tidak punya siklus aktif — sortir tetap dapat dicatat sebagai pergerakan stok.</span>
            )}
          </div>

          {/* Output rows */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Output sortir</p>
            {sortir.outputs.map((o, i) => (
              <div key={o.id} className="rounded-xl border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">Output {i + 1}</span>
                  {sortir.outputs.length > 1 && <button onClick={() => removeOutput(o.id)} className="text-danger" aria-label="Hapus output"><X className="h-4 w-4" /></button>}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Field label="Kategori"><Select value={o.kategori} onChange={(e) => setOutput(o.id, { kategori: e.target.value as SortirKategori })}>{SORTIR_KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}</Select></Field>
                  <Field label="Kg"><Input type="number" min={0} step="any" value={o.qtyKg} onChange={(e) => setOutput(o.id, { qtyKg: e.target.value })} /></Field>
                  <Field label="Ekor"><Input type="number" min={0} value={o.qtyEkor} onChange={(e) => setOutput(o.id, { qtyEkor: e.target.value })} /></Field>
                  <Field label="Pindah ke (opsional)"><Select value={o.targetPondId} onChange={(e) => setOutput(o.id, { targetPondId: e.target.value })}><option value="">— tetap (sortir)</option>{active.filter((p) => p.id !== sortir.pondId).map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</Select></Field>
                </div>
              </div>
            ))}
            <Button variant="secondary" className="w-full" onClick={addOutput}><Plus className="h-4 w-4" /> Tambah Output</Button>
          </div>

          {/* Review */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary/5 p-3 text-sm">
            <span className="text-muted">Ringkasan: <b className="text-foreground">{sortirTotals.rows} output</b> · <b className="text-foreground">{numberFmt.format(Math.round(sortirTotals.kg))} kg</b>{sortirTotals.ekor > 0 && <> · <b className="text-foreground">{numberFmt.format(sortirTotals.ekor)} ekor</b></>}</span>
            <span className="text-xs text-muted">Output ber-tujuan → transfer dua sisi otomatis.</span>
          </div>
          <Field label="Catatan (opsional)"><Input value={sortir.note} onChange={(e) => setSortir((f) => ({ ...f, note: e.target.value }))} placeholder="mis. sortir mingguan" /></Field>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenSortir(false)}>Batal</Button>
            <Button onClick={confirmSortir}><Scissors className="h-4 w-4" /> Konfirmasi Sortir</Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

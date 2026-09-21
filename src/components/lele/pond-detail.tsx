"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Fish,
  NotebookPen,
  Plus,
  Skull,
  Trash2,
  TrendingUp,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { FeedSelect } from "@/components/lele/feed-select";
import { JOURNAL_CATEGORIES, journalTone } from "@/components/lele/journal-shared";
import { useUiStore } from "@/lib/store";
import { cycleMetrics } from "@/lib/lele";
import { suggestFeed } from "@/lib/feed";
import { currency, formatDate, numberFmt } from "@/lib/utils";
import type { FishCycle, JournalCategory, Pond } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

const statTones: Record<string, string> = {
  slate: "bg-slate-50 dark:bg-slate-800/50",
  primary: "bg-emerald-50 dark:bg-emerald-950/30",
  amber: "bg-amber-50 dark:bg-amber-950/30",
  danger: "bg-red-50 dark:bg-red-950/30",
  sky: "bg-sky-50 dark:bg-sky-950/30",
};

function Stat({ label, value, hint, tone = "slate" }: { label: string; value: string; hint?: string; tone?: keyof typeof statTones }) {
  return (
    <div className={`min-w-0 rounded-xl border border-border/60 p-3 ${statTones[tone]}`}>
      <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 truncate text-lg font-bold leading-tight">{value}</p>
      {hint && <p className="truncate text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

const gid = () => Math.random().toString(36).slice(2);

type GradeRow = { id: string; kategori: "Konsumsi" | "Brojolan"; weightKg: string; count: string; targetPondId: string };

export function PondDetailModal({ pond, cycle, onClose }: { pond: Pond; cycle: FishCycle | null; onClose: () => void }) {
  const ponds = useUiStore((s) => s.ponds);
  const logs = useUiStore((s) => s.pondLogs);
  const harvests = useUiStore((s) => s.pondHarvests);
  const journals = useUiStore((s) => s.pondJournals);
  const addPondLog = useUiStore((s) => s.addPondLog);
  const removePondLog = useUiStore((s) => s.removePondLog);
  const addPondHarvest = useUiStore((s) => s.addPondHarvest);
  const removePondHarvest = useUiStore((s) => s.removePondHarvest);
  const addPondJournal = useUiStore((s) => s.addPondJournal);
  const removePondJournal = useUiStore((s) => s.removePondJournal);
  const closeCycle = useUiStore((s) => s.closeCycle);

  const [tab, setTab] = useState<"harian" | "panen" | "jurnal">("harian");
  const metrics = useMemo(() => (cycle ? cycleMetrics(cycle, logs, harvests) : null), [cycle, logs, harvests]);
  const cycleLogs = useMemo(
    () => (cycle ? logs.filter((l) => l.cycleId === cycle.id).sort((a, b) => b.date.localeCompare(a.date)) : []),
    [cycle, logs],
  );
  const cycleHarvests = useMemo(
    () => (cycle ? harvests.filter((h) => h.cycleId === cycle.id).sort((a, b) => b.date.localeCompare(a.date)) : []),
    [cycle, harvests],
  );
  const pondJournals = useMemo(
    () => journals.filter((j) => j.pondId === pond.id).sort((a, b) => b.date.localeCompare(a.date)),
    [journals, pond.id],
  );

  const suggested = suggestFeed(metrics?.ageDays ?? 0);
  const [feed, setFeed] = useState<{ date: string; session: "Pagi" | "Sore" | "Tambahan"; feedKg: string; feedBrand: string; feedType: string; feedCostRp: string; pricePerKg: number; deaths: string; avgWeightG: string; note: string }>({ date: today(), session: "Pagi", feedKg: "", feedBrand: "", feedType: "", feedCostRp: "", pricePerKg: 0, deaths: "", avgWeightG: "", note: "" });
  const [harvest, setHarvest] = useState<{ date: string; buyer: string; isFinal: boolean; note: string; pricePerKg: string; outputs: GradeRow[] }>({ date: today(), buyer: "", isFinal: false, note: "", pricePerKg: "", outputs: [{ id: gid(), kategori: "Konsumsi", weightKg: "", count: "", targetPondId: "" }] });
  const harvestTargets = useMemo(() => ponds.filter((p) => p.active && p.id !== pond.id).sort((a, b) => (a.kind === "tampungan" ? -1 : 1) - (b.kind === "tampungan" ? -1 : 1) || a.code.localeCompare(b.code, "id", { numeric: true })), [ponds, pond.id]);
  const harvestTotalKg = harvest.outputs.reduce((t, o) => t + (Number(o.weightKg) || 0), 0);
  const [journal, setJournal] = useState<{ date: string; category: JournalCategory; title: string; note: string; waterTemp: string; waterPh: string }>({ date: today(), category: "Catatan Umum", title: "", note: "", waterTemp: "", waterPh: "" });

  function submitFeed(close = false) {
    if (!cycle) return;
    const feedKg = Number(feed.feedKg) || 0;
    const deaths = Number(feed.deaths) || 0;
    if (feedKg <= 0 && deaths <= 0 && !feed.avgWeightG) return toast.error("Isi minimal pakan, kematian, atau bobot sampling.");
    const res = addPondLog({
      cycleId: cycle.id,
      pondId: pond.id,
      date: feed.date,
      session: feed.session,
      feedKg,
      feedBrand: feed.feedBrand || suggested.brand,
      feedType: feed.feedType || suggested.code,
      feedCostRp: Number(feed.feedCostRp) || 0,
      deaths,
      avgWeightG: feed.avgWeightG ? Number(feed.avgWeightG) : undefined,
      note: feed.note.trim() || undefined,
    });
    if (!res.ok) return toast.error(res.message ?? "Gagal menyimpan.");
    toast.success("Catatan harian tersimpan.");
    setFeed({ date: today(), session: feed.session, feedKg: "", feedBrand: feed.feedBrand, feedType: feed.feedType, feedCostRp: "", pricePerKg: feed.pricePerKg, deaths: "", avgWeightG: "", note: "" });
    if (close) onClose();
  }

  function onFeedKg(v: string) {
    setFeed((f) => {
      const cost = f.pricePerKg > 0 && v ? String(Math.round(Number(v) * f.pricePerKg)) : f.feedCostRp;
      return { ...f, feedKg: v, feedCostRp: cost };
    });
  }

  function setGrade(id: string, patch: Partial<GradeRow>) {
    setHarvest((h) => ({ ...h, outputs: h.outputs.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
  }
  function addGrade() {
    setHarvest((h) => ({ ...h, outputs: [...h.outputs, { id: gid(), kategori: "Konsumsi", weightKg: "", count: "", targetPondId: "" }] }));
  }
  function removeGrade(id: string) {
    setHarvest((h) => ({ ...h, outputs: h.outputs.length > 1 ? h.outputs.filter((o) => o.id !== id) : h.outputs }));
  }
  function submitHarvest() {
    if (!cycle) return;
    const outs = harvest.outputs.filter((o) => Number(o.weightKg) > 0 || Number(o.count) > 0);
    if (outs.length === 0) return toast.error("Isi minimal satu hasil panen (kg atau ekor).");
    const totalKg = outs.reduce((t, o) => t + (Number(o.weightKg) || 0), 0);
    const totalCount = outs.reduce((t, o) => t + (Number(o.count) || 0), 0);
    const res = addPondHarvest({
      cycleId: cycle.id,
      pondId: pond.id,
      date: harvest.date,
      count: totalCount,
      weightKg: totalKg,
      pricePerKg: Number(harvest.pricePerKg) || 0,
      buyer: harvest.buyer.trim() || undefined,
      isFinal: harvest.isFinal,
      note: harvest.note.trim() || undefined,
      outputs: outs.map((o) => ({ id: o.id, kategori: o.kategori, weightKg: Number(o.weightKg) || 0, count: Number(o.count) || undefined, targetPondId: o.targetPondId || undefined })),
    });
    if (!res.ok) return toast.error(res.message ?? "Gagal menyimpan.");
    toast.success(harvest.isFinal ? "Panen total tersimpan, siklus ditutup." : "Panen tersimpan & didistribusikan.");
    setHarvest({ date: today(), buyer: harvest.buyer, isFinal: false, note: "", pricePerKg: harvest.pricePerKg, outputs: [{ id: gid(), kategori: "Konsumsi", weightKg: "", count: "", targetPondId: "" }] });
  }

  function submitJournal() {
    const res = addPondJournal({
      pondId: pond.id,
      pondCode: pond.code,
      cycleId: cycle?.id,
      date: journal.date,
      category: journal.category,
      title: journal.title.trim(),
      note: journal.note.trim(),
      waterTemp: journal.waterTemp ? Number(journal.waterTemp) : undefined,
      waterPh: journal.waterPh ? Number(journal.waterPh) : undefined,
    });
    if (!res.ok) return toast.error(res.message ?? "Gagal menyimpan.");
    toast.success("Jurnal tersimpan.");
    setJournal({ date: today(), category: "Catatan Umum", title: "", note: "", waterTemp: "", waterPh: "" });
  }

  const title = `Kolam ${pond.code}${pond.name ? ` — ${pond.name}` : ""}`;
  const tabs: { key: typeof tab; label: string; count: number }[] = [
    { key: "harian", label: "Catatan Harian", count: cycleLogs.length },
    { key: "panen", label: "Panen", count: cycleHarvests.length },
    { key: "jurnal", label: "Jurnal", count: pondJournals.length },
  ];

  return (
    <Modal open onClose={onClose} title={title} description={cycle ? `${cycle.species} · ditebar ${formatDate(cycle.stockDate)}` : "Kolam kosong — belum ada siklus aktif."} size="lg">
      <div className="space-y-5">
        {cycle && metrics && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <Stat label="Umur" value={metrics.ageLabel} hint={`sejak ${formatDate(cycle.stockDate)}`} tone="primary" />
            <Stat label="Ikan hidup" value={`${numberFmt.format(metrics.currentCount)} ekor`} hint={`dari ${numberFmt.format(cycle.initialCount)} tebar`} tone="sky" />
            <Stat label="Sintasan (SR)" value={`${Math.round(metrics.survivalRate * 100)}%`} hint={`mati ${numberFmt.format(metrics.deaths)} ekor`} tone={metrics.survivalRate >= 0.8 ? "primary" : "amber"} />
            <Stat label="Asal benih" value={cycle.source || "-"} hint={cycle.sizeAtStock} />
            <Stat label="Bobot rata-rata" value={metrics.latestAvgWeightG ? `${metrics.latestAvgWeightG} g` : "belum ada"} hint={metrics.biomassKg ? `biomassa ± ${metrics.biomassKg.toFixed(1)} kg` : "isi sampling"} />
            <Stat label="Total pakan" value={`${numberFmt.format(metrics.totalFeedKg)} kg`} hint={currency.format(metrics.totalFeedCostRp)} tone="amber" />
            <Stat label="Saran pakan/hari" value={metrics.recommendedFeedKg != null ? `${metrics.recommendedFeedKg} kg` : "-"} hint={`${suggested.brand} ${suggested.code}`} />
            <Stat label="Laba berjalan" value={currency.format(metrics.profitRp)} hint={`omzet ${currency.format(metrics.revenueRp)}`} tone={metrics.profitRp >= 0 ? "primary" : "danger"} />
          </div>
        )}

        {/* Aksi cepat */}
        {cycle && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="h-9" onClick={() => setTab("harian")}><Utensils className="h-4 w-4" /> Pakan</Button>
            <Button variant="secondary" className="h-9" onClick={() => setTab("jurnal")}><NotebookPen className="h-4 w-4" /> Kondisi</Button>
            <Button variant="secondary" className="h-9" onClick={() => setTab("panen")}><TrendingUp className="h-4 w-4" /> Panen</Button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              disabled={!cycle && t.key !== "jurnal"}
              className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition disabled:opacity-40 ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"}`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {!cycle && tab !== "jurnal" ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Fish className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-2 font-semibold">Kolam kosong</p>
            <p className="mt-1 text-sm text-muted">Mulai siklus dengan menebar benih dari menu Kolam &amp; Tebar. Jurnal tetap bisa diisi.</p>
          </div>
        ) : tab === "harian" && cycle && metrics ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-background p-3 sm:p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Utensils className="h-4 w-4 text-primary" /> Input Pakan &amp; Kondisi Harian</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Field label="Tanggal"><Input type="date" value={feed.date} onChange={(e) => setFeed((f) => ({ ...f, date: e.target.value }))} /></Field>
                <Field label="Sesi"><Select value={feed.session} onChange={(e) => setFeed((f) => ({ ...f, session: e.target.value as typeof f.session }))}><option value="Pagi">Pagi</option><option value="Sore">Sore</option><option value="Tambahan">Tambahan</option></Select></Field>
                <div className="col-span-2 sm:col-span-3">
                  <FeedSelect
                    brand={feed.feedBrand}
                    code={feed.feedType}
                    onPick={(prod, raw) =>
                      setFeed((f) => {
                        const price = prod?.pricePerKg ?? 0;
                        return { ...f, feedBrand: raw.brand, feedType: raw.code, pricePerKg: price, feedCostRp: price > 0 && f.feedKg ? String(Math.round(Number(f.feedKg) * price)) : f.feedCostRp };
                      })
                    }
                  />
                </div>
                <Field label="Pakan (kg)"><Input type="number" min={0} step="any" value={feed.feedKg} onChange={(e) => onFeedKg(e.target.value)} placeholder={metrics.recommendedFeedKg?.toString()} /></Field>
                <Field label="Biaya pakan (Rp)" hint={feed.pricePerKg ? `± Rp${feed.pricePerKg.toLocaleString("id-ID")}/kg` : undefined}><Input type="number" min={0} value={feed.feedCostRp} onChange={(e) => setFeed((f) => ({ ...f, feedCostRp: e.target.value }))} /></Field>
                <Field label="Mati (ekor)"><Input type="number" min={0} value={feed.deaths} onChange={(e) => setFeed((f) => ({ ...f, deaths: e.target.value }))} /></Field>
                <Field label="Sampling bobot (g)"><Input type="number" min={0} step="any" value={feed.avgWeightG} onChange={(e) => setFeed((f) => ({ ...f, avgWeightG: e.target.value }))} placeholder="opsional" /></Field>
                <div className="col-span-2 sm:col-span-1"><Field label="Catatan"><Input value={feed.note} onChange={(e) => setFeed((f) => ({ ...f, note: e.target.value }))} placeholder="opsional" /></Field></div>
              </div>
              <div className="mt-2 flex flex-wrap justify-end gap-2">
                <Button variant="secondary" onClick={() => submitFeed(true)}>Simpan &amp; tutup</Button>
                <Button onClick={() => submitFeed(false)}><Plus className="h-4 w-4" /> Simpan &amp; lanjut</Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900/60">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Tanggal</th>
                    <th className="px-3 py-2 font-semibold">Sesi</th>
                    <th className="px-3 py-2 font-semibold">Pakan</th>
                    <th className="px-3 py-2 text-right font-semibold">Kg</th>
                    <th className="px-3 py-2 text-right font-semibold">Biaya</th>
                    <th className="px-3 py-2 text-right font-semibold">Mati</th>
                    <th className="px-3 py-2 text-right font-semibold">Bobot</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {cycleLogs.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-6 text-center text-muted">Belum ada catatan harian.</td></tr>
                  ) : (
                    cycleLogs.map((l) => (
                      <tr key={l.id} className="border-t border-border">
                        <td className="whitespace-nowrap px-3 py-2">{formatDate(l.date)}</td>
                        <td className="px-3 py-2 text-muted">{l.session ?? "-"}</td>
                        <td className="px-3 py-2"><span className="font-medium">{l.feedType || "-"}</span>{l.feedBrand && <span className="block text-[11px] text-muted">{l.feedBrand}</span>}</td>
                        <td className="px-3 py-2 text-right">{l.feedKg || "-"}</td>
                        <td className="px-3 py-2 text-right">{l.feedCostRp ? currency.format(l.feedCostRp) : "-"}</td>
                        <td className="px-3 py-2 text-right">{l.deaths || "-"}</td>
                        <td className="px-3 py-2 text-right">{l.avgWeightG ? `${l.avgWeightG} g` : "-"}</td>
                        <td className="px-3 py-2 text-right"><button onClick={() => { if (confirm("Hapus catatan ini?")) removePondLog(l.id); }} className="text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === "panen" && cycle ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-background p-3 sm:p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> Catat Panen &amp; Sortir</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Field label="Tanggal"><Input type="date" value={harvest.date} onChange={(e) => setHarvest((h) => ({ ...h, date: e.target.value }))} /></Field>
                <Field label="Pembeli (opsional)"><Input value={harvest.buyer} onChange={(e) => setHarvest((h) => ({ ...h, buyer: e.target.value }))} placeholder="jika langsung jual" /></Field>
                <Field label="Harga/kg (opsional)"><Input type="number" min={0} value={harvest.pricePerKg} onChange={(e) => setHarvest((h) => ({ ...h, pricePerKg: e.target.value }))} placeholder="jika langsung jual" /></Field>
              </div>

              {/* Grading: Konsumsi / Brojolan → kolam tujuan */}
              <p className="mt-3 mb-1.5 text-xs font-semibold text-muted">Hasil sortir → taruh di kolam</p>
              <div className="space-y-2">
                {harvest.outputs.map((o, i) => (
                  <div key={o.id} className="rounded-lg border border-border p-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted">Bagian {i + 1}</span>
                      {harvest.outputs.length > 1 && <button onClick={() => removeGrade(o.id)} className="text-danger" aria-label="Hapus"><X className="h-4 w-4" /></button>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Field label="Kategori"><Select value={o.kategori} onChange={(e) => setGrade(o.id, { kategori: e.target.value as GradeRow["kategori"] })}><option value="Konsumsi">Konsumsi</option><option value="Brojolan">Brojolan</option></Select></Field>
                      <Field label="Kg"><Input type="number" min={0} step="any" value={o.weightKg} onChange={(e) => setGrade(o.id, { weightKg: e.target.value })} /></Field>
                      <Field label="Ekor"><Input type="number" min={0} value={o.count} onChange={(e) => setGrade(o.id, { count: e.target.value })} /></Field>
                      <Field label="Taruh di kolam"><Select value={o.targetPondId} onChange={(e) => setGrade(o.id, { targetPondId: e.target.value })}><option value="">— pilih kolam</option>{harvestTargets.map((p) => <option key={p.id} value={p.id}>{p.code}{p.kind === "tampungan" ? " (Tampungan)" : ""}</option>)}</Select></Field>
                    </div>
                  </div>
                ))}
                <Button variant="secondary" className="w-full" onClick={addGrade}><Plus className="h-4 w-4" /> Tambah bagian</Button>
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={harvest.isFinal} onChange={(e) => setHarvest((h) => ({ ...h, isFinal: e.target.checked }))} className="h-4 w-4 accent-[var(--primary)]" />
                Panen total (tutup siklus)
              </label>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted">Total panen: <span className="font-bold text-foreground">{harvestTotalKg.toFixed(1)} kg</span>{Number(harvest.pricePerKg) > 0 && <> · omzet ± {currency.format(harvestTotalKg * Number(harvest.pricePerKg))}</>}</p>
                <Button onClick={submitHarvest}><TrendingUp className="h-4 w-4" /> Simpan Panen</Button>
              </div>
              <p className="mt-1 text-[11px] text-muted">Bagian Konsumsi yang ditaruh di tampungan otomatis jadi stok siap jual kolam tujuan.</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900/60">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Tanggal</th>
                    <th className="px-3 py-2 text-right font-semibold">Ekor</th>
                    <th className="px-3 py-2 text-right font-semibold">Bobot</th>
                    <th className="px-3 py-2 text-right font-semibold">Harga/kg</th>
                    <th className="px-3 py-2 text-right font-semibold">Omzet</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {cycleHarvests.length === 0 ? (
                    <tr><td colSpan={6} className="px-3 py-6 text-center text-muted">Belum ada panen.</td></tr>
                  ) : (
                    cycleHarvests.map((h) => (
                      <tr key={h.id} className="border-t border-border">
                        <td className="px-3 py-2">{formatDate(h.date)}{h.isFinal && <Badge className="ml-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">total</Badge>}{h.buyer && <span className="block text-[11px] text-muted">{h.buyer}</span>}{h.outputs?.length ? <span className="mt-0.5 block text-[11px] text-muted">{h.outputs.map((o) => `${o.kategori} ${o.weightKg}kg${o.targetPondCode ? `→${o.targetPondCode}` : ""}`).join(" · ")}</span> : null}</td>
                        <td className="px-3 py-2 text-right">{h.count || "-"}</td>
                        <td className="px-3 py-2 text-right">{h.weightKg} kg</td>
                        <td className="px-3 py-2 text-right">{h.pricePerKg ? currency.format(h.pricePerKg) : "-"}</td>
                        <td className="px-3 py-2 text-right font-semibold">{currency.format(h.revenueRp)}</td>
                        <td className="px-3 py-2 text-right"><button onClick={() => { if (confirm("Hapus panen ini?")) removePondHarvest(h.id); }} className="text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Jurnal tab */
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-background p-3 sm:p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><NotebookPen className="h-4 w-4 text-primary" /> Tambah Jurnal Kolam {pond.code}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Field label="Tanggal"><Input type="date" value={journal.date} onChange={(e) => setJournal((j) => ({ ...j, date: e.target.value }))} /></Field>
                <Field label="Kategori"><Select value={journal.category} onChange={(e) => setJournal((j) => ({ ...j, category: e.target.value as JournalCategory }))}>{JOURNAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
                <Field label="Judul"><Input value={journal.title} onChange={(e) => setJournal((j) => ({ ...j, title: e.target.value }))} placeholder="Ganti air, sortir, dll." /></Field>
                {journal.category === "Kualitas Air" && (
                  <>
                    <Field label="Suhu (°C)"><Input type="number" step="any" value={journal.waterTemp} onChange={(e) => setJournal((j) => ({ ...j, waterTemp: e.target.value }))} placeholder="28" /></Field>
                    <Field label="pH"><Input type="number" step="any" value={journal.waterPh} onChange={(e) => setJournal((j) => ({ ...j, waterPh: e.target.value }))} placeholder="7.0" /></Field>
                  </>
                )}
                <div className="col-span-2 sm:col-span-3"><Field label="Catatan"><Textarea value={journal.note} onChange={(e) => setJournal((j) => ({ ...j, note: e.target.value }))} placeholder="Detail kejadian / tindakan" /></Field></div>
              </div>
              <div className="mt-2 flex justify-end"><Button onClick={submitJournal}><Plus className="h-4 w-4" /> Simpan Jurnal</Button></div>
            </div>

            {pondJournals.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">Belum ada jurnal untuk kolam ini.</p>
            ) : (
              <ol className="space-y-2">
                {pondJournals.map((j) => (
                  <li key={j.id} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={journalTone(j.category)}>{j.category}</Badge>
                          <span className="text-xs text-muted">{formatDate(j.date)}</span>
                        </div>
                        {j.title && <p className="mt-1 font-semibold">{j.title}</p>}
                        {j.note && <p className="text-sm text-muted">{j.note}</p>}
                        {(j.waterTemp != null || j.waterPh != null) && (
                          <p className="mt-1 text-xs text-muted">{j.waterTemp != null && `Suhu ${j.waterTemp}°C`}{j.waterTemp != null && j.waterPh != null && " · "}{j.waterPh != null && `pH ${j.waterPh}`}</p>
                        )}
                      </div>
                      <button onClick={() => { if (confirm("Hapus jurnal ini?")) removePondJournal(j.id); }} className="shrink-0 text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Ringkasan laba-rugi */}
        {cycle && metrics && (
          <>
            <div className="rounded-xl border border-border p-3 sm:p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Wallet className="h-4 w-4 text-primary" /> Ringkasan Laba-Rugi</p>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
                <div><p className="text-muted">Biaya benih</p><p className="font-semibold">{currency.format(metrics.seedCostRp)}</p></div>
                <div><p className="text-muted">Biaya lain</p><p className="font-semibold">{currency.format(metrics.otherCostRp)}</p></div>
                <div><p className="text-muted">Biaya pakan</p><p className="font-semibold">{currency.format(metrics.totalFeedCostRp)}</p></div>
                <div><p className="text-muted">Total biaya</p><p className="font-semibold">{currency.format(metrics.totalCostRp)}</p></div>
                <div><p className="text-muted">FCR</p><p className="font-semibold">{metrics.fcr != null ? metrics.fcr.toFixed(2) : "—"}</p></div>
              </div>
            </div>

            {cycle.status === "Aktif" && (
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" onClick={() => { if (confirm(`Tutup siklus kolam ${pond.code} sebagai GAGAL?`)) { closeCycle(cycle.id, "Gagal"); toast.success("Siklus ditandai gagal."); onClose(); } }}>
                  <Skull className="h-4 w-4" /> Tandai Gagal
                </Button>
                <Button variant="secondary" onClick={() => { if (confirm(`Selesaikan siklus kolam ${pond.code}?`)) { closeCycle(cycle.id, "Selesai"); toast.success("Siklus selesai."); onClose(); } }}>
                  <CalendarDays className="h-4 w-4" /> Selesaikan Siklus
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

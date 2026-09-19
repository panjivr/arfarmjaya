"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Fish,
  Plus,
  Skull,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { cycleMetrics, feedTypeByAge } from "@/lib/lele";
import { currency, formatDate, numberFmt } from "@/lib/utils";
import type { FishCycle, Pond } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

function Stat({ label, value, hint, tone = "slate" }: { label: string; value: string; hint?: string; tone?: "slate" | "primary" | "amber" | "danger" | "sky" }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-50 dark:bg-slate-800/60",
    primary: "bg-leaf/10",
    amber: "bg-amber-50 dark:bg-amber-950/30",
    danger: "bg-red-50 dark:bg-red-950/30",
    sky: "bg-sky-50 dark:bg-sky-950/30",
  };
  return (
    <div className={`rounded-lg p-3 ${tones[tone]}`}>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold leading-tight">{value}</p>
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

/**
 * Panel detail satu kolam (mis. "A12"): identitas siklus, metrik hidup, catatan
 * harian (pakan/kematian/sampling), panen, dan ringkasan laba-rugi. Semua input
 * di sini langsung memperbarui store yang tersinkron ke server.
 */
export function PondDetailModal({ pond, cycle, onClose }: { pond: Pond; cycle: FishCycle | null; onClose: () => void }) {
  const logs = useUiStore((s) => s.pondLogs);
  const harvests = useUiStore((s) => s.pondHarvests);
  const addPondLog = useUiStore((s) => s.addPondLog);
  const removePondLog = useUiStore((s) => s.removePondLog);
  const addPondHarvest = useUiStore((s) => s.addPondHarvest);
  const removePondHarvest = useUiStore((s) => s.removePondHarvest);
  const closeCycle = useUiStore((s) => s.closeCycle);

  const [tab, setTab] = useState<"harian" | "panen">("harian");
  const metrics = useMemo(() => (cycle ? cycleMetrics(cycle, logs, harvests) : null), [cycle, logs, harvests]);
  const cycleLogs = useMemo(
    () => (cycle ? logs.filter((l) => l.cycleId === cycle.id).sort((a, b) => b.date.localeCompare(a.date)) : []),
    [cycle, logs],
  );
  const cycleHarvests = useMemo(
    () => (cycle ? harvests.filter((h) => h.cycleId === cycle.id).sort((a, b) => b.date.localeCompare(a.date)) : []),
    [cycle, harvests],
  );

  const [feed, setFeed] = useState({ date: today(), feedKg: "", feedType: "", feedCostRp: "", deaths: "", avgWeightG: "", note: "" });
  const [harvest, setHarvest] = useState({ date: today(), count: "", weightKg: "", pricePerKg: "", buyer: "", isFinal: false, note: "" });

  function submitFeed() {
    if (!cycle) return;
    const feedKg = Number(feed.feedKg) || 0;
    const deaths = Number(feed.deaths) || 0;
    if (feedKg <= 0 && deaths <= 0 && !feed.avgWeightG) return toast.error("Isi minimal pakan, kematian, atau bobot sampling.");
    const res = addPondLog({
      cycleId: cycle.id,
      pondId: pond.id,
      date: feed.date,
      feedKg,
      feedType: feed.feedType.trim() || feedTypeByAge(metrics?.ageDays ?? 0),
      feedCostRp: Number(feed.feedCostRp) || 0,
      deaths,
      avgWeightG: feed.avgWeightG ? Number(feed.avgWeightG) : undefined,
      note: feed.note.trim() || undefined,
    });
    if (!res.ok) return toast.error(res.message ?? "Gagal menyimpan.");
    toast.success("Catatan harian tersimpan.");
    setFeed({ date: today(), feedKg: "", feedType: feed.feedType, feedCostRp: "", deaths: "", avgWeightG: "", note: "" });
  }

  function submitHarvest() {
    if (!cycle) return;
    const count = Number(harvest.count) || 0;
    const weightKg = Number(harvest.weightKg) || 0;
    if (weightKg <= 0) return toast.error("Isi bobot panen (kg).");
    const res = addPondHarvest({
      cycleId: cycle.id,
      pondId: pond.id,
      date: harvest.date,
      count,
      weightKg,
      pricePerKg: Number(harvest.pricePerKg) || 0,
      buyer: harvest.buyer.trim() || undefined,
      isFinal: harvest.isFinal,
      note: harvest.note.trim() || undefined,
    });
    if (!res.ok) return toast.error(res.message ?? "Gagal menyimpan.");
    toast.success(harvest.isFinal ? "Panen total tersimpan, siklus ditutup." : "Panen tersimpan.");
    setHarvest({ date: today(), count: "", weightKg: "", pricePerKg: harvest.pricePerKg, buyer: harvest.buyer, isFinal: false, note: "" });
  }

  const title = `Kolam ${pond.code}${pond.name ? ` — ${pond.name}` : ""}`;

  return (
    <Modal open onClose={onClose} title={title} description={cycle ? `${cycle.species} · ditebar ${formatDate(cycle.stockDate)}` : "Kolam kosong — belum ada siklus aktif."} size="lg">
      {!cycle || !metrics ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Fish className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-2 font-semibold">Kolam kosong</p>
          <p className="mt-1 text-sm text-muted">Mulai siklus baru dengan menebar benih dari menu Kolam &amp; Tebar.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Identitas & metrik hidup */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <Stat label="Umur" value={metrics.ageLabel} hint={`sejak ${formatDate(cycle.stockDate)}`} tone="primary" />
            <Stat label="Ikan hidup" value={`${numberFmt.format(metrics.currentCount)} ekor`} hint={`dari ${numberFmt.format(cycle.initialCount)} tebar`} tone="sky" />
            <Stat label="Sintasan (SR)" value={`${Math.round(metrics.survivalRate * 100)}%`} hint={`mati ${numberFmt.format(metrics.deaths)} ekor`} tone={metrics.survivalRate >= 0.8 ? "primary" : "amber"} />
            <Stat label="Asal benih" value={cycle.source || "-"} hint={cycle.sizeAtStock} />
            <Stat label="Bobot rata-rata" value={metrics.latestAvgWeightG ? `${metrics.latestAvgWeightG} g` : "belum ada"} hint={metrics.biomassKg ? `biomassa ± ${metrics.biomassKg.toFixed(1)} kg` : "isi sampling"} />
            <Stat label="Total pakan" value={`${numberFmt.format(metrics.totalFeedKg)} kg`} hint={currency.format(metrics.totalFeedCostRp)} tone="amber" />
            <Stat label="Saran pakan/hari" value={metrics.recommendedFeedKg != null ? `${metrics.recommendedFeedKg} kg` : "-"} hint={`${Math.round(metrics.feedRatePct * 100)}% biomassa`} />
            <Stat label="Laba berjalan" value={currency.format(metrics.profitRp)} hint={`omzet ${currency.format(metrics.revenueRp)}`} tone={metrics.profitRp >= 0 ? "primary" : "danger"} />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            <button onClick={() => setTab("harian")} className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${tab === "harian" ? "border-primary text-primary" : "border-transparent text-muted"}`}>
              Catatan Harian ({cycleLogs.length})
            </button>
            <button onClick={() => setTab("panen")} className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${tab === "panen" ? "border-primary text-primary" : "border-transparent text-muted"}`}>
              Panen ({cycleHarvests.length})
            </button>
          </div>

          {tab === "harian" ? (
            <div className="space-y-4">
              {/* Input harian */}
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Plus className="h-4 w-4 text-primary" /> Input Harian</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Field label="Tanggal"><Input type="date" value={feed.date} onChange={(e) => setFeed((f) => ({ ...f, date: e.target.value }))} /></Field>
                  <Field label="Pakan (kg)"><Input type="number" min={0} step="any" value={feed.feedKg} onChange={(e) => setFeed((f) => ({ ...f, feedKg: e.target.value }))} placeholder={metrics.recommendedFeedKg?.toString()} /></Field>
                  <Field label="Biaya pakan (Rp)"><Input type="number" min={0} value={feed.feedCostRp} onChange={(e) => setFeed((f) => ({ ...f, feedCostRp: e.target.value }))} /></Field>
                  <Field label="Jenis pakan"><Input value={feed.feedType} onChange={(e) => setFeed((f) => ({ ...f, feedType: e.target.value }))} placeholder={feedTypeByAge(metrics.ageDays)} /></Field>
                  <Field label="Mati (ekor)"><Input type="number" min={0} value={feed.deaths} onChange={(e) => setFeed((f) => ({ ...f, deaths: e.target.value }))} /></Field>
                  <Field label="Sampling bobot (g)"><Input type="number" min={0} step="any" value={feed.avgWeightG} onChange={(e) => setFeed((f) => ({ ...f, avgWeightG: e.target.value }))} placeholder="opsional" /></Field>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button onClick={submitFeed}><Plus className="h-4 w-4" /> Simpan Catatan</Button>
                </div>
              </div>

              {/* Riwayat harian */}
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Tanggal</th>
                      <th className="px-3 py-2 text-right font-semibold">Pakan</th>
                      <th className="px-3 py-2 text-right font-semibold">Biaya</th>
                      <th className="px-3 py-2 text-right font-semibold">Mati</th>
                      <th className="px-3 py-2 text-right font-semibold">Bobot</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycleLogs.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-6 text-center text-muted">Belum ada catatan harian.</td></tr>
                    ) : (
                      cycleLogs.map((l) => (
                        <tr key={l.id} className="border-t border-border">
                          <td className="px-3 py-2">{formatDate(l.date)}<div className="text-[11px] text-muted">{l.feedType}</div></td>
                          <td className="px-3 py-2 text-right">{l.feedKg} kg</td>
                          <td className="px-3 py-2 text-right">{l.feedCostRp ? currency.format(l.feedCostRp) : "-"}</td>
                          <td className="px-3 py-2 text-right">{l.deaths || "-"}</td>
                          <td className="px-3 py-2 text-right">{l.avgWeightG ? `${l.avgWeightG} g` : "-"}</td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => { if (confirm("Hapus catatan ini?")) removePondLog(l.id); }} className="text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Input panen */}
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> Catat Panen</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Field label="Tanggal"><Input type="date" value={harvest.date} onChange={(e) => setHarvest((h) => ({ ...h, date: e.target.value }))} /></Field>
                  <Field label="Jumlah (ekor)"><Input type="number" min={0} value={harvest.count} onChange={(e) => setHarvest((h) => ({ ...h, count: e.target.value }))} /></Field>
                  <Field label="Bobot (kg)"><Input type="number" min={0} step="any" value={harvest.weightKg} onChange={(e) => setHarvest((h) => ({ ...h, weightKg: e.target.value }))} /></Field>
                  <Field label="Harga/kg (Rp)"><Input type="number" min={0} value={harvest.pricePerKg} onChange={(e) => setHarvest((h) => ({ ...h, pricePerKg: e.target.value }))} placeholder="20000" /></Field>
                  <Field label="Pembeli"><Input value={harvest.buyer} onChange={(e) => setHarvest((h) => ({ ...h, buyer: e.target.value }))} placeholder="Pengepul" /></Field>
                  <label className="flex items-end gap-2 pb-2 text-sm">
                    <input type="checkbox" checked={harvest.isFinal} onChange={(e) => setHarvest((h) => ({ ...h, isFinal: e.target.checked }))} className="h-4 w-4 accent-[var(--primary)]" />
                    Panen total (tutup siklus)
                  </label>
                </div>
                {Number(harvest.weightKg) > 0 && Number(harvest.pricePerKg) > 0 && (
                  <p className="mt-2 text-sm text-muted">Perkiraan omzet: <span className="font-bold text-foreground">{currency.format(Number(harvest.weightKg) * Number(harvest.pricePerKg))}</span></p>
                )}
                <div className="mt-2 flex justify-end">
                  <Button onClick={submitHarvest}><TrendingUp className="h-4 w-4" /> Simpan Panen</Button>
                </div>
              </div>

              {/* Riwayat panen */}
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
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
                          <td className="px-3 py-2">{formatDate(h.date)}{h.isFinal && <Badge className="ml-1 bg-leaf/10 text-primary">total</Badge>}<div className="text-[11px] text-muted">{h.buyer}</div></td>
                          <td className="px-3 py-2 text-right">{h.count || "-"}</td>
                          <td className="px-3 py-2 text-right">{h.weightKg} kg</td>
                          <td className="px-3 py-2 text-right">{h.pricePerKg ? currency.format(h.pricePerKg) : "-"}</td>
                          <td className="px-3 py-2 text-right font-semibold">{currency.format(h.revenueRp)}</td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => { if (confirm("Hapus panen ini?")) removePondHarvest(h.id); }} className="text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ringkasan laba-rugi */}
          <div className="rounded-lg border border-border p-3">
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
        </div>
      )}
    </Modal>
  );
}

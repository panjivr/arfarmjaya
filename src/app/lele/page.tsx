"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Fish, Waves, TrendingUp, AlertTriangle, Plus, Utensils, NotebookPen, ArrowLeftRight, Wallet } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PondDetailModal } from "@/components/lele/pond-detail";
import { TampunganDetailModal } from "@/components/lele/tampungan-detail";
import { useUiStore } from "@/lib/store";
import { pondViews, leleSummary, stockByPond } from "@/lib/lele";
import { suggestFeed } from "@/lib/feed";
import { cn, currency, numberFmt } from "@/lib/utils";
import type { FishCycle, Pond } from "@/lib/types";

const statusStyle: Record<string, string> = {
  Kosong: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Aktif: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  "Perlu Panen": "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  Nonaktif: "bg-slate-100 text-slate-500",
};

const TARGET_DAYS = 80;

export default function LeleMonitoringPage() {
  const ponds = useUiStore((s) => s.ponds);
  const cycles = useUiStore((s) => s.fishCycles);
  const logs = useUiStore((s) => s.pondLogs);
  const harvests = useUiStore((s) => s.pondHarvests);
  const movements = useUiStore((s) => s.leleMovements);
  const sales = useUiStore((s) => s.leleSales);

  const views = useMemo(() => pondViews(ponds, cycles, logs, harvests), [ponds, cycles, logs, harvests]);
  const summary = useMemo(() => leleSummary(views, logs), [views, logs]);
  const stock = useMemo(() => stockByPond(movements, sales), [movements, sales]);

  const [detail, setDetail] = useState<{ pond: Pond; cycle: FishCycle | null } | null>(null);
  const [tampungan, setTampungan] = useState<Pond | null>(null);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Budidaya Lele"
        title="Monitoring Kolam"
        description="Pantau semua kolam secara langsung: umur lele, jumlah ikan hidup, pakan harian, kematian, dan hasil panen. Data tersinkron ke server sehingga bisa dibuka dari perangkat mana pun."
        action={
          <>
            <Link href="/lele/mutasi"><Button variant="secondary"><ArrowLeftRight className="h-4 w-4" /> Mutasi</Button></Link>
            <Link href="/lele/keuangan"><Button variant="secondary"><Wallet className="h-4 w-4" /> Keuangan</Button></Link>
            <Link href="/lele/jurnal"><Button variant="secondary"><NotebookPen className="h-4 w-4" /> Jurnal</Button></Link>
            <Link href="/lele/kolam"><Button><Plus className="h-4 w-4" /> Kolam &amp; Tebar</Button></Link>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Kolam" value={summary.totalPonds} hint={`${summary.activePonds} aktif · ${summary.emptyPonds} kosong`} icon={Waves} />
        <StatCard label="Ikan Hidup" value={`${numberFmt.format(summary.liveFish)} ekor`} icon={Fish} tone="primary" />
        <StatCard label="Pakan Hari Ini" value={`${numberFmt.format(summary.feedTodayKg)} kg`} hint={currency.format(summary.feedTodayCostRp)} icon={Utensils} tone="amber" />
        <StatCard label="Perlu Panen" value={summary.needHarvest} hint={`biomassa ± ${summary.biomassKg.toFixed(0)} kg`} icon={AlertTriangle} tone={summary.needHarvest > 0 ? "danger" : "slate"} />
      </section>

      {views.length === 0 ? (
        <EmptyState
          icon={Fish}
          title="Belum ada kolam"
          description="Tambahkan kolam dengan kode khusus (mis. A12), lalu tebar benih untuk mulai memantau."
          action={<Link href="/lele/kolam"><Button><Plus className="h-4 w-4" /> Tambah Kolam</Button></Link>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {views.map(({ pond, activeCycle, metrics, status }) => {
            const progress = metrics ? Math.min(100, Math.round((metrics.ageDays / TARGET_DAYS) * 100)) : 0;
            const feed = suggestFeed(metrics?.ageDays ?? 0);
            const st = stock.get(pond.code);
            return (
              <button
                key={pond.id}
                onClick={() => (pond.kind === "tampungan" ? setTampungan(pond) : setDetail({ pond, cycle: activeCycle }))}
                className={cn(
                  "group hover-lift flex min-w-0 flex-col rounded-2xl p-4 text-left",
                  activeCycle
                    ? "border border-border bg-card shadow-soft"
                    : "border border-dashed border-border-strong bg-card-muted",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                        activeCycle ? "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300" : "bg-slate-100 text-muted dark:bg-slate-800",
                      )}
                    >
                      <Fish className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold leading-tight">{pond.code}</p>
                      <p className="truncate text-xs text-muted">{pond.name || pond.type}</p>
                    </div>
                  </div>
                  <Badge className={pond.kind === "tampungan" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" : statusStyle[status]}>{pond.kind === "tampungan" ? "Tampungan" : status}</Badge>
                </div>

                {activeCycle && metrics ? (
                  <>
                    <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
                      {[
                        { k: "Umur", v: `${metrics.ageDays} hr` },
                        { k: "Hidup", v: numberFmt.format(metrics.currentCount) },
                        { k: "SR", v: `${Math.round(metrics.survivalRate * 100)}%` },
                      ].map((s) => (
                        <div key={s.k} className="rounded-xl bg-card-muted py-2">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{s.k}</p>
                          <p className="mt-0.5 text-[15px] font-bold">{s.v}</p>
                        </div>
                      ))}
                    </div>

                    {/* Progres umur menuju panen */}
                    <div className="mt-3.5">
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted">
                        <span>Progres panen</span>
                        <span className="tabular-nums">{progress}%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-card-muted">
                        <div
                          className={cn("h-full rounded-full transition-all", status === "Perlu Panen" ? "bg-amber-500" : "bg-primary")}
                          style={{ width: `${Math.max(4, progress)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-1.5"><Utensils className="h-3.5 w-3.5 text-primary/70" /> {feed.brand} {feed.code}</span>
                      {metrics.recommendedFeedKg != null && <span className="tabular-nums">saran {metrics.recommendedFeedKg} kg/hr</span>}
                      {metrics.revenueRp > 0 && <span className="inline-flex items-center gap-1.5 font-medium text-primary"><TrendingUp className="h-3.5 w-3.5" /> {currency.format(metrics.revenueRp)}</span>}
                    </div>
                  </>
                ) : pond.kind === "tampungan" ? (
                  <div className="mt-4 flex flex-1 flex-col justify-center rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Kolam Tampungan · siap jual</span>
                    {st ? (
                      <>
                        <span className="mt-1 text-xl font-bold text-primary">{numberFmt.format(st.totalKg)} kg</span>
                        <span className="text-xs text-muted">
                          {st.konsumsiKg > 0 && `Konsumsi ${numberFmt.format(st.konsumsiKg)} kg`}
                          {st.konsumsiKg > 0 && st.brojolanKg > 0 && " · "}
                          {st.brojolanKg > 0 && `Brojolan ${numberFmt.format(st.brojolanKg)} kg`}
                        </span>
                      </>
                    ) : (
                      <span className="mt-1 text-xs text-muted">Belum ada isi. Pindahkan hasil panen ke sini.</span>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong py-6 text-center">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                      <Plus className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-primary">Tebar benih</span>
                    <span className="text-xs text-muted">Kolam siap dipakai</span>
                    {st && st.totalKg > 0 && <span className="text-[11px] text-muted">berisi {numberFmt.format(st.totalKg)} kg</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {detail && <PondDetailModal pond={detail.pond} cycle={detail.cycle} onClose={() => setDetail(null)} />}
      {tampungan && <TampunganDetailModal pond={tampungan} onClose={() => setTampungan(null)} />}
    </AppShell>
  );
}

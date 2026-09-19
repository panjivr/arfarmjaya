"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Fish, Waves, Droplets, TrendingUp, AlertTriangle, Plus, Utensils } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PondDetailModal } from "@/components/lele/pond-detail";
import { useUiStore } from "@/lib/store";
import { pondViews, leleSummary } from "@/lib/lele";
import { currency, numberFmt } from "@/lib/utils";
import type { FishCycle, Pond } from "@/lib/types";

const statusStyle: Record<string, string> = {
  Kosong: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Aktif: "bg-sky-50 text-sky-700 dark:bg-sky-950/40",
  "Perlu Panen": "bg-amber-50 text-amber-700 dark:bg-amber-950/40",
  Nonaktif: "bg-slate-100 text-slate-500",
};

export default function LeleMonitoringPage() {
  const ponds = useUiStore((s) => s.ponds);
  const cycles = useUiStore((s) => s.fishCycles);
  const logs = useUiStore((s) => s.pondLogs);
  const harvests = useUiStore((s) => s.pondHarvests);

  const views = useMemo(() => pondViews(ponds, cycles, logs, harvests), [ponds, cycles, logs, harvests]);
  const summary = useMemo(() => leleSummary(views, logs), [views, logs]);

  const [detail, setDetail] = useState<{ pond: Pond; cycle: FishCycle | null } | null>(null);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Budidaya Lele"
        title="Monitoring Kolam"
        description="Pantau semua kolam secara langsung: umur lele, jumlah ikan hidup, pakan harian, kematian, dan hasil panen. Data tersinkron ke server sehingga bisa dibuka dari perangkat mana pun."
        action={
          <Link href="/lele/kolam">
            <Button><Plus className="h-4 w-4" /> Kolam &amp; Tebar</Button>
          </Link>
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
          {views.map(({ pond, activeCycle, metrics, status }) => (
            <button
              key={pond.id}
              onClick={() => setDetail({ pond, cycle: activeCycle })}
              className="min-w-0 rounded-lg border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/50">
                    <Fish className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold leading-tight">{pond.code}</p>
                    <p className="truncate text-xs text-muted">{pond.name || pond.type}</p>
                  </div>
                </div>
                <Badge className={statusStyle[status]}>{status}</Badge>
              </div>

              {activeCycle && metrics ? (
                <>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-background py-1.5">
                      <p className="text-[10px] uppercase text-muted">Umur</p>
                      <p className="text-sm font-bold">{metrics.ageDays} hr</p>
                    </div>
                    <div className="rounded-md bg-background py-1.5">
                      <p className="text-[10px] uppercase text-muted">Hidup</p>
                      <p className="text-sm font-bold">{numberFmt.format(metrics.currentCount)}</p>
                    </div>
                    <div className="rounded-md bg-background py-1.5">
                      <p className="text-[10px] uppercase text-muted">SR</p>
                      <p className="text-sm font-bold">{Math.round(metrics.survivalRate * 100)}%</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1"><Utensils className="h-3 w-3" /> {numberFmt.format(metrics.totalFeedKg)} kg</span>
                    {metrics.recommendedFeedKg != null && <span className="inline-flex items-center gap-1"><Droplets className="h-3 w-3" /> saran {metrics.recommendedFeedKg} kg/hr</span>}
                    {metrics.revenueRp > 0 && <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {currency.format(metrics.revenueRp)}</span>}
                  </div>
                  <p className="mt-2 text-[11px] text-muted">Ketuk untuk input harian &amp; panen →</p>
                </>
              ) : (
                <div className="mt-3 flex items-center justify-between rounded-md bg-background px-3 py-3 text-sm">
                  <span className="text-muted">Kolam kosong</span>
                  <span className="inline-flex items-center gap-1 font-medium text-primary"><Plus className="h-4 w-4" /> Tebar benih</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {detail && <PondDetailModal pond={detail.pond} cycle={detail.cycle} onClose={() => setDetail(null)} />}
    </AppShell>
  );
}

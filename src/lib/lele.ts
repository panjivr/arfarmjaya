import type { FishCycle, Pond, PondDailyLog, PondHarvest, PondStatus } from "@/lib/types";

const DAY = 1000 * 60 * 60 * 24;

export function daysBetween(from: string, to: Date = new Date()) {
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) return 0;
  return Math.max(0, Math.floor((to.getTime() - start.getTime()) / DAY));
}

export type CycleMetrics = {
  ageDays: number;
  ageLabel: string; // "6 minggu (42 hari)"
  deaths: number;
  harvestedCount: number;
  currentCount: number; // ikan hidup tersisa
  survivalRate: number; // 0..1
  totalFeedKg: number;
  totalFeedCostRp: number;
  latestAvgWeightG: number | null;
  biomassKg: number | null; // estimasi bobot ikan hidup
  seedCostRp: number;
  otherCostRp: number;
  totalCostRp: number; // benih + lain + pakan
  harvestWeightKg: number;
  revenueRp: number;
  profitRp: number; // revenue - totalCost (running)
  fcr: number | null; // pakan / bobot panen
  recommendedFeedKg: number | null; // saran pakan harian
  feedRatePct: number; // % biomassa/hari sesuai umur
};

/** Persentase pakan harian terhadap biomassa berdasarkan umur (menurun). */
export function feedRateByAge(ageDays: number): number {
  if (ageDays <= 14) return 0.05;
  if (ageDays <= 30) return 0.04;
  if (ageDays <= 50) return 0.035;
  if (ageDays <= 70) return 0.03;
  return 0.025;
}

/** Perkiraan jenis pakan berdasarkan umur/ukuran. */
export function feedTypeByAge(ageDays: number): string {
  if (ageDays <= 10) return "PF-800 (benih)";
  if (ageDays <= 21) return "PF-1000";
  if (ageDays <= 40) return "781-1";
  if (ageDays <= 60) return "781-2";
  return "781 (pembesaran)";
}

export function cycleMetrics(
  cycle: FishCycle,
  logs: PondDailyLog[],
  harvests: PondHarvest[],
): CycleMetrics {
  const cLogs = logs.filter((l) => l.cycleId === cycle.id);
  const cHarvests = harvests.filter((h) => h.cycleId === cycle.id);

  const deaths = cLogs.reduce((t, l) => t + (Number(l.deaths) || 0), 0);
  const harvestedCount = cHarvests.reduce((t, h) => t + (Number(h.count) || 0), 0);
  const currentCount = Math.max(0, cycle.initialCount - deaths - harvestedCount);
  const survivalRate = cycle.initialCount > 0 ? (cycle.initialCount - deaths) / cycle.initialCount : 0;

  const totalFeedKg = cLogs.reduce((t, l) => t + (Number(l.feedKg) || 0), 0);
  const totalFeedCostRp = cLogs.reduce((t, l) => t + (Number(l.feedCostRp) || 0), 0);

  const weighed = cLogs.filter((l) => l.avgWeightG && l.avgWeightG > 0).sort((a, b) => a.date.localeCompare(b.date));
  const latestAvgWeightG = weighed.length ? weighed[weighed.length - 1].avgWeightG! : null;

  const ageDays = daysBetween(cycle.stockDate);
  const weeks = Math.floor(ageDays / 7);
  const ageLabel = weeks > 0 ? `${weeks} mgg (${ageDays} hr)` : `${ageDays} hari`;

  const biomassKg = latestAvgWeightG != null ? (currentCount * latestAvgWeightG) / 1000 : null;

  const seedCostRp = Number(cycle.seedCostRp) || 0;
  const otherCostRp = Number(cycle.otherCostRp) || 0;
  const totalCostRp = seedCostRp + otherCostRp + totalFeedCostRp;

  const harvestWeightKg = cHarvests.reduce((t, h) => t + (Number(h.weightKg) || 0), 0);
  const revenueRp = cHarvests.reduce((t, h) => t + (Number(h.revenueRp) || 0), 0);
  const profitRp = revenueRp - totalCostRp;
  const fcr = harvestWeightKg > 0 ? totalFeedKg / harvestWeightKg : null;

  const feedRatePct = feedRateByAge(ageDays);
  const recommendedFeedKg = biomassKg != null ? Math.round(biomassKg * feedRatePct * 100) / 100 : null;

  return {
    ageDays,
    ageLabel,
    deaths,
    harvestedCount,
    currentCount,
    survivalRate,
    totalFeedKg,
    totalFeedCostRp,
    latestAvgWeightG,
    biomassKg,
    seedCostRp,
    otherCostRp,
    totalCostRp,
    harvestWeightKg,
    revenueRp,
    profitRp,
    fcr,
    recommendedFeedKg,
    feedRatePct,
  };
}

export type PondView = {
  pond: Pond;
  activeCycle: FishCycle | null;
  metrics: CycleMetrics | null;
  status: PondStatus;
};

/** Gabungkan kolam dengan siklus aktifnya + metrik untuk monitoring. */
export function pondViews(
  ponds: Pond[],
  cycles: FishCycle[],
  logs: PondDailyLog[],
  harvests: PondHarvest[],
): PondView[] {
  return ponds
    .filter((p) => p.active !== false)
    .map((pond) => {
      const activeCycle = cycles.find((c) => c.pondId === pond.id && c.status === "Aktif") ?? null;
      const metrics = activeCycle ? cycleMetrics(activeCycle, logs, harvests) : null;
      let status: PondStatus = "Kosong";
      if (activeCycle && metrics) {
        status = metrics.ageDays >= 75 || (activeCycle.targetDate && activeCycle.targetDate <= new Date().toISOString().slice(0, 10)) ? "Perlu Panen" : "Aktif";
      }
      return { pond, activeCycle, metrics, status };
    })
    .sort((a, b) => a.pond.code.localeCompare(b.pond.code, "id", { numeric: true }));
}

export type LeleSummary = {
  totalPonds: number;
  activePonds: number;
  emptyPonds: number;
  needHarvest: number;
  liveFish: number;
  feedTodayKg: number;
  feedTodayCostRp: number;
  biomassKg: number;
  recommendedFeedKg: number;
};

export function leleSummary(views: PondView[], logs: PondDailyLog[]): LeleSummary {
  const today = new Date().toISOString().slice(0, 10);
  const todays = logs.filter((l) => l.date === today);
  return {
    totalPonds: views.length,
    activePonds: views.filter((v) => v.activeCycle).length,
    emptyPonds: views.filter((v) => !v.activeCycle).length,
    needHarvest: views.filter((v) => v.status === "Perlu Panen").length,
    liveFish: views.reduce((t, v) => t + (v.metrics?.currentCount ?? 0), 0),
    feedTodayKg: todays.reduce((t, l) => t + (Number(l.feedKg) || 0), 0),
    feedTodayCostRp: todays.reduce((t, l) => t + (Number(l.feedCostRp) || 0), 0),
    biomassKg: views.reduce((t, v) => t + (v.metrics?.biomassKg ?? 0), 0),
    recommendedFeedKg: views.reduce((t, v) => t + (v.metrics?.recommendedFeedKg ?? 0), 0),
  };
}

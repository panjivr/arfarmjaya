"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Fish, Utensils, Wallet, Percent } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { useUiStore } from "@/lib/store";
import { feedTypeByAge } from "@/lib/lele";
import { currency, numberFmt } from "@/lib/utils";

const defaults = {
  count: "2000",
  seedPrice: "200", // Rp/ekor
  survival: "85", // %
  targetWeightG: "110", // gram/ekor
  cycleDays: "75",
  fcr: "1.0",
  feedPrice: "13500", // Rp/kg
  otherCost: "150000",
  sellPrice: "20000", // Rp/kg
};

function num(v: string) {
  return Number(v) || 0;
}

function Tile({ label, value, hint, icon: Icon, tone = "slate" }: { label: string; value: string; hint?: string; icon: React.ComponentType<{ className?: string }>; tone?: "slate" | "primary" | "amber" | "danger" }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    primary: "bg-leaf/10 text-primary",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40",
    danger: "bg-red-50 text-danger dark:bg-red-950/40",
  };
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted sm:text-sm">{label}</p>
        <span className={`rounded-lg p-1.5 ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-1.5 text-lg font-bold leading-tight break-words">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted break-words">{hint}</p>}
    </div>
  );
}

export default function SimulatorPage() {
  const ponds = useUiStore((s) => s.ponds);
  const [f, setF] = useState(defaults);
  const set = (k: keyof typeof defaults) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const r = useMemo(() => {
    const count = num(f.count);
    const survival = num(f.survival) / 100;
    const targetWeightG = num(f.targetWeightG);
    const fcr = num(f.fcr);
    const feedPrice = num(f.feedPrice);
    const sellPrice = num(f.sellPrice);

    const harvestCount = Math.round(count * survival);
    const harvestKg = (harvestCount * targetWeightG) / 1000;
    const feedKg = harvestKg * fcr; // pendekatan umum: pakan ≈ FCR × bobot panen
    const feedCost = feedKg * feedPrice;
    const seedCost = count * num(f.seedPrice);
    const otherCost = num(f.otherCost);
    const totalCost = seedCost + feedCost + otherCost;
    const revenue = harvestKg * sellPrice;
    const profit = revenue - totalCost;
    const fishPerKg = targetWeightG > 0 ? 1000 / targetWeightG : 0;
    const hppPerKg = harvestKg > 0 ? totalCost / harvestKg : 0;
    const bepPricePerKg = hppPerKg;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    return { count, harvestCount, harvestKg, feedKg, feedCost, seedCost, otherCost, totalCost, revenue, profit, fishPerKg, hppPerKg, bepPricePerKg, roi };
  }, [f]);

  // Jadwal pakan ringkas per fase umur
  const schedule = [7, 21, 40, 60, 75].map((d) => ({ day: d, feed: feedTypeByAge(d) }));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Budidaya Lele"
        title="Simulator Bisnis Lele"
        description="Hitung proyeksi satu siklus budidaya: perkiraan hasil panen, kebutuhan pakan, biaya, pendapatan, laba, HPP, titik impas (BEP), dan ROI. Ubah angka untuk melihat skenario berbeda."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        {/* Input */}
        <Card>
          <CardHeader><h2 className="font-semibold">Parameter</h2></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label="Jumlah Benih (ekor)"><Input type="number" min={0} value={f.count} onChange={set("count")} /></Field>
            <Field label="Harga Benih (Rp/ekor)"><Input type="number" min={0} value={f.seedPrice} onChange={set("seedPrice")} /></Field>
            <Field label="Sintasan / SR (%)"><Input type="number" min={0} max={100} value={f.survival} onChange={set("survival")} /></Field>
            <Field label="Target Bobot (g/ekor)"><Input type="number" min={0} value={f.targetWeightG} onChange={set("targetWeightG")} /></Field>
            <Field label="Lama Pelihara (hari)"><Input type="number" min={0} value={f.cycleDays} onChange={set("cycleDays")} /></Field>
            <Field label="FCR"><Input type="number" min={0} step="any" value={f.fcr} onChange={set("fcr")} /></Field>
            <Field label="Harga Pakan (Rp/kg)"><Input type="number" min={0} value={f.feedPrice} onChange={set("feedPrice")} /></Field>
            <Field label="Biaya Lain (Rp)"><Input type="number" min={0} value={f.otherCost} onChange={set("otherCost")} /></Field>
            <div className="col-span-2"><Field label="Harga Jual (Rp/kg)"><Input type="number" min={0} value={f.sellPrice} onChange={set("sellPrice")} /></Field></div>
          </CardContent>
        </Card>

        {/* Hasil */}
        <div className="space-y-4">
          <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Tile label="Panen" value={`${r.harvestKg.toFixed(0)} kg`} hint={`${numberFmt.format(r.harvestCount)} ekor · ${r.fishPerKg.toFixed(1)}/kg`} icon={Fish} tone="primary" />
            <Tile label="Kebutuhan Pakan" value={`${r.feedKg.toFixed(0)} kg`} hint={currency.format(r.feedCost)} icon={Utensils} tone="amber" />
            <Tile label="Pendapatan" value={currency.format(r.revenue)} icon={TrendingUp} tone="slate" />
            <Tile label={r.profit >= 0 ? "Laba" : "Rugi"} value={currency.format(r.profit)} hint={`ROI ${r.roi.toFixed(0)}%`} icon={Wallet} tone={r.profit >= 0 ? "primary" : "danger"} />
          </section>

          <Card>
            <CardHeader><h2 className="font-semibold">Rincian Biaya &amp; Titik Impas</h2></CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <div><p className="text-muted">Biaya benih</p><p className="font-semibold">{currency.format(r.seedCost)}</p></div>
              <div><p className="text-muted">Biaya pakan</p><p className="font-semibold">{currency.format(r.feedCost)}</p></div>
              <div><p className="text-muted">Biaya lain</p><p className="font-semibold">{currency.format(r.otherCost)}</p></div>
              <div><p className="text-muted">Total biaya</p><p className="font-semibold">{currency.format(r.totalCost)}</p></div>
              <div><p className="text-muted">HPP per kg</p><p className="font-semibold">{currency.format(r.hppPerKg)}</p></div>
              <div><p className="text-muted">BEP harga jual/kg</p><p className="font-semibold">{currency.format(r.bepPricePerKg)}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Panduan Pakan per Fase</h2></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
              {schedule.map((s) => (
                <div key={s.day} className="rounded-lg bg-background p-3">
                  <p className="text-xs uppercase text-muted">± {s.day} hari</p>
                  <p className="font-semibold">{s.feed}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <p className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted">
            <Percent className="h-4 w-4 shrink-0 text-primary" />
            Angka bersifat perkiraan (asumsi FCR, SR, dan harga di lapangan bisa berbeda). {ponds.length > 0 ? `Terapkan hasil ini saat menebar benih di ${ponds.length} kolam Anda.` : "Tambahkan kolam untuk mulai mencatat data nyata."}
          </p>
        </div>
      </div>
    </AppShell>
  );
}

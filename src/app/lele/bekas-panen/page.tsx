"use client";

import { useMemo, useState } from "react";
import { History, Fish, ShoppingBag, Scale, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Select } from "@/components/ui/field";
import { useUiStore } from "@/lib/store";
import { readyToSellByPond } from "@/lib/lele";
import { formatDate, numberFmt, currency } from "@/lib/utils";
import type { Pond, PondHarvest } from "@/lib/types";

export default function BekasPanenPage() {
  const ponds = useUiStore((s) => s.ponds);
  const harvests = useUiStore((s) => s.pondHarvests);
  const movements = useUiStore((s) => s.leleMovements);
  const sales = useUiStore((s) => s.leleSales);
  const removePondHarvest = useUiStore((s) => s.removePondHarvest);

  const [pondFilter, setPondFilter] = useState("");

  const ready = useMemo(() => readyToSellByPond(movements, sales), [movements, sales]);
  const readyList = useMemo(
    () => ponds
      .map((p) => ({ pond: p, kg: ready.get(p.code) ?? 0 }))
      .filter((x) => x.kg > 0.05)
      .sort((a, b) => b.kg - a.kg),
    [ponds, ready],
  );

  // Kelompokkan panen per kolam sumber (tidak tercampur antar-kolam).
  const byPond = useMemo(() => {
    const map = new Map<string, { pond: Pond | undefined; code: string; items: PondHarvest[] }>();
    for (const h of harvests) {
      const pond = ponds.find((p) => p.id === h.pondId);
      const code = pond?.code ?? "(kolam terhapus)";
      const key = h.pondId;
      if (!map.has(key)) map.set(key, { pond, code, items: [] });
      map.get(key)!.items.push(h);
    }
    for (const g of map.values()) g.items.sort((a, b) => b.date.localeCompare(a.date));
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code, "id", { numeric: true }));
  }, [harvests, ponds]);

  const shown = pondFilter ? byPond.filter((g) => g.pond?.id === pondFilter) : byPond;
  const totalKg = harvests.reduce((t, h) => t + h.weightKg, 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Budidaya Lele"
        title="Bekas Panen"
        description="Riwayat panen per kolam — tidak tercampur. Lihat kapan saja & berapa saja tiap kolam pernah dipanen, plus stok siap jual (Konsumsi) di tampungan."
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Total Panen" value={`${numberFmt.format(Math.round(totalKg))} kg`} icon={Scale} tone="primary" />
        <StatCard label="Jumlah Panen" value={harvests.length} icon={History} />
        <StatCard label="Kolam Siap Jual" value={readyList.length} icon={ShoppingBag} tone={readyList.length > 0 ? "amber" : "slate"} />
      </section>

      {/* Stok siap jual per kolam */}
      <Card className="mb-5">
        <CardContent>
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><ShoppingBag className="h-4 w-4 text-primary" /> Stok Siap Jual (Konsumsi)</p>
          {readyList.length === 0 ? (
            <p className="text-sm text-muted">Belum ada stok Konsumsi siap jual. Saat panen, taruh bagian Konsumsi ke kolam tampungan agar muncul di sini.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {readyList.map(({ pond, kg }) => (
                <div key={pond.id} className="rounded-xl border border-border bg-card-muted p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{pond.code}</span>
                    {pond.kind === "tampungan" && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">Tampungan</Badge>}
                  </div>
                  <p className="mt-1 text-lg font-bold text-primary">{numberFmt.format(kg)} kg</p>
                  <p className="text-[11px] text-muted">siap jual</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter kolam */}
      <div className="mb-3 max-w-xs">
        <Field label="Lihat kolam">
          <Select value={pondFilter} onChange={(e) => setPondFilter(e.target.value)}>
            <option value="">Semua kolam</option>
            {byPond.map((g) => g.pond && <option key={g.pond.id} value={g.pond.id}>{g.code} ({g.items.length} panen)</option>)}
          </Select>
        </Field>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={Fish} title="Belum ada panen" description="Riwayat panen akan muncul di sini per kolam setelah Anda mencatat panen dari Detail Kolam." />
      ) : (
        <div className="space-y-4">
          {shown.map((g) => {
            const kolamKg = g.items.reduce((t, h) => t + h.weightKg, 0);
            const kolamRp = g.items.reduce((t, h) => t + h.revenueRp, 0);
            return (
              <Card key={g.pond?.id ?? g.code}>
                <CardContent>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Fish className="h-5 w-5" /></span>
                      <div>
                        <p className="font-bold leading-tight">{g.code}{g.pond?.kind === "tampungan" && <Badge className="ml-2 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">Tampungan</Badge>}</p>
                        <p className="text-xs text-muted">{g.items.length} kali panen · {numberFmt.format(Math.round(kolamKg))} kg total{kolamRp > 0 ? ` · ${currency.format(kolamRp)}` : ""}</p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900/60">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Tanggal</th>
                          <th className="px-3 py-2 text-right font-semibold">Ekor</th>
                          <th className="px-3 py-2 text-right font-semibold">Bobot</th>
                          <th className="px-3 py-2 font-semibold">Grading → kolam</th>
                          <th className="px-3 py-2 text-right font-semibold">Omzet</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.items.map((h) => (
                          <tr key={h.id} className="border-t border-border">
                            <td className="whitespace-nowrap px-3 py-2">{formatDate(h.date)}{h.isFinal && <Badge className="ml-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">total</Badge>}</td>
                            <td className="px-3 py-2 text-right">{h.count || "-"}</td>
                            <td className="px-3 py-2 text-right font-medium">{h.weightKg} kg</td>
                            <td className="px-3 py-2 text-muted">
                              {h.outputs?.length ? h.outputs.map((o) => (
                                <span key={o.id} className="mr-1 inline-block">{o.kategori} {o.weightKg}kg{o.targetPondCode ? ` → ${o.targetPondCode}` : ""}{"; "}</span>
                              )) : "-"}
                              {h.buyer && <span className="block text-[11px]">Pembeli: {h.buyer}</span>}
                            </td>
                            <td className="px-3 py-2 text-right">{h.revenueRp ? currency.format(h.revenueRp) : "-"}</td>
                            <td className="px-3 py-2 text-right"><button onClick={() => { if (confirm("Hapus catatan panen ini?")) removePondHarvest(h.id); }} className="text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

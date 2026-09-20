"use client";

import { useMemo, useState } from "react";
import { Waves, Plus, Pencil, Trash2, Fish, Sprout, History, Layers } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { PondDetailModal } from "@/components/lele/pond-detail";
import { useUiStore } from "@/lib/store";
import { cycleMetrics } from "@/lib/lele";
import { currency, formatDate, numberFmt } from "@/lib/utils";
import type { FishCycle, Pond, PondType, PondKind } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const POND_TYPES: PondType[] = ["Terpal", "Tanah", "Beton", "Bioflok"];

const emptyPond = { code: "", name: "", type: "Terpal" as PondType, kind: "produksi" as PondKind, areaM2: "", note: "" };
const emptyStock = { pondId: "", species: "Lele Sangkuriang", stockDate: today(), source: "", initialCount: "", sizeAtStock: "5-7 cm", seedCostRp: "", otherCostRp: "", targetDate: "", targetWeightG: "110", note: "" };

export default function KolamPage() {
  const ponds = useUiStore((s) => s.ponds);
  const cycles = useUiStore((s) => s.fishCycles);
  const logs = useUiStore((s) => s.pondLogs);
  const harvests = useUiStore((s) => s.pondHarvests);
  const addPond = useUiStore((s) => s.addPond);
  const updatePond = useUiStore((s) => s.updatePond);
  const removePond = useUiStore((s) => s.removePond);
  const startCycle = useUiStore((s) => s.startCycle);
  const addStandardPonds = useUiStore((s) => s.addStandardPonds);

  const [pondModal, setPondModal] = useState(false);
  const [editingPond, setEditingPond] = useState<Pond | null>(null);
  const [pondForm, setPondForm] = useState(emptyPond);

  const [stockModal, setStockModal] = useState(false);
  const [stockForm, setStockForm] = useState(emptyStock);

  const [detail, setDetail] = useState<{ pond: Pond; cycle: FishCycle | null } | null>(null);

  const activeByPond = useMemo(() => {
    const map = new Map<string, FishCycle>();
    cycles.forEach((c) => { if (c.status === "Aktif") map.set(c.pondId, c); });
    return map;
  }, [cycles]);

  function openCreatePond() { setEditingPond(null); setPondForm(emptyPond); setPondModal(true); }
  function openEditPond(p: Pond) {
    setEditingPond(p);
    setPondForm({ code: p.code, name: p.name ?? "", type: p.type, kind: p.kind ?? "produksi", areaM2: p.areaM2?.toString() ?? "", note: p.note ?? "" });
    setPondModal(true);
  }
  function addStandard() {
    const res = addStandardPonds();
    if (res.added === 0) toast.info("Semua kolam standar sudah ada.");
    else toast.success(`${res.added} kolam standar ditambahkan (A/B/D/E + T1–T4).`);
  }
  function submitPond(e: React.FormEvent) {
    e.preventDefault();
    const payload = { code: pondForm.code.trim(), name: pondForm.name.trim() || undefined, type: pondForm.type, kind: pondForm.kind, areaM2: pondForm.areaM2 ? Number(pondForm.areaM2) : undefined, note: pondForm.note.trim() || undefined };
    if (editingPond) {
      updatePond(editingPond.id, payload);
      toast.success("Kolam diperbarui.");
    } else {
      const res = addPond(payload);
      if (!res.ok) return toast.error(res.message ?? "Gagal menambah kolam.");
      toast.success(`Kolam ${res.pond?.code} ditambahkan.`);
    }
    setPondModal(false);
  }

  function openStock(pondId: string) { setStockForm({ ...emptyStock, pondId, stockDate: today() }); setStockModal(true); }
  function submitStock(e: React.FormEvent) {
    e.preventDefault();
    const res = startCycle({
      pondId: stockForm.pondId,
      species: stockForm.species,
      stockDate: stockForm.stockDate,
      source: stockForm.source,
      initialCount: Number(stockForm.initialCount) || 0,
      sizeAtStock: stockForm.sizeAtStock.trim() || undefined,
      seedCostRp: Number(stockForm.seedCostRp) || 0,
      otherCostRp: Number(stockForm.otherCostRp) || 0,
      targetDate: stockForm.targetDate || undefined,
      targetWeightG: stockForm.targetWeightG ? Number(stockForm.targetWeightG) : undefined,
      note: stockForm.note.trim() || undefined,
    });
    if (!res.ok) return toast.error(res.message ?? "Gagal menebar benih.");
    toast.success(`Benih ditebar di kolam ${res.cycle?.pondCode}.`);
    setStockModal(false);
  }

  const finishedCycles = cycles.filter((c) => c.status !== "Aktif").sort((a, b) => (b.closedAt ?? b.createdAt).localeCompare(a.closedAt ?? a.createdAt));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Budidaya Lele"
        title="Kolam & Tebar"
        description="Kelola daftar kolam dengan kode khusus, lalu tebar benih untuk memulai siklus budidaya. Satu kolam bisa dipakai berulang untuk banyak siklus."
        action={
          <>
            <Button variant="secondary" onClick={addStandard}><Layers className="h-4 w-4" /> Kolam Standar</Button>
            <Button onClick={openCreatePond}><Plus className="h-4 w-4" /> Tambah Kolam</Button>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <StatCard label="Total Kolam" value={ponds.length} hint={`${ponds.filter((p) => p.kind === "tampungan").length} tampungan`} icon={Waves} />
        <StatCard label="Siklus Aktif" value={activeByPond.size} icon={Fish} tone="primary" />
        <StatCard label="Kolam Kosong" value={ponds.filter((p) => !activeByPond.has(p.id)).length} icon={Sprout} tone="amber" />
        <StatCard label="Siklus Selesai" value={finishedCycles.length} icon={History} tone="slate" />
      </section>

      {ponds.length === 0 ? (
        <EmptyState icon={Waves} title="Belum ada kolam" description="Tambahkan kolam pertama dengan kode khusus (mis. A12, B03)." action={<Button onClick={openCreatePond}><Plus className="h-4 w-4" /> Tambah Kolam</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[...ponds].sort((a, b) => a.code.localeCompare(b.code, "id", { numeric: true })).map((pond) => {
            const cycle = activeByPond.get(pond.id) ?? null;
            const metrics = cycle ? cycleMetrics(cycle, logs, harvests) : null;
            return (
              <Card key={pond.id}>
                <CardContent>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold">{pond.code}</p>
                        {pond.kind === "tampungan" && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">Tampungan</Badge>}
                      </div>
                      <p className="truncate text-xs text-muted">{pond.name || "Tanpa nama"} · {pond.type}{pond.areaM2 ? ` · ${pond.areaM2} m²` : ""}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" className="h-8 w-8 px-0" aria-label="Edit" onClick={() => openEditPond(pond)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" className="h-8 w-8 px-0 text-danger" aria-label="Hapus" onClick={() => { const res = removePond(pond.id); if (!res.ok) return toast.error(res.message ?? "Gagal."); toast.success("Kolam dihapus."); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  {cycle && metrics ? (
                    <div className="mt-3 rounded-lg border border-border bg-background p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/40">Siklus aktif</Badge>
                        <span className="text-xs text-muted">{metrics.ageLabel}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted">{cycle.species} · {numberFmt.format(metrics.currentCount)}/{numberFmt.format(cycle.initialCount)} ekor hidup · SR {Math.round(metrics.survivalRate * 100)}%</p>
                      <p className="text-xs text-muted">Ditebar {formatDate(cycle.stockDate)} dari {cycle.source || "-"}</p>
                      <Button variant="secondary" className="mt-2 h-9 w-full" onClick={() => setDetail({ pond, cycle })}>Buka Detail &amp; Input</Button>
                    </div>
                  ) : (
                    <Button className="mt-3 w-full" onClick={() => openStock(pond.id)}><Sprout className="h-4 w-4" /> Tebar Benih</Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Riwayat siklus selesai */}
      {finishedCycles.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-bold">Riwayat Siklus</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
                <tr>
                  <th className="px-3 py-2 font-semibold">Kolam</th>
                  <th className="px-3 py-2 font-semibold">Ditebar</th>
                  <th className="px-3 py-2 text-right font-semibold">Benih</th>
                  <th className="px-3 py-2 text-right font-semibold">Panen (kg)</th>
                  <th className="px-3 py-2 text-right font-semibold">Omzet</th>
                  <th className="px-3 py-2 text-right font-semibold">Laba</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {finishedCycles.map((c) => {
                  const m = cycleMetrics(c, logs, harvests);
                  return (
                    <tr key={c.id} className="border-t border-border">
                      <td className="px-3 py-2 font-semibold">{c.pondCode}</td>
                      <td className="px-3 py-2">{formatDate(c.stockDate)}</td>
                      <td className="px-3 py-2 text-right">{numberFmt.format(c.initialCount)}</td>
                      <td className="px-3 py-2 text-right">{m.harvestWeightKg.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right">{currency.format(m.revenueRp)}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${m.profitRp >= 0 ? "text-primary" : "text-danger"}`}>{currency.format(m.profitRp)}</td>
                      <td className="px-3 py-2"><Badge className={c.status === "Selesai" ? "bg-leaf/10 text-primary" : "bg-red-50 text-danger dark:bg-red-950/40"}>{c.status}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal kolam */}
      <Modal open={pondModal} onClose={() => setPondModal(false)} title={editingPond ? "Edit Kolam" : "Tambah Kolam"} description="Beri kode unik agar mudah dikenali di lapangan.">
        <form onSubmit={submitPond} className="grid gap-4 sm:grid-cols-2">
          <Field label="Kode Kolam"><Input value={pondForm.code} onChange={(e) => setPondForm((f) => ({ ...f, code: e.target.value }))} placeholder="A12" /></Field>
          <Field label="Jenis Kolam">
            <Select value={pondForm.type} onChange={(e) => setPondForm((f) => ({ ...f, type: e.target.value as PondType }))}>
              {POND_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Peran Kolam" hint="Tampungan (T1–T4) = stok lele siap jual, bukan pembesaran.">
              <Select value={pondForm.kind} onChange={(e) => setPondForm((f) => ({ ...f, kind: e.target.value as PondKind }))}>
                <option value="produksi">Produksi (pembesaran)</option>
                <option value="tampungan">Tampungan (siap jual)</option>
              </Select>
            </Field>
          </div>
          <div className="sm:col-span-2"><Field label="Nama (opsional)"><Input value={pondForm.name} onChange={(e) => setPondForm((f) => ({ ...f, name: e.target.value }))} placeholder="Kolam Terpal Belakang" /></Field></div>
          <Field label="Luas (m²)"><Input type="number" min={0} step="any" value={pondForm.areaM2} onChange={(e) => setPondForm((f) => ({ ...f, areaM2: e.target.value }))} placeholder="12" /></Field>
          <div className="sm:col-span-2"><Field label="Catatan"><Textarea value={pondForm.note} onChange={(e) => setPondForm((f) => ({ ...f, note: e.target.value }))} /></Field></div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPondModal(false)}>Batal</Button>
            <Button type="submit">{editingPond ? "Simpan" : "Tambah Kolam"}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal tebar benih */}
      <Modal open={stockModal} onClose={() => setStockModal(false)} title="Tebar Benih" description="Mulai siklus budidaya baru pada kolam ini." size="lg">
        <form onSubmit={submitStock} className="grid gap-4 sm:grid-cols-2">
          <Field label="Jenis Lele"><Input value={stockForm.species} onChange={(e) => setStockForm((f) => ({ ...f, species: e.target.value }))} placeholder="Lele Sangkuriang" /></Field>
          <Field label="Tanggal Tebar"><Input type="date" value={stockForm.stockDate} onChange={(e) => setStockForm((f) => ({ ...f, stockDate: e.target.value }))} /></Field>
          <Field label="Asal Benih"><Input value={stockForm.source} onChange={(e) => setStockForm((f) => ({ ...f, source: e.target.value }))} placeholder="Hatchery Mina Jaya" /></Field>
          <Field label="Ukuran Benih"><Input value={stockForm.sizeAtStock} onChange={(e) => setStockForm((f) => ({ ...f, sizeAtStock: e.target.value }))} placeholder="5-7 cm" /></Field>
          <Field label="Jumlah Benih (ekor)"><Input type="number" min={0} value={stockForm.initialCount} onChange={(e) => setStockForm((f) => ({ ...f, initialCount: e.target.value }))} placeholder="2000" /></Field>
          <Field label="Biaya Benih (Rp)"><Input type="number" min={0} value={stockForm.seedCostRp} onChange={(e) => setStockForm((f) => ({ ...f, seedCostRp: e.target.value }))} placeholder="400000" /></Field>
          <Field label="Biaya Awal Lain (Rp)" hint="Kapur, probiotik, dll."><Input type="number" min={0} value={stockForm.otherCostRp} onChange={(e) => setStockForm((f) => ({ ...f, otherCostRp: e.target.value }))} placeholder="0" /></Field>
          <Field label="Target Bobot (g/ekor)"><Input type="number" min={0} value={stockForm.targetWeightG} onChange={(e) => setStockForm((f) => ({ ...f, targetWeightG: e.target.value }))} placeholder="110" /></Field>
          <Field label="Target Tanggal Panen"><Input type="date" value={stockForm.targetDate} onChange={(e) => setStockForm((f) => ({ ...f, targetDate: e.target.value }))} /></Field>
          <div className="sm:col-span-2"><Field label="Catatan"><Textarea value={stockForm.note} onChange={(e) => setStockForm((f) => ({ ...f, note: e.target.value }))} /></Field></div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setStockModal(false)}>Batal</Button>
            <Button type="submit"><Sprout className="h-4 w-4" /> Tebar Benih</Button>
          </div>
        </form>
      </Modal>

      {detail && <PondDetailModal pond={detail.pond} cycle={detail.cycle} onClose={() => setDetail(null)} />}
    </AppShell>
  );
}

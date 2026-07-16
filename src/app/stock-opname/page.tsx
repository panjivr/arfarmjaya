"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, Plus } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import type { OpnameLine } from "@/lib/types";

export default function StockOpnamePage() {
  const sessions = useUiStore((s) => s.opnameSessions);
  const products = useUiStore((s) => s.products);
  const warehouses = useUiStore((s) => s.warehouses);
  const createOpname = useUiStore((s) => s.createOpname);
  const postOpname = useUiStore((s) => s.postOpname);

  const [open, setOpen] = useState(false);
  const [warehouse, setWarehouse] = useState(warehouses[0]?.name ?? "");
  const [reason, setReason] = useState("");
  const [actuals, setActuals] = useState<Record<string, number>>({});

  const draft = sessions.filter((s) => s.status === "Draft").length;
  const posted = sessions.filter((s) => s.status === "Diposting").length;

  const productsInWarehouse = useMemo(
    () => products.filter((p) => p.warehouse === warehouse),
    [products, warehouse],
  );

  function changeWarehouse(name: string) {
    setWarehouse(name);
    setActuals({});
  }

  function actualFor(sku: string, fallback: number) {
    return actuals[sku] ?? fallback;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!warehouse) return toast.error("Pilih gudang.");
    if (productsInWarehouse.length === 0) return toast.error("Tidak ada barang di gudang ini.");
    const lines: OpnameLine[] = productsInWarehouse.map((p) => ({
      sku: p.sku,
      name: p.name,
      unit: p.unit,
      systemStock: p.currentStock,
      actualStock: actualFor(p.sku, p.currentStock),
    }));
    createOpname({ warehouse, lines, reason: reason || undefined });
    toast.success("Sesi stok opname dibuat.");
    setOpen(false);
    setReason("");
    setActuals({});
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Operasional"
        title="Stok Opname"
        description="Hitung fisik stok per gudang, catat selisih terhadap stok sistem, lalu posting penyesuaian ke inventori."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Sesi Baru</Button>}
      />

      <section className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Sesi" value={sessions.length} icon={ClipboardCheck} />
        <StatCard label="Draft" value={draft} icon={ClipboardCheck} tone="amber" />
        <StatCard label="Diposting" value={posted} icon={ClipboardCheck} tone="primary" />
      </section>

      {sessions.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Belum ada sesi opname" description="Mulai sesi stok opname pertama untuk mencocokkan stok fisik." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Sesi Baru</Button>} />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{s.number}</span>
                    <Badge className={s.status === "Diposting" ? "bg-leaf/10 text-primary" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}>{s.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{s.warehouse} · {formatDateTime(s.createdAt)}{s.reason ? ` · ${s.reason}` : ""}</p>
                </div>
                {s.status === "Draft" && (
                  <Button className="h-9" onClick={() => { postOpname(s.id); toast.success("Penyesuaian diposting ke stok."); }}>Posting Adjustment</Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Barang</th>
                        <th className="px-4 py-2 text-right font-semibold">Stok Sistem</th>
                        <th className="px-4 py-2 text-right font-semibold">Stok Aktual</th>
                        <th className="px-4 py-2 text-right font-semibold">Selisih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.lines.map((l) => {
                        const diff = l.actualStock - l.systemStock;
                        return (
                          <tr key={l.sku} className="border-t border-border">
                            <td className="px-4 py-2">{l.name}</td>
                            <td className="px-4 py-2 text-right">{l.systemStock} {l.unit}</td>
                            <td className="px-4 py-2 text-right">{l.actualStock} {l.unit}</td>
                            <td className={`px-4 py-2 text-right font-semibold ${diff < 0 ? "text-danger" : diff > 0 ? "text-primary" : "text-muted"}`}>
                              {diff > 0 ? `+${diff}` : diff}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Sesi Stok Opname Baru" description="Pilih gudang, lalu isi stok aktual hasil hitung fisik." size="lg">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Pilih Gudang">
            <Select value={warehouse} onChange={(e) => changeWarehouse(e.target.value)}>
              {warehouses.map((w) => (<option key={w.id} value={w.name}>{w.name}</option>))}
            </Select>
          </Field>

          <div className="rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Barang</th>
                    <th className="px-4 py-2 text-right font-semibold">Stok Sistem</th>
                    <th className="px-4 py-2 text-right font-semibold">Stok Aktual</th>
                  </tr>
                </thead>
                <tbody>
                  {productsInWarehouse.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-muted">Tidak ada barang di gudang ini.</td></tr>
                  ) : (
                    productsInWarehouse.map((p) => (
                      <tr key={p.sku} className="border-t border-border">
                        <td className="px-4 py-2">{p.name}</td>
                        <td className="px-4 py-2 text-right">{p.currentStock} {p.unit}</td>
                        <td className="px-4 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            value={actualFor(p.sku, p.currentStock)}
                            onChange={(e) => setActuals((prev) => ({ ...prev, [p.sku]: Math.max(0, Number(e.target.value)) }))}
                            className="ml-auto h-9 w-28 text-right"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Field label="Alasan (opsional)"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan selisih / catatan sesi" /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit">Buat Sesi</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

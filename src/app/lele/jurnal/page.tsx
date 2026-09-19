"use client";

import { useMemo, useState } from "react";
import { NotebookPen, Plus, Trash2, Filter, Droplets, Download } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { JOURNAL_CATEGORIES, journalTone } from "@/components/lele/journal-shared";
import { useUiStore } from "@/lib/store";
import { formatDate, exportCsv } from "@/lib/utils";
import type { JournalCategory } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

export default function JurnalPage() {
  const ponds = useUiStore((s) => s.ponds);
  const journals = useUiStore((s) => s.pondJournals);
  const addPondJournal = useUiStore((s) => s.addPondJournal);
  const removePondJournal = useUiStore((s) => s.removePondJournal);

  const [pondFilter, setPondFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ pondId: string; date: string; category: JournalCategory; title: string; note: string; waterTemp: string; waterPh: string }>({
    pondId: "",
    date: today(),
    category: "Catatan Umum",
    title: "",
    note: "",
    waterTemp: "",
    waterPh: "",
  });

  const filtered = useMemo(
    () =>
      journals
        .filter((j) => (!pondFilter || j.pondId === pondFilter) && (!catFilter || j.category === catFilter))
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [journals, pondFilter, catFilter],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const pond = ponds.find((p) => p.id === form.pondId);
    const res = addPondJournal({
      pondId: form.pondId || undefined,
      pondCode: pond?.code,
      date: form.date,
      category: form.category,
      title: form.title.trim(),
      note: form.note.trim(),
      waterTemp: form.waterTemp ? Number(form.waterTemp) : undefined,
      waterPh: form.waterPh ? Number(form.waterPh) : undefined,
    });
    if (!res.ok) return toast.error(res.message ?? "Gagal menyimpan.");
    toast.success("Jurnal tersimpan.");
    setForm({ pondId: form.pondId, date: today(), category: "Catatan Umum", title: "", note: "", waterTemp: "", waterPh: "" });
    setOpen(false);
  }

  function exportJournal() {
    if (filtered.length === 0) return toast.error("Tidak ada jurnal untuk diekspor.");
    exportCsv(
      `jurnal-lele-${today()}`,
      filtered.map((j) => ({
        Tanggal: formatDate(j.date),
        Kolam: j.pondCode ?? "Umum",
        Kategori: j.category,
        Judul: j.title,
        Catatan: j.note,
        "Suhu (C)": j.waterTemp ?? "",
        pH: j.waterPh ?? "",
        Oleh: j.actor,
      })),
    );
    toast.success("Jurnal diekspor ke CSV.");
  }

  const catCount = (c: JournalCategory) => journals.filter((j) => j.category === c).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Budidaya Lele"
        title="Jurnal Lele"
        description="Catat kejadian penting tiap kolam: kualitas air, kesehatan/penyakit, perlakuan (sortir/grading), cuaca, dan pemeliharaan. Riwayat lengkap yang tersinkron antar-perangkat."
        action={
          <>
            <Button variant="secondary" onClick={exportJournal}><Download className="h-4 w-4" /> Ekspor CSV</Button>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Tulis Jurnal</Button>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <StatCard label="Total Jurnal" value={journals.length} icon={NotebookPen} />
        <StatCard label="Kualitas Air" value={catCount("Kualitas Air")} icon={Droplets} tone="primary" />
        <StatCard label="Kesehatan" value={catCount("Kesehatan & Penyakit")} icon={NotebookPen} tone="danger" />
        <StatCard label="Perlakuan" value={catCount("Perlakuan")} icon={NotebookPen} tone="amber" />
      </section>

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm text-muted"><Filter className="h-4 w-4" /> Filter</div>
          <Select value={pondFilter} onChange={(e) => setPondFilter(e.target.value)} className="sm:max-w-[220px]">
            <option value="">Semua kolam</option>
            {[...ponds].sort((a, b) => a.code.localeCompare(b.code, "id", { numeric: true })).map((p) => (
              <option key={p.id} value={p.id}>{p.code}{p.name ? ` — ${p.name}` : ""}</option>
            ))}
          </Select>
          <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="sm:max-w-[220px]">
            <option value="">Semua kategori</option>
            {JOURNAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={NotebookPen} title="Belum ada jurnal" description="Tulis jurnal pertama untuk mencatat kejadian di kolam." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Tulis Jurnal</Button>} />
      ) : (
        <ol className="relative space-y-3 border-l-2 border-border pl-4 sm:pl-5">
          {filtered.map((j) => (
            <li key={j.id} className="relative">
              <span className="absolute -left-[1.30rem] top-2 h-3 w-3 rounded-full border-2 border-card bg-primary sm:-left-[1.55rem]" />
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={journalTone(j.category)}>{j.category}</Badge>
                        {j.pondCode && <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Kolam {j.pondCode}</Badge>}
                        <span className="text-xs text-muted">{formatDate(j.date)}</span>
                      </div>
                      {j.title && <p className="mt-1.5 font-semibold">{j.title}</p>}
                      {j.note && <p className="mt-0.5 text-sm text-muted">{j.note}</p>}
                      {(j.waterTemp != null || j.waterPh != null) && (
                        <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-xs text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                          <Droplets className="h-3 w-3" />
                          {j.waterTemp != null && `Suhu ${j.waterTemp}°C`}{j.waterTemp != null && j.waterPh != null && " · "}{j.waterPh != null && `pH ${j.waterPh}`}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted">oleh {j.actor}</p>
                    </div>
                    <button onClick={() => { if (confirm("Hapus jurnal ini?")) removePondJournal(j.id); }} className="shrink-0 text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Tulis Jurnal" description="Catatan kejadian/tindakan pada kolam." size="lg">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Kolam"><Select value={form.pondId} onChange={(e) => setForm((f) => ({ ...f, pondId: e.target.value }))}><option value="">Umum (tanpa kolam)</option>{[...ponds].sort((a, b) => a.code.localeCompare(b.code, "id", { numeric: true })).map((p) => <option key={p.id} value={p.id}>{p.code}{p.name ? ` — ${p.name}` : ""}</option>)}</Select></Field>
          <Field label="Tanggal"><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Kategori"><Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as JournalCategory }))}>{JOURNAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
          <Field label="Judul"><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ganti air 30%, sortir, dll." /></Field>
          {form.category === "Kualitas Air" && (
            <>
              <Field label="Suhu (°C)"><Input type="number" step="any" value={form.waterTemp} onChange={(e) => setForm((f) => ({ ...f, waterTemp: e.target.value }))} placeholder="28" /></Field>
              <Field label="pH"><Input type="number" step="any" value={form.waterPh} onChange={(e) => setForm((f) => ({ ...f, waterPh: e.target.value }))} placeholder="7.0" /></Field>
            </>
          )}
          <div className="sm:col-span-2"><Field label="Catatan"><Textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Detail kejadian / tindakan yang dilakukan" /></Field></div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit"><Plus className="h-4 w-4" /> Simpan Jurnal</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

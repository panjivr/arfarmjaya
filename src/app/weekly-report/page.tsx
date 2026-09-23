"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Copy,
  Download,
  FileDown,
  FilePlus2,
  ImagePlus,
  Pencil,
  Plus,
  Printer,
  Save,
  Settings2,
  Sprout,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { ScaledPreview } from "@/components/ui/scaled-preview";
import { WeeklyReportDocument, type WeeklyReportData } from "@/components/report/weekly-report-document";
import { useUiStore } from "@/lib/store";
import { compressImage, currency, exportCsv, formatDate, formatDateTime, printDocument } from "@/lib/utils";
import type { ReportProfile, WeeklyActivity, WeeklyReport } from "@/lib/types";

type SortMode = "" | "date-asc" | "date-desc" | "alpha" | "amount-desc" | "amount-asc";

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const emptyActivity = (): WeeklyActivity => ({
  id: uid(),
  date: today(),
  activity: "",
  purpose: "",
  hst: "",
  amount: 0,
  output: "",
  photo: undefined,
});

const sampleActivity = (): WeeklyActivity => ({
  id: uid(),
  date: today(),
  activity: "Persiapan & Penanaman Benih Kedelai",
  purpose: "Melakukan penanaman benih kedelai pada lahan sesuai jarak tanam anjuran (40 x 20 cm)",
  hst: "0 HST",
  amount: 250000,
  output: "Benih kedelai tertanam pada lahan seluas 0,5 ha sesuai jarak tanam anjuran",
  photo: undefined,
});

const emptyForm = {
  number: "",
  executor: "",
  group: "",
  location: "",
  week: "",
  periodStart: "",
  periodEnd: "",
  signPlace: "",
  signDate: "",
};

const blankProfile: Omit<ReportProfile, "id" | "createdAt"> = {
  name: "Profil Laporan Baru",
  organization: "NAMA LEMBAGA / YAYASAN",
  tagline: "",
  program: "",
  address: "",
  phone: "",
  email: "",
  logo: "",
  accent: "#c0201c",
  reportTitle: "LAPORAN PELAKSANAAN MINGGUAN",
  currencyLabel: "Nominal (Rp)",
  signaturePlace: "",
  signatureRole: "Pelaksana / Penyuluh",
  signatureName: "",
  signatureId: "",
  signatureImage: "",
  approverRole: "",
  approverName: "",
  approverId: "",
  notes: [],
  showHst: true,
  showAmount: true,
  showOutput: true,
  showPhoto: true,
  showPayment: true,
  showSummary: true,
  showNotes: true,
  autoFit: true,
  minRows: 8,
};

export default function WeeklyReportPage() {
  const profiles = useUiStore((s) => s.reportProfiles);
  const reports = useUiStore((s) => s.weeklyReports);
  const saveWeeklyReport = useUiStore((s) => s.saveWeeklyReport);
  const deleteWeeklyReport = useUiStore((s) => s.deleteWeeklyReport);
  const duplicateWeeklyReport = useUiStore((s) => s.duplicateWeeklyReport);

  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [form, setForm] = useState(emptyForm);
  const [activities, setActivities] = useState<WeeklyActivity[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [activityModal, setActivityModal] = useState<{ open: boolean; draft: WeeklyActivity; isNew: boolean }>({
    open: false,
    draft: emptyActivity(),
    isNew: true,
  });
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [printTarget, setPrintTarget] = useState<{ profile: ReportProfile; data: WeeklyReportData } | null>(null);
  const [printedAt, setPrintedAt] = useState<string | undefined>(undefined);
  const [numberSeed, setNumberSeed] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "date" | "executor" | "amount-desc" | "amount-asc">("updated");

  // Mengurutkan daftar kegiatan. Urutannya benar-benar diubah (bukan tampilan
  // saja) supaya penomoran & pratinjau cetak ikut mengikuti. Tekan Simpan untuk
  // menyimpan urutan baru; tombol panah tetap bisa dipakai menata manual.
  function sortActivities(mode: SortMode) {
    if (!mode) return;
    setActivities((prev) => {
      const next = [...prev];
      const amount = (a: WeeklyActivity) => Number(a.amount) || 0;
      switch (mode) {
        case "date-asc": next.sort((a, b) => (a.date || "").localeCompare(b.date || "")); break;
        case "date-desc": next.sort((a, b) => (b.date || "").localeCompare(a.date || "")); break;
        case "alpha": next.sort((a, b) => a.activity.localeCompare(b.activity, "id", { sensitivity: "base" })); break;
        case "amount-desc": next.sort((a, b) => amount(b) - amount(a)); break;
        case "amount-asc": next.sort((a, b) => amount(a) - amount(b)); break;
      }
      return next;
    });
    toast.success("Kegiatan diurutkan. Tekan Simpan untuk menyimpan urutannya.");
  }

  const sortedReports = useMemo(() => {
    const arr = [...reports];
    const dateKey = (r: WeeklyReport) => r.signDate || r.periodStart || r.createdAt.slice(0, 10);
    switch (sortBy) {
      case "date": return arr.sort((a, b) => dateKey(b).localeCompare(dateKey(a)));
      case "executor": return arr.sort((a, b) => a.executor.localeCompare(b.executor, "id", { sensitivity: "base" }));
      case "amount-desc": return arr.sort((a, b) => b.total - a.total);
      case "amount-asc": return arr.sort((a, b) => a.total - b.total);
      default: return arr.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    }
  }, [reports, sortBy]);
  const [mounted, setMounted] = useState(false);

  // Tanggal dihitung setelah mount agar hasil render awal cocok dengan HTML statis.
  useEffect(() => {
    setPrintedAt(formatDateTime(new Date().toISOString()));
    setNumberSeed(today().replace(/-/g, ""));
    setForm((f) => (f.signDate ? f : { ...f, signDate: today() }));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!profiles.some((p) => p.id === profileId)) setProfileId(profiles[0]?.id ?? "");
  }, [profiles, profileId]);

  const profile = profiles.find((p) => p.id === profileId) ?? profiles[0];
  const total = useMemo(() => activities.reduce((t, a) => t + (Number(a.amount) || 0), 0), [activities]);
  const suggestedNumber = numberSeed ? `LPM-${numberSeed}-${String(reports.length + 1).padStart(4, "0")}` : "";

  const previewData: WeeklyReportData = {
    number: form.number.trim() || suggestedNumber,
    executor: form.executor,
    group: form.group,
    location: form.location,
    week: form.week,
    periodStart: form.periodStart || undefined,
    periodEnd: form.periodEnd || undefined,
    signPlace: form.signPlace,
    signDate: form.signDate,
    activities,
    total,
  };

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetForm() {
    setForm({ ...emptyForm, signDate: today() });
    setActivities([]);
    setEditingId(null);
  }

  function loadReport(report: WeeklyReport) {
    setProfileId(profiles.some((p) => p.id === report.profileId) ? report.profileId : (profiles[0]?.id ?? ""));
    setForm({
      number: report.number,
      executor: report.executor,
      group: report.group,
      location: report.location,
      week: report.week,
      periodStart: report.periodStart ?? "",
      periodEnd: report.periodEnd ?? "",
      signPlace: report.signPlace,
      signDate: report.signDate,
    });
    setActivities(report.activities.map((a) => ({ ...a })));
    setEditingId(report.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function save() {
    if (!profile) return toast.error("Buat profil laporan terlebih dahulu.");
    const result = saveWeeklyReport({
      id: editingId ?? undefined,
      number: form.number,
      profileId: profile.id,
      executor: form.executor,
      group: form.group,
      location: form.location,
      week: form.week,
      periodStart: form.periodStart || undefined,
      periodEnd: form.periodEnd || undefined,
      signPlace: form.signPlace,
      signDate: form.signDate,
      activities,
    });
    const saved = result.report;
    if (!result.ok || !saved) return toast.error(result.message ?? "Gagal menyimpan laporan.");
    setEditingId(saved.id);
    setForm((f) => ({ ...f, number: saved.number }));
    toast.success(`Laporan ${saved.number} tersimpan.`);
  }

  // Nama berkas otomatis mengikuti judul laporan (dipakai untuk nama default
  // "Simpan sebagai PDF" lewat document.title, dan untuk nama berkas CSV).
  function reportFileName(p: ReportProfile, d: WeeklyReportData) {
    const base = [p.reportTitle, d.week, d.number].filter((x) => x && x.trim()).join(" - ");
    return (base || "Laporan Mingguan").replace(/[\\/:*?"<>|\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  }

  function print(data: WeeklyReportData, target: ReportProfile, asPdf = false) {
    setPrintedAt(formatDateTime(new Date().toISOString()));
    setPrintTarget({ profile: target, data });
    if (asPdf) toast.info("Pada dialog cetak, pilih tujuan “Simpan sebagai PDF”.");
    // Nama file PDF default mengikuti judul laporan (browser memakai document.title).
    const previousTitle = document.title;
    document.title = reportFileName(target, data);
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    setTimeout(() => {
      const area = document.getElementById("report-print-area");
      // Mengalir alami (tanpa zoom) supaya tidak ada bagian atas/bawah/logo yang
      // terpotong; header tabel diulang tiap halaman bila laporan lebih panjang.
      if (area) area.style.setProperty("--report-print-zoom", "1");
      // size: landscape (bukan "A4 landscape") mengikuti ukuran kertas apa pun
      // yang dipilih di dialog cetak; margin memberi jarak rapi di semua sisi.
      printDocument({ landscape: true, margin: "12mm", bodyClass: "printing-report" });
      window.setTimeout(restoreTitle, 8000);
    }, 350);
  }

  function exportReportCsv(data: WeeklyReportData) {
    if (data.activities.length === 0) return toast.error("Belum ada kegiatan untuk diekspor.");
    exportCsv(
      `${reportFileName(profile, data)}.csv`,
      data.activities.map((a, index) => ({
        No: index + 1,
        Tanggal: formatDate(a.date),
        "Jenis Kegiatan": a.activity,
        Tujuan: a.purpose,
        "Umur HST": a.hst,
        "Nominal (Rp)": a.amount,
        Output: a.output,
        Foto: a.photo ? "Ada" : "-",
        "Bukti Pembayaran": a.paymentProof ? "Ada" : "-",
      })),
    );
    toast.success("Data kegiatan diekspor ke CSV.");
  }

  /* ── kegiatan ────────────────────────────────────────────────────────── */

  function openNewActivity() {
    const last = activities[activities.length - 1];
    setActivityModal({
      open: true,
      isNew: true,
      draft: { ...emptyActivity(), date: last?.date ?? today() },
    });
  }

  function openEditActivity(activity: WeeklyActivity) {
    setActivityModal({ open: true, isNew: false, draft: { ...activity } });
  }

  function submitActivity() {
    const draft = activityModal.draft;
    if (!draft.activity.trim()) return toast.error("Jenis kegiatan wajib diisi.");
    setActivities((prev) =>
      activityModal.isNew ? [...prev, draft] : prev.map((a) => (a.id === draft.id ? draft : a)),
    );
    setActivityModal((m) => ({ ...m, open: false }));
    toast.success(activityModal.isNew ? "Kegiatan ditambahkan." : "Kegiatan diperbarui.");
  }

  function moveActivity(index: number, direction: -1 | 1) {
    setActivities((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  if (!profile) {
    return (
      <AppShell>
        <PageHeader eyebrow="Laporan & Analitik" title="Laporan Mingguan" description="Buat laporan pelaksanaan mingguan yang rapi dan siap cetak." />
        <EmptyState icon={Sprout} title="Belum ada profil laporan" description="Profil laporan berisi kop surat, judul, dan format cetak." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Laporan & Analitik"
        title="Laporan Mingguan"
        description="Susun laporan pelaksanaan mingguan lengkap dengan kop lembaga, tabel kegiatan, foto, total nominal, dan blok tanda tangan — lalu simpan, cetak, atau ekspor ke PDF."
        action={
          <>
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => setProfileModalOpen(true)}>
              <Settings2 className="h-4 w-4" /> <span className="truncate">Pengaturan Format</span>
            </Button>
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={resetForm}>
              <FilePlus2 className="h-4 w-4" /> Laporan Baru
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={save}>
              <Save className="h-4 w-4" /> {editingId ? "Perbarui" : "Simpan"}
            </Button>
          </>
        }
      />

      <section className="no-print mb-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Tersimpan" value={reports.length} icon={FileDown} />
        <StatCard label="Kegiatan" value={activities.length} icon={Sprout} tone="primary" />
        <StatCard label="Total Nominal" value={currency.format(total)} icon={Wallet} tone="amber" />
        <StatCard label="Profil Format" value={profiles.length} icon={Settings2} tone="slate" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        {/* Editor */}
        <div className="no-print min-w-0 space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Identitas Laporan</h2>
              {editingId && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40">Mode edit</span>}
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Profil / Kop Laporan" hint="Atur kop, judul, dan kolom lewat Pengaturan Format.">
                <Select value={profileId} onChange={(e) => setProfileId(e.target.value)}>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="No. Dokumen">
                <Input value={form.number} onChange={(e) => set("number", e.target.value)} placeholder={suggestedNumber} />
              </Field>
              <Field label="Nama Pelaksana / Penyuluh">
                <Input value={form.executor} onChange={(e) => set("executor", e.target.value)} placeholder="Nama lengkap pelaksana" />
              </Field>
              <Field label="Kelompok Tani">
                <Input value={form.group} onChange={(e) => set("group", e.target.value)} placeholder="Kelompok Tani Makmur" />
              </Field>
              <Field label="Lokasi / Desa">
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Desa Ngraket, Kec. Balong" />
              </Field>
              <Field label="Minggu Ke- / Periode">
                <Input value={form.week} onChange={(e) => set("week", e.target.value)} placeholder="Minggu ke-1" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Periode Mulai">
                  <Input type="date" value={form.periodStart} onChange={(e) => set("periodStart", e.target.value)} />
                </Field>
                <Field label="Periode Selesai">
                  <Input type="date" value={form.periodEnd} onChange={(e) => set("periodEnd", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tempat Tanda Tangan">
                  <Input value={form.signPlace} onChange={(e) => set("signPlace", e.target.value)} placeholder="Ponorogo" />
                </Field>
                <Field label="Tanggal Tanda Tangan">
                  <Input type="date" value={form.signDate} onChange={(e) => set("signDate", e.target.value)} />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Kegiatan ({activities.length})</h2>
              <div className="flex flex-wrap items-center gap-2">
                {activities.length > 1 && (
                  <Select
                    aria-label="Urutkan kegiatan"
                    className="h-8 w-auto text-xs"
                    value=""
                    onChange={(e) => { sortActivities(e.target.value as SortMode); e.currentTarget.selectedIndex = 0; }}
                  >
                    <option value="">Urutkan…</option>
                    <option value="date-asc">Tanggal (terlama dulu)</option>
                    <option value="date-desc">Tanggal (terbaru dulu)</option>
                    <option value="alpha">Abjad kegiatan (A–Z)</option>
                    <option value="amount-desc">Nominal tertinggi</option>
                    <option value="amount-asc">Nominal terendah</option>
                  </Select>
                )}
                {activities.length === 0 && (
                  <Button variant="ghost" className="h-8" onClick={() => setActivities([sampleActivity()])}>
                    Isi Contoh
                  </Button>
                )}
                <Button variant="secondary" className="h-8" onClick={openNewActivity}>
                  <Plus className="h-4 w-4" /> Tambah
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {activities.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">Belum ada kegiatan. Tambahkan kegiatan harian pada minggu ini.</p>
              ) : (
                activities.map((activity, index) => (
                  <div key={activity.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{activity.activity || "Tanpa nama kegiatan"}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatDate(activity.date)}
                          {activity.hst && ` · ${activity.hst}`}
                          {activity.amount > 0 && ` · ${currency.format(activity.amount)}`}
                        </p>
                        {activity.purpose && <p className="mt-1 line-clamp-2 text-xs text-muted">{activity.purpose}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {activity.photo && (
                          <Image src={activity.photo} alt="Foto kegiatan" width={56} height={56} className="h-12 w-12 rounded object-cover" unoptimized />
                        )}
                        {activity.paymentProof && (
                          <Image src={activity.paymentProof} alt="Bukti pembayaran" width={56} height={56} className="h-12 w-12 rounded object-cover ring-1 ring-primary/40" unoptimized />
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end gap-1">
                      <Button variant="ghost" className="h-8 w-8 px-0" aria-label="Naikkan" disabled={index === 0} onClick={() => moveActivity(index, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 px-0"
                        aria-label="Turunkan"
                        disabled={index === activities.length - 1}
                        onClick={() => moveActivity(index, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" className="h-8 w-8 px-0" aria-label="Edit" onClick={() => openEditActivity(activity)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 px-0 text-danger"
                        aria-label="Hapus"
                        onClick={() => setActivities((prev) => prev.filter((a) => a.id !== activity.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}

              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <span className="text-muted">Total Nominal</span>
                <span className="text-lg font-bold">{currency.format(total)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="secondary" onClick={() => print(previewData, profile)} disabled={activities.length === 0}>
                  <Printer className="h-4 w-4" /> Cetak
                </Button>
                <Button variant="secondary" onClick={() => print(previewData, profile, true)} disabled={activities.length === 0}>
                  <FileDown className="h-4 w-4" /> Simpan PDF
                </Button>
                <Button variant="ghost" onClick={() => exportReportCsv(previewData)}>
                  <Download className="h-4 w-4" /> Ekspor CSV
                </Button>
                <Button onClick={save}>
                  <Save className="h-4 w-4" /> {editingId ? "Perbarui" : "Simpan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pratinjau */}
        <div className="no-print min-w-0">
          <Card className="bg-slate-100 p-3 sm:p-4 lg:sticky lg:top-20 dark:bg-slate-900">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted sm:mb-3">Pratinjau cetak — A4 landscape</p>
            <ScaledPreview>
              <div className="shadow-lg">
                <WeeklyReportDocument profile={profile} report={previewData} printedAt={printedAt} />
              </div>
            </ScaledPreview>
          </Card>
        </div>
      </div>

      {/* Laporan tersimpan */}
      <div className="no-print mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Laporan Tersimpan</h2>
          {reports.length > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">Urutkan:</span>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="h-9 w-auto">
                <option value="updated">Waktu diperbarui (terbaru)</option>
                <option value="date">Tanggal laporan (terbaru)</option>
                <option value="executor">Abjad pelaksana (A–Z)</option>
                <option value="amount-desc">Nominal tertinggi</option>
                <option value="amount-asc">Nominal terendah</option>
              </Select>
            </label>
          )}
        </div>
        {reports.length === 0 ? (
          <EmptyState icon={Calendar} title="Belum ada laporan tersimpan" description="Laporan yang disimpan akan muncul di sini dan bisa dibuka ulang, diduplikasi, atau dicetak." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sortedReports.map((report) => {
              const reportProfile = profiles.find((p) => p.id === report.profileId) ?? profile;
              return (
                <Card key={report.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-bold">{report.number}</p>
                        <p className="truncate text-sm text-muted">{report.executor}</p>
                        <p className="truncate text-xs text-muted">
                          {report.week || "-"} · {report.location || "-"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold">{currency.format(report.total)}</p>
                        <p className="text-xs text-muted">{report.activities.length} kegiatan</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted">Diperbarui {formatDateTime(report.updatedAt)}</p>
                    <div className="mt-3 flex flex-wrap justify-end gap-1">
                      <Button variant="secondary" className="h-8" onClick={() => loadReport(report)}>
                        <Pencil className="h-4 w-4" /> Buka
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-8"
                        onClick={() =>
                          print(
                            {
                              number: report.number,
                              executor: report.executor,
                              group: report.group,
                              location: report.location,
                              week: report.week,
                              periodStart: report.periodStart,
                              periodEnd: report.periodEnd,
                              signPlace: report.signPlace,
                              signDate: report.signDate,
                              activities: report.activities,
                              total: report.total,
                            },
                            reportProfile,
                          )
                        }
                      >
                        <Printer className="h-4 w-4" /> Cetak
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 px-0"
                        aria-label="Duplikat"
                        onClick={() => {
                          const result = duplicateWeeklyReport(report.id);
                          if (result.ok) toast.success(`Disalin menjadi ${result.report?.number}.`);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 px-0 text-danger"
                        aria-label="Hapus"
                        onClick={() => {
                          if (!confirm(`Hapus laporan ${report.number}?`)) return;
                          deleteWeeklyReport(report.id);
                          if (editingId === report.id) resetForm();
                          toast.success("Laporan dihapus.");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ActivityModal
        state={activityModal}
        onClose={() => setActivityModal((m) => ({ ...m, open: false }))}
        onChange={(patch) => setActivityModal((m) => ({ ...m, draft: { ...m.draft, ...patch } }))}
        onSubmit={submitActivity}
      />

      <ProfileModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} profileId={profileId} onSelect={setProfileId} />

      {/* Area cetak — dipasang langsung di <body> supaya hasil PDF tidak
          menyisakan halaman kosong dari layout aplikasi. */}
      {mounted && printTarget
        ? createPortal(
            <div id="report-print-area">
              <WeeklyReportDocument profile={printTarget.profile} report={printTarget.data} printedAt={printedAt} />
            </div>,
            document.body,
          )
        : null}
    </AppShell>
  );
}


/* ── Modal kegiatan ─────────────────────────────────────────────────────── */

function ActivityModal({
  state,
  onClose,
  onChange,
  onSubmit,
}: {
  state: { open: boolean; draft: WeeklyActivity; isNew: boolean };
  onClose: () => void;
  onChange: (patch: Partial<WeeklyActivity>) => void;
  onSubmit: () => void;
}) {
  const photoRef = useRef<HTMLInputElement>(null);
  const paymentRef = useRef<HTMLInputElement>(null);
  const { draft } = state;

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>, key: "photo" | "paymentProof", label: string) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      onChange({ [key]: await compressImage(file) });
      toast.success(`${label} ditambahkan.`);
    } catch {
      toast.error(`Gagal memproses ${label.toLowerCase()}.`);
    }
  }

  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={state.isNew ? "Tambah Kegiatan" : "Edit Kegiatan"}
      description="Satu baris pada tabel laporan."
      size="lg"
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <Field label="Tanggal">
          <Input type="date" value={draft.date} onChange={(e) => onChange({ date: e.target.value })} />
        </Field>
        <Field label="Umur HST" hint="Contoh: 0 HST, 7 HST, 14 HST.">
          <Input value={draft.hst} onChange={(e) => onChange({ hst: e.target.value })} placeholder="0 HST" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Jenis Kegiatan">
            <Input value={draft.activity} onChange={(e) => onChange({ activity: e.target.value })} placeholder="Persiapan & Penanaman Benih Kedelai" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Tujuan">
            <Textarea
              value={draft.purpose}
              onChange={(e) => onChange({ purpose: e.target.value })}
              placeholder="Melakukan penanaman benih kedelai sesuai jarak tanam anjuran (40 x 20 cm)"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Output">
            <Textarea
              value={draft.output}
              onChange={(e) => onChange({ output: e.target.value })}
              placeholder="Benih kedelai tertanam pada lahan seluas 0,5 ha"
            />
          </Field>
        </div>
        <Field label="Nominal (Rp)">
          <Input
            type="number"
            min={0}
            value={draft.amount || ""}
            onChange={(e) => onChange({ amount: Number(e.target.value) || 0 })}
            placeholder="0"
          />
        </Field>
        <Field label="Foto Kegiatan" hint="Otomatis dikecilkan agar hemat penyimpanan.">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
              {draft.photo ? (
                <Image src={draft.photo} alt="Foto kegiatan" width={64} height={44} className="h-full w-full object-cover" unoptimized />
              ) : (
                <ImagePlus className="h-4 w-4 text-muted" />
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e, "photo", "Foto kegiatan")} />
            <Button type="button" variant="secondary" className="h-11" onClick={() => photoRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Unggah
            </Button>
            {draft.photo && (
              <Button type="button" variant="ghost" className="h-11 w-11 px-0 text-danger" aria-label="Hapus foto" onClick={() => onChange({ photo: undefined })}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Field>
        <Field label="Bukti Pembayaran" hint="Foto nota / kwitansi. Otomatis dikecilkan.">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
              {draft.paymentProof ? (
                <Image src={draft.paymentProof} alt="Bukti pembayaran" width={64} height={44} className="h-full w-full object-cover" unoptimized />
              ) : (
                <ImagePlus className="h-4 w-4 text-muted" />
              )}
            </div>
            <input ref={paymentRef} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e, "paymentProof", "Bukti pembayaran")} />
            <Button type="button" variant="secondary" className="h-11" onClick={() => paymentRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Unggah
            </Button>
            {draft.paymentProof && (
              <Button type="button" variant="ghost" className="h-11 w-11 px-0 text-danger" aria-label="Hapus bukti pembayaran" onClick={() => onChange({ paymentProof: undefined })}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit">{state.isNew ? "Tambah Kegiatan" : "Simpan Perubahan"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Modal pengaturan format ────────────────────────────────────────────── */

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
      <span>{label}</span>
    </label>
  );
}

function ProfileModal({
  open,
  onClose,
  profileId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  profileId: string;
  onSelect: (id: string) => void;
}) {
  const profiles = useUiStore((s) => s.reportProfiles);
  const addReportProfile = useUiStore((s) => s.addReportProfile);
  const updateReportProfile = useUiStore((s) => s.updateReportProfile);
  const removeReportProfile = useUiStore((s) => s.removeReportProfile);

  const profile = profiles.find((p) => p.id === profileId) ?? profiles[0];
  const [draft, setDraft] = useState<ReportProfile | null>(profile ?? null);
  const [notesText, setNotesText] = useState(profile?.notes.join("\n") ?? "");
  const logoRef = useRef<HTMLInputElement>(null);
  const signRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const current = profiles.find((p) => p.id === profileId) ?? profiles[0] ?? null;
    setDraft(current ? { ...current } : null);
    setNotesText(current?.notes.join("\n") ?? "");
  }, [open, profileId, profiles]);

  if (!draft) return null;

  function set<K extends keyof ReportProfile>(key: K, value: ReportProfile[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  async function onImage(event: React.ChangeEvent<HTMLInputElement>, key: "logo" | "signatureImage") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      set(key, await compressImage(file));
    } catch {
      toast.error("Gagal memproses gambar.");
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    if (!draft.organization.trim()) return toast.error("Nama lembaga wajib diisi.");
    const notes = notesText
      .split("\n")
      .map((line) => line.replace(/^[•\-\s]+/, "").trim())
      .filter(Boolean);
    updateReportProfile(draft.id, {
      ...draft,
      name: draft.name.trim() || draft.organization.trim(),
      minRows: Math.max(0, Math.min(40, Number(draft.minRows) || 0)),
      notes,
    });
    toast.success("Format laporan diperbarui.");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Pengaturan Format Laporan" description="Kop surat, judul, kolom tabel, tanda tangan, dan catatan kaki." size="lg">
      <form onSubmit={submit} className="space-y-5">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <Field label="Profil Aktif">
              <Select
                value={draft.id}
                onChange={(e) => {
                  onSelect(e.target.value);
                  const next = profiles.find((p) => p.id === e.target.value);
                  if (next) {
                    setDraft({ ...next });
                    setNotesText(next.notes.join("\n"));
                  }
                }}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const created = addReportProfile({ ...blankProfile, notes: [] });
              onSelect(created.id);
              setDraft({ ...created });
              setNotesText("");
              toast.success("Profil baru dibuat.");
            }}
          >
            <Plus className="h-4 w-4" /> Profil Baru
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const created = addReportProfile({ ...draft, name: `${draft.name} (salinan)` });
              onSelect(created.id);
              setDraft({ ...created });
              toast.success("Profil diduplikasi.");
            }}
          >
            <Copy className="h-4 w-4" /> Duplikat
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-danger"
            onClick={() => {
              if (!confirm(`Hapus profil ${draft.name}?`)) return;
              const result = removeReportProfile(draft.id);
              if (!result.ok) return toast.error(result.message ?? "Gagal menghapus profil.");
              toast.success("Profil dihapus.");
              onClose();
            }}
          >
            <Trash2 className="h-4 w-4" /> Hapus
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-40 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
              {draft.logo ? (
                <Image src={draft.logo} alt="Logo" width={160} height={80} className="h-full w-full object-contain" unoptimized />
              ) : (
                <ImagePlus className="h-6 w-6 text-muted" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e, "logo")} />
              <Button type="button" variant="secondary" onClick={() => logoRef.current?.click()}>
                <ImagePlus className="h-4 w-4" /> Unggah Logo
              </Button>
              {draft.logo && (
                <button type="button" onClick={() => set("logo", "")} className="text-left text-xs text-danger">
                  Hapus logo
                </button>
              )}
            </div>
          </div>

          <Field label="Nama Profil">
            <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Warna Aksen">
            <input
              type="color"
              value={draft.accent}
              onChange={(e) => set("accent", e.target.value)}
              className="h-11 w-full cursor-pointer rounded-lg border border-border bg-background px-1"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Nama Lembaga / Yayasan">
              <Input value={draft.organization} onChange={(e) => set("organization", e.target.value)} />
            </Field>
          </div>
          <Field label="Tagline">
            <Input value={draft.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} placeholder="Strengthening Communities" />
          </Field>
          <Field label="Nama Program">
            <Input value={draft.program ?? ""} onChange={(e) => set("program", e.target.value)} placeholder="Program Pemberdayaan Pertanian" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Alamat">
              <Input value={draft.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="Jl. Contoh No. 1, Ponorogo" />
            </Field>
          </div>
          <Field label="Telp / HP">
            <Input value={draft.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={draft.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Judul Laporan">
              <Input value={draft.reportTitle} onChange={(e) => set("reportTitle", e.target.value)} />
            </Field>
          </div>
          <Field label="Label Kolom Nominal">
            <Input value={draft.currencyLabel} onChange={(e) => set("currencyLabel", e.target.value)} placeholder="Nominal (Rp)" />
          </Field>
          <Field label="Baris Kosong Minimum" hint="Baris bergaris untuk diisi manual saat dicetak; isi 0 bila tidak perlu.">
            <Input type="number" min={0} max={40} value={draft.minRows} onChange={(e) => set("minRows", Number(e.target.value) || 0)} />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Kolom & Bagian yang Ditampilkan</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Toggle label="Kolom Umur HST" checked={draft.showHst} onChange={(v) => set("showHst", v)} />
            <Toggle label="Kolom Nominal" checked={draft.showAmount} onChange={(v) => set("showAmount", v)} />
            <Toggle label="Kolom Output" checked={draft.showOutput} onChange={(v) => set("showOutput", v)} />
            <Toggle label="Kolom Foto" checked={draft.showPhoto} onChange={(v) => set("showPhoto", v)} />
            <Toggle label="Kolom Bukti Pembayaran" checked={draft.showPayment !== false} onChange={(v) => set("showPayment", v)} />
            <Toggle label="Ringkasan" checked={draft.showSummary} onChange={(v) => set("showSummary", v)} />
            <Toggle label="Keterangan Pengisian" checked={draft.showNotes} onChange={(v) => set("showNotes", v)} />
            <Toggle label="Muat Otomatis 1 Halaman" checked={draft.autoFit} onChange={(v) => set("autoFit", v)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-sm font-semibold">Blok Tanda Tangan</p>
          </div>
          <Field label="Jabatan Penanda Tangan">
            <Input value={draft.signatureRole} onChange={(e) => set("signatureRole", e.target.value)} placeholder="Pelaksana / Penyuluh" />
          </Field>
          <Field label="Nama Penanda Tangan" hint="Kosongkan untuk memakai nama pelaksana pada laporan.">
            <Input value={draft.signatureName ?? ""} onChange={(e) => set("signatureName", e.target.value)} />
          </Field>
          <Field label="NIP / ID">
            <Input value={draft.signatureId ?? ""} onChange={(e) => set("signatureId", e.target.value)} />
          </Field>
          <Field label="Tempat Default">
            <Input value={draft.signaturePlace ?? ""} onChange={(e) => set("signaturePlace", e.target.value)} placeholder="Ponorogo" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Gambar Tanda Tangan (opsional)">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
                  {draft.signatureImage ? (
                    <Image src={draft.signatureImage} alt="Tanda tangan" width={128} height={64} className="h-full w-full object-contain" unoptimized />
                  ) : (
                    <ImagePlus className="h-5 w-5 text-muted" />
                  )}
                </div>
                <input ref={signRef} type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e, "signatureImage")} />
                <Button type="button" variant="secondary" onClick={() => signRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" /> Unggah
                </Button>
                {draft.signatureImage && (
                  <button type="button" onClick={() => set("signatureImage", "")} className="text-xs text-danger">
                    Hapus
                  </button>
                )}
              </div>
            </Field>
          </div>
          <Field label="Jabatan “Mengetahui”" hint="Kosongkan bila hanya satu tanda tangan.">
            <Input value={draft.approverRole ?? ""} onChange={(e) => set("approverRole", e.target.value)} placeholder="Ketua Kelompok Tani" />
          </Field>
          <Field label="Nama “Mengetahui”">
            <Input value={draft.approverName ?? ""} onChange={(e) => set("approverName", e.target.value)} />
          </Field>
          <Field label="NIP / ID “Mengetahui”">
            <Input value={draft.approverId ?? ""} onChange={(e) => set("approverId", e.target.value)} />
          </Field>
        </div>

        <Field label="Keterangan Pengisian" hint="Satu baris = satu poin.">
          <Textarea value={notesText} onChange={(e) => setNotesText(e.target.value)} className="min-h-28" />
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit">Simpan Format</Button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Mail, Pencil, Plus, Printer, RotateCcw, Save, ShieldCheck, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { useMobileActions } from "@/components/shell/mobile-actions";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { ScaledPreview } from "@/components/ui/scaled-preview";
import { LetterDocument } from "@/components/letter/letter-document";
import { useUiStore } from "@/lib/store";
import { currency, documentFileName, formatDate, printNamed } from "@/lib/utils";
import { buildLetterSignature } from "@/lib/letter-sign";
import {
  addCalendarDays,
  letterProse,
  letterPurpose,
  letterTotal,
  linesFromInvoice,
  resolveLetterChrome,
  suggestLetterNumber,
  LETTER_PURPOSES,
} from "@/lib/letters";
import type { InvoiceSignature, LetterColumns, LetterLine, LetterPurposeId, OfficialLetter, Store } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

function nowLocalInput(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}
function isoToLocalInput(iso?: string): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return nowLocalInput();
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}
function localInputToIso(local: string): string {
  const t = Date.parse(local);
  return Number.isNaN(t) ? new Date().toISOString() : new Date(local).toISOString();
}

const emptyDraft = { name: "", unit: "Kg", quantity: "", note: "", amount: "" };

export default function LettersPage() {
  const stores = useUiStore((s) => s.stores);
  const invoices = useUiStore((s) => s.invoices);
  const letters = useUiStore((s) => s.letters);
  const createLetter = useUiStore((s) => s.createLetter);
  const updateLetter = useUiStore((s) => s.updateLetter);
  const deleteLetter = useUiStore((s) => s.deleteLetter);

  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [recipient, setRecipient] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [place, setPlace] = useState("Ponorogo");
  const [date, setDate] = useState(today());
  const [dueDate, setDueDate] = useState(addCalendarDays(today(), 7));
  const [numberOverride, setNumberOverride] = useState("");
  const [purpose, setPurpose] = useState<LetterPurposeId>("barang");
  const [heading, setHeading] = useState(letterPurpose("barang").heading);
  const [code, setCode] = useState(letterPurpose("barang").code);
  const [columns, setColumns] = useState<LetterColumns>(letterPurpose("barang").columns);
  const [totalLabel, setTotalLabel] = useState(letterPurpose("barang").totalLabel);
  const [paymentTitle, setPaymentTitle] = useState(letterPurpose("barang").paymentTitle);
  const [signOff, setSignOff] = useState(letterPurpose("barang").signOff);
  const [subject, setSubject] = useState(letterPurpose("barang").subject);
  const [reference, setReference] = useState("");
  const [opening, setOpening] = useState("");
  const [closing, setClosing] = useState("");
  const [textMode, setTextMode] = useState<"auto" | "manual">("auto");
  const [lines, setLines] = useState<LetterLine[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [bankInfo, setBankInfo] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eSign, setESign] = useState(false);
  const [signAt, setSignAt] = useState(nowLocalInput());
  const [previewSig, setPreviewSig] = useState<InvoiceSignature | undefined>(undefined);
  const [printTarget, setPrintTarget] = useState<{ store?: Store; letter: OfficialLetter } | null>(null);

  useEffect(() => {
    if (stores.length && !stores.some((s) => s.id === storeId)) setStoreId(stores[0].id);
  }, [stores, storeId]);

  const store = stores.find((s) => s.id === storeId);
  const total = useMemo(() => letterTotal(lines), [lines]);
  const suggestedNumber = suggestLetterNumber(date, letters.length, code);
  const letterNumber = numberOverride.trim() || suggestedNumber;
  const storeInvoices = invoices.filter((inv) => inv.storeId === storeId);
  const storeLetters = useMemo(() => letters.filter((letter) => letter.storeId === storeId), [letters, storeId]);
  const signerName = store?.eSignerName?.trim() || store?.signatureName?.trim() || store?.name?.trim() || "Penandatangan";
  const selectedPurpose = letterPurpose(purpose);
  const chrome = useMemo(
    () => resolveLetterChrome({ purpose, heading, code, subject, columns, totalLabel, paymentTitle, signOff }),
    [purpose, heading, code, subject, columns, totalLabel, paymentTitle, signOff],
  );

  const prose = useMemo(() => {
    const ctx = { storeName: store?.name ?? "", recipient, reference, dueDate, total };
    return letterProse(purpose, ctx);
  }, [purpose, store?.name, recipient, reference, dueDate, total]);

  useEffect(() => {
    if (textMode === "auto") {
      setOpening(prose.opening);
      setClosing(prose.closing);
    }
  }, [textMode, prose]);

  useEffect(() => {
    if (!editingId) setBankInfo(store?.bankInfo ?? "");
  }, [storeId, store?.bankInfo, editingId]);

  useEffect(() => {
    if (!editingId) setESign(Boolean(store?.eSignEnabled));
    // Default TTE mengikuti pengaturan toko, kecuali saat surat tersimpan sedang diedit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => {
    let alive = true;
    if (!eSign || lines.length === 0) {
      setPreviewSig(undefined);
      return;
    }
    buildLetterSignature(
      {
        number: letterNumber,
        storeName: store?.name ?? "",
        recipient,
        place,
        date,
        dueDate,
        subject: chrome.subject,
        reference,
        opening,
        closing,
        lines,
        total,
        purpose: chrome.id,
        heading: chrome.heading,
        code: chrome.code,
        columns: chrome.columns,
        totalLabel: chrome.totalLabel,
        paymentTitle: chrome.paymentTitle,
        signOff: chrome.signOff,
      },
      signerName,
      localInputToIso(signAt),
    ).then((signature) => {
      if (alive) setPreviewSig(signature);
    });
    return () => {
      alive = false;
    };
  }, [eSign, lines, letterNumber, recipient, place, date, dueDate, reference, opening, closing, total, chrome, store?.name, signerName, signAt]);

  const previewLetter: OfficialLetter = {
    id: editingId ?? "preview",
    kind: "penagihan",
    number: letterNumber,
    storeId,
    storeName: store?.name ?? "",
    recipient,
    recipientPhone,
    recipientAddress,
    place,
    date,
    dueDate,
    subject: chrome.subject,
    reference,
    opening,
    closing,
    lines,
    total,
    bankInfo,
    purpose: chrome.id,
    heading: chrome.heading,
    code: chrome.code,
    columns: chrome.columns,
    totalLabel: chrome.totalLabel,
    paymentTitle: chrome.paymentTitle,
    signOff: chrome.signOff,
    signature: eSign ? previewSig : undefined,
    createdAt: "",
    updatedAt: "",
  };

  function addLine() {
    const quantity = Number(draft.quantity);
    const amount = Number(draft.amount);
    if (!draft.name.trim()) return toast.error(`Isi ${chrome.columns.item.toLowerCase()}.`);
    if (!(amount >= 0) || Number.isNaN(amount)) return toast.error("Isi nilai rupiah.");
    setLines((prev) => [...prev, {
      name: draft.name.trim(),
      unit: draft.unit.trim() || "Pcs",
      quantity: quantity > 0 ? quantity : 0,
      note: draft.note.trim(),
      amount: amount || 0,
    }]);
    setDraft((d) => ({ ...emptyDraft, unit: d.unit }));
  }

  function applyInvoice(id: string) {
    setInvoiceId(id);
    const invoice = invoices.find((item) => item.id === id);
    if (!invoice) return;
    setRecipient(invoice.buyer);
    setRecipientPhone(invoice.buyerPhone ?? "");
    setReference(`Invoice ${invoice.number} tanggal ${formatDate(invoice.date)}`);
    setLines(linesFromInvoice(invoice.lines));
    setTextMode("auto");
    toast.success(`Rincian ${invoice.number} disalin ke surat. Invoice asli tidak diubah.`);
  }

  function applyChrome(next: ReturnType<typeof letterPurpose>, keepText: boolean) {
    setPurpose(next.id);
    setHeading(next.heading);
    setCode(next.code);
    setColumns(next.columns);
    setTotalLabel(next.totalLabel);
    setPaymentTitle(next.paymentTitle);
    setSignOff(next.signOff);
    setSubject(next.subject);
    setDraft((current) => (
      current.name || current.amount || current.quantity || current.note
        ? current
        : { ...emptyDraft, unit: next.unit }
    ));
    if (!keepText) setTextMode("auto");
  }

  function onPurposeChange(nextId: LetterPurposeId) {
    if (nextId === purpose) return;
    const previous = letterProse(purpose, { storeName: store?.name ?? "", recipient, reference, dueDate, total });
    const untouched = textMode === "auto" || (opening === previous.opening && closing === previous.closing);
    applyChrome(letterPurpose(nextId), !untouched);
    if (!untouched) toast.info("Label surat diganti. Teks yang sudah diubah tetap. Tekan Teks profesional bila ingin naskah baru.");
  }

  function resetForm() {
    setEditingId(null);
    setRecipient("");
    setRecipientPhone("");
    setRecipientAddress("");
    setPlace("Ponorogo");
    setDate(today());
    setDueDate(addCalendarDays(today(), 7));
    setNumberOverride("");
    applyChrome(letterPurpose("barang"), false);
    setReference("");
    setLines([]);
    setDraft({ ...emptyDraft, unit: letterPurpose("barang").unit });
    setInvoiceId("");
    setTextMode("auto");
    setBankInfo(store?.bankInfo ?? "");
    setESign(Boolean(store?.eSignEnabled));
    setSignAt(nowLocalInput());
    setPreviewSig(undefined);
  }

  async function save() {
    let signature: InvoiceSignature | undefined;
    if (eSign) {
      try {
        signature = await buildLetterSignature(
          {
            number: letterNumber,
            storeName: store?.name ?? "",
            recipient,
            place,
            date,
            dueDate,
            subject: chrome.subject,
            reference,
            opening,
            closing,
            lines,
            total,
            purpose: chrome.id,
            heading: chrome.heading,
            code: chrome.code,
            columns: chrome.columns,
            totalLabel: chrome.totalLabel,
            paymentTitle: chrome.paymentTitle,
            signOff: chrome.signOff,
          },
          signerName,
          localInputToIso(signAt),
        );
      } catch {
        return toast.error("Gagal membuat tanda tangan elektronik.");
      }
    }
    const payload = {
      storeId,
      recipient,
      recipientPhone,
      recipientAddress,
      place,
      date,
      dueDate,
      number: letterNumber,
      subject,
      reference,
      opening,
      closing,
      lines,
      bankInfo,
      purpose,
      heading,
      code,
      columns,
      totalLabel,
      paymentTitle,
      signOff,
      signature,
    };
    const result = editingId ? updateLetter(editingId, payload) : createLetter(payload);
    if (!result.ok) return toast.error(result.message ?? "Gagal menyimpan.");
    toast.success(editingId ? `Surat ${result.letter?.number} diperbarui.` : `Surat ${result.letter?.number} tersimpan.`);
    resetForm();
  }

  function startEdit(letter: OfficialLetter) {
    setEditingId(letter.id);
    setStoreId(letter.storeId);
    setRecipient(letter.recipient);
    setRecipientPhone(letter.recipientPhone ?? "");
    setRecipientAddress(letter.recipientAddress ?? "");
    setPlace(letter.place);
    setDate(letter.date);
    setDueDate(letter.dueDate ?? addCalendarDays(letter.date, 7));
    const saved = resolveLetterChrome(letter);
    setNumberOverride(letter.number);
    applyChrome(saved, true);
    setSubject(letter.subject);
    setHeading(saved.heading);
    setCode(saved.code);
    setColumns(saved.columns);
    setTotalLabel(saved.totalLabel);
    setPaymentTitle(saved.paymentTitle);
    setSignOff(saved.signOff);
    setReference(letter.reference ?? "");
    setOpening(letter.opening);
    setClosing(letter.closing);
    setTextMode("manual");
    setLines(letter.lines.map((line) => ({ ...line })));
    setBankInfo(letter.bankInfo ?? "");
    setInvoiceId("");
    setESign(Boolean(letter.signature));
    setSignAt(isoToLocalInput(letter.signature?.signedAt));
    setPreviewSig(undefined);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info(`Mengedit surat ${letter.number}.`);
  }

  function printLetter(letter: OfficialLetter, s?: Store) {
    setPrintTarget({ store: s, letter });
    const fileName = documentFileName([s?.name ?? letter.storeName, letter.number, letter.recipient], "Surat");
    setTimeout(() => printNamed(fileName), 250);
  }

  useMobileActions([
    ...(editingId ? [{ key: "cancel", label: "Batal", icon: X, variant: "secondary" as const, onClick: resetForm }] : []),
    { key: "print", label: "Cetak", icon: Printer, variant: "secondary" as const, onClick: () => printLetter(previewLetter, store), disabled: lines.length === 0 },
    { key: "save", label: editingId ? "Perbarui" : "Simpan", icon: Save, variant: "primary" as const, onClick: save, disabled: lines.length === 0 },
  ]);

  if (stores.length === 0) {
    return (
      <AppShell>
        <PageHeader eyebrow="Penjualan" title="Surat" description="Buat surat resmi dengan kop toko." />
        <EmptyState icon={Mail} title="Belum ada toko" description="Tambahkan toko dulu di menu Toko sebelum membuat surat." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Penjualan"
        title="Surat"
        description="Pilih maksud surat, lalu ubah judul, teks, dan kolom tabel. Cocok untuk hutang barang, kasbon, gaji, atau pembayaran ke perusahaan. Simpan atau cetak sebagai PDF."
      />

      <section className="no-print mb-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <StatCard label="Surat Toko Ini" value={storeLetters.length} icon={Mail} />
        <StatCard label="Nilai Surat" value={currency.format(storeLetters.reduce((sum, letter) => sum + letter.total, 0))} icon={Mail} tone="primary" />
        <StatCard label="Judul Surat" value={chrome.heading} icon={FileText} tone="amber" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="no-print min-w-0 space-y-4">
          {editingId && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 font-semibold text-primary">
                <Pencil className="h-4 w-4" /> Mengedit surat {numberOverride || "tersimpan"}
              </span>
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-danger">
                <X className="h-3.5 w-3.5" /> Batal
              </button>
            </div>
          )}

          <Card>
            <CardHeader><h2 className="font-semibold">Data Surat</h2></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Maksud Surat" hint={selectedPurpose.hint}>
                <Select value={purpose} onChange={(e) => onPurposeChange(e.target.value as LetterPurposeId)}>
                  {LETTER_PURPOSES.map((item) => (<option key={item.id} value={item.id}>{item.label}</option>))}
                </Select>
              </Field>
              <Field label="Toko (kop surat)">
                <Select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
                  {stores.map((item) => (<option key={item.id} value={item.id}>{item.name}</option>))}
                </Select>
              </Field>
              <Field label="Salin dari Invoice" hint="Hanya menyalin penerima dan rincian. Invoice yang tersimpan tidak berubah.">
                <Select value={invoiceId} onChange={(e) => applyInvoice(e.target.value)}>
                  <option value="">Tidak disalin</option>
                  {storeInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>{inv.number} · {inv.buyer} · {currency.format(inv.total)}</option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nomor Surat"><Input value={numberOverride} onChange={(e) => setNumberOverride(e.target.value)} placeholder={suggestedNumber} /></Field>
                <Field label="Tempat"><Input value={place} onChange={(e) => setPlace(e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tanggal Surat"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
                <Field label="Jatuh Tempo"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
              </div>
              <Field label="Perihal"><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
              <Field label="Penerima"><Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="SPPG NGRAKET BALONG" /></Field>
              <Field label="Telepon Penerima"><Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="0812…" /></Field>
              <Field label="Alamat Penerima"><Textarea value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder="Alamat lengkap, bila perlu" /></Field>
              <Field label="Referensi"><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Invoice INV0007 tanggal 1 Oktober 2026" /></Field>
              <Field label="Rekening Pembayaran" hint={selectedPurpose.paymentHint}><Input value={bankInfo} onChange={(e) => setBankInfo(e.target.value)} placeholder={store?.bankInfo || "BNI … a.n. …"} /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Label di Kertas</h2></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted">Pilihan maksud mengisi label ini. Setelah itu setiap tulisan bisa diganti, termasuk judul kolom supaya tidak harus tertulis barang.</p>
              <Field label="Judul surat"><Input value={heading} onChange={(e) => setHeading(e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kode nomor"><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SPH" /></Field>
                <Field label="Tulisan total"><Input value={totalLabel} onChange={(e) => setTotalLabel(e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kolom uraian"><Input value={columns.item} onChange={(e) => setColumns((current) => ({ ...current, item: e.target.value }))} /></Field>
                <Field label="Kolom jumlah"><Input value={columns.quantity} onChange={(e) => setColumns((current) => ({ ...current, quantity: e.target.value }))} /></Field>
                <Field label="Kolom keterangan"><Input value={columns.note} onChange={(e) => setColumns((current) => ({ ...current, note: e.target.value }))} /></Field>
                <Field label="Kolom rupiah"><Input value={columns.amount} onChange={(e) => setColumns((current) => ({ ...current, amount: e.target.value }))} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Judul pembayaran"><Input value={paymentTitle} onChange={(e) => setPaymentTitle(e.target.value)} /></Field>
                <Field label="Salam penutup"><Input value={signOff} onChange={(e) => setSignOff(e.target.value)} /></Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Teks Surat</h2>
              <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => setTextMode("auto")}>
                <RotateCcw className="h-3.5 w-3.5" /> Teks profesional
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Teks sebelum tabel" hint="Bagian ini tampil di atas tabel rincian.">
                <Textarea value={opening} onChange={(e) => { setTextMode("manual"); setOpening(e.target.value); }} className="min-h-36" />
              </Field>
              <Field label="Teks sesudah tabel" hint="Nominal, batas waktu, dan kalimat penutup. Bisa diubah bebas.">
                <Textarea value={closing} onChange={(e) => { setTextMode("manual"); setClosing(e.target.value); }} className="min-h-44" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Rincian</h2></CardHeader>
            <CardContent className="space-y-3">
              <Field label={chrome.columns.item}><Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder={selectedPurpose.itemPlaceholder} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label={chrome.columns.quantity}><Input type="number" min={0} step="any" value={draft.quantity} onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))} /></Field>
                <Field label="Satuan"><Input value={draft.unit} onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))} /></Field>
              </div>
              <Field label={chrome.columns.note}><Input value={draft.note} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} placeholder="Opsional" /></Field>
              <Field label={chrome.columns.amount}><Input type="number" min={0} value={draft.amount} onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))} /></Field>
              <Button type="button" variant="secondary" className="w-full" onClick={addLine}><Plus className="h-4 w-4" /> Tambah baris</Button>

              {lines.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {lines.map((line, index) => (
                    <div key={`${line.name}-${index}`} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{line.name}</p>
                          <p className="text-xs text-muted">{line.quantity} {line.unit}{line.note ? ` · ${line.note}` : ""}</p>
                        </div>
                        <span className="shrink-0 font-semibold">{currency.format(line.amount)}</span>
                        <button type="button" className="text-danger" aria-label={`Hapus ${line.name}`} onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <span className="text-muted">{chrome.totalLabel}</span>
                <span className="text-lg font-bold">{currency.format(total)}</span>
              </div>
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={eSign}
                  onChange={(e) => setESign(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Tanda Tangan Elektronik
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Menambahkan QR verifikasi dan hash SHA-256 pada surat, sama seperti invoice.
                    {eSign && <> Penandatangan: <span className="font-medium text-foreground">{signerName}</span>.</>}
                  </span>
                </span>
              </label>
              {eSign && (
                <Field label="Tanggal & Waktu Tanda Tangan" hint="Bisa diatur. Waktu ini tercetak di surat, isi surat yang menentukan hash.">
                  <div className="flex items-center gap-2">
                    <Input type="datetime-local" value={signAt} onChange={(e) => setSignAt(e.target.value || nowLocalInput())} />
                    <Button type="button" variant="secondary" className="h-11 shrink-0 whitespace-nowrap px-3" onClick={() => setSignAt(nowLocalInput())}>
                      Sekarang
                    </Button>
                  </div>
                </Field>
              )}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={save} disabled={lines.length === 0}><Save className="h-4 w-4" /> {editingId ? "Perbarui" : "Simpan"}</Button>
                <Button variant="secondary" onClick={() => printLetter(previewLetter, store)} disabled={lines.length === 0}><Printer className="h-4 w-4" /> Cetak</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="no-print min-w-0">
          <Card className="bg-slate-100 p-3 sm:p-4 lg:sticky lg:top-20 dark:bg-slate-900">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted sm:mb-3">Pratinjau surat</p>
            <ScaledPreview baseWidth={800}>
              <div className="shadow-lg"><LetterDocument store={store} letter={previewLetter} /></div>
            </ScaledPreview>
          </Card>
        </div>
      </div>

      <div className="no-print mt-6">
        <h2 className="mb-1 text-lg font-bold">Riwayat Surat · {store?.name}</h2>
        <p className="mb-3 text-sm text-muted">Menampilkan surat toko yang sedang dipilih. Ganti toko di formulir untuk melihat riwayat toko lain.</p>
        {storeLetters.length === 0 ? (
          <EmptyState icon={Mail} title={`Belum ada surat untuk ${store?.name ?? "toko ini"}`} description="Surat toko yang dipilih akan muncul di sini dan ikut tersinkron ke server." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {storeLetters.map((letter) => {
              const savedStore = stores.find((item) => item.id === letter.storeId);
              return (
                <Card key={letter.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-bold">{letter.number}</p>
                        <p className="truncate text-sm text-muted">{letter.recipient}</p>
                        <p className="truncate text-xs text-muted">{letter.heading || "Surat Penagihan"} · {letter.subject}</p>
                        <p className="text-xs text-muted">{letter.storeName} · {formatDate(letter.date)}</p>
                      </div>
                      <span className="shrink-0 font-bold">{currency.format(letter.total)}</span>
                    </div>
                    {letter.signature && (
                      <p className="mt-2 inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                        <ShieldCheck className="h-3 w-3" /> TTE {letter.signature.code}
                      </p>
                    )}
                    <div className="mt-3 flex justify-end gap-1">
                      <Button variant="secondary" className="h-8" onClick={() => startEdit(letter)}><Pencil className="h-4 w-4" /> Edit</Button>
                      <Button variant="secondary" className="h-8" onClick={() => printLetter(letter, savedStore)}><Printer className="h-4 w-4" /> Cetak</Button>
                      <Button variant="ghost" className="h-8 w-8 px-0 text-danger" aria-label="Hapus" onClick={() => { if (confirm(`Hapus surat ${letter.number}?`)) { deleteLetter(letter.id); toast.success("Surat dihapus."); if (editingId === letter.id) resetForm(); } }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {printTarget && (
        <div id="print-area">
          <LetterDocument store={printTarget.store} letter={printTarget.letter} />
        </div>
      )}
    </AppShell>
  );
}

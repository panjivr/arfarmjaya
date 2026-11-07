"use client";

import { useState } from "react";
import { Check, ChevronDown, LayoutTemplate, Search } from "lucide-react";
import type { InvoiceDesign } from "@/lib/types";
import { applyInvoiceTemplate, getInvoiceTemplate, INVOICE_TEMPLATES, INVOICE_TEMPLATE_CATEGORIES, type InvoiceTemplate } from "@/lib/invoice-templates";
import { Input, Select } from "@/components/ui/field";

/** Lightweight layout diagrams; actual invoice data stays in the live preview. */
export function InvoiceTemplateThumbnail({ template: t }: { template: InvoiceTemplate }) {
  const c = t.colors;
  const centered = ["center", "seal", "docket"].includes(t.header);
  const inverse = ["banner", "duplex"].includes(t.header);
  const ink = t.header === "banner" ? c.headingText : c.brand;
  const headingY = t.header === "stacked" ? 22 : 44;
  const tableY = t.flow === "standard" ? 110 : 126;
  const rowHeight = t.density === "compact" ? 7 : t.density === "airy" ? 11 : 9;
  const totalsY = tableY + 10 + rowHeight * 4 + 8;
  const totalX = t.totals === "left" ? 12 : t.totals === "full" || t.totals === "split" ? 12 : 96;
  const totalWidth = t.totals === "full" || t.totals === "split" ? 156 : 72;
  return <svg viewBox="0 0 180 248" className="block h-auto w-full bg-white" aria-hidden="true" focusable="false">
    <rect x="0.5" y="0.5" width="179" height="247" rx="3" fill="white" stroke="#e2e8f0" />
    {inverse && <rect x={t.header === "banner" ? 1 : 112} y="1" width={t.header === "banner" ? 178 : 67} height="61" fill={c.brand} />}
    {t.header === "rail" && <rect x="12" y="12" width="5" height="45" fill={c.brand} />}
    {t.header === "frame" && <rect x="11" y="11" width="158" height="49" fill="none" stroke={c.brand} />}
    {centered ? <><rect x="81" y="10" width="18" height="13" rx="2" fill={c.alternateRow} stroke={c.brand} /><text x="90" y="32" textAnchor="middle" fontSize="7" fontWeight="bold" fill={c.brand}>TOKO ANDA</text><text x="90" y="53" textAnchor="middle" fontSize="10" letterSpacing="2" fill={c.heading}>INVOICE</text></> : <>
      <rect x={t.header === "reverse" || t.header === "corner" ? 144 : 18} y={t.header === "stacked" || t.header === "editorial" ? 39 : 17} width="17" height="13" rx="2" fill="white" stroke={inverse ? "white" : c.brand} />
      <text x={t.header === "reverse" || t.header === "corner" ? 106 : 40} y={t.header === "stacked" || t.header === "editorial" ? 49 : 23} fontSize="7" textAnchor={t.header === "reverse" || t.header === "corner" ? "middle" : "start"} fontWeight="bold" fill={ink}>TOKO ANDA</text>
      <text x={t.header === "corner" || t.header === "reverse" || t.header === "editorial" ? 12 : 165} y={t.header === "editorial" ? 27 : headingY} fontSize={t.header === "editorial" || t.header === "corner" ? 16 : 10} textAnchor={t.header === "corner" || t.header === "reverse" || t.header === "editorial" ? "start" : "end"} fontWeight="bold" fill={t.header === "duplex" ? c.headingText : ink}>INVOICE</text>
    </>}
    {t.header === "badge" && <rect x="114" y="48" width="50" height="9" rx="3" fill={c.alternateRow} stroke={c.brand} />}
    {t.header === "ribbon" ? <rect x="12" y="57" width="156" height="5" fill={c.brand} /> : <line x1="12" x2="168" y1="64" y2="64" stroke={c.brand} strokeWidth={t.header === "mono" ? 2 : 0.7} />}
    {t.metadata === "cards" && <><rect x="12" y="72" width="82" height="29" rx="3" fill={c.alternateRow} /><rect x="99" y="72" width="69" height="29" rx="3" fill="none" stroke={c.border} /></>}
    {[0, 1, 2].map((i) => <g key={i}><rect x="17" y={76 + i * 7} width={i === 0 ? 54 : 62} height="2" fill={i === 0 ? c.detail : c.border} /><rect x="110" y={76 + i * 7} width="50" height="2" fill={c.border} /></g>)}
    {t.metadata === "strip" && <line x1="12" x2="168" y1="99" y2="99" stroke={c.border} />}
    {t.flow !== "standard" && <rect x="12" y="107" width="156" height="12" rx="2" fill={c.alternateRow} stroke={t.flow === "summary-first" ? c.brand : c.border} />}
    <rect x="12" y={tableY} width="156" height="9" fill={c.tableHeader} stroke={c.border} strokeWidth="0.3" />
    {[0, 1, 2, 3].map((i) => <g key={i}>
      <rect x="12" y={tableY + 9 + i * rowHeight} width="156" height={rowHeight} fill={(t.table === "striped" || t.table === "grid") && i % 2 ? c.alternateRow : "white"} stroke={t.table === "grid" ? c.border : "none"} strokeWidth="0.4" />
      <rect x="18" y={tableY + 12 + i * rowHeight} width={50 + i * 3} height="2" fill={c.border} /><rect x="136" y={tableY + 12 + i * rowHeight} width="25" height="2" fill={c.border} />
      {t.table === "rules" && <line x1="12" x2="168" y1={tableY + 9 + (i + 1) * rowHeight} y2={tableY + 9 + (i + 1) * rowHeight} stroke={c.border} strokeWidth="0.4" />}
    </g>)}
    <rect x={totalX} y={totalsY} width={totalWidth} height="12" rx={t.totals === "box" ? 3 : 0} fill={c.total} />
    <rect x={t.closing === "reverse" ? 112 : 12} y="218" width="50" height="2" fill={c.border} /><rect x={t.closing === "center" ? 68 : t.closing === "reverse" ? 15 : 123} y="229" width="42" height="1" fill={c.brand} />
  </svg>;
}

export function InvoiceTemplateGallery({ value, onChange }: { value: InvoiceDesign; onChange: (design: InvoiceDesign) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const selected = getInvoiceTemplate(value.templateId);
  const matches = INVOICE_TEMPLATES.filter((item) => (category === "Semua" || item.category === category) && `${item.name} ${item.category} ${item.description}`.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID")));
  return <details className="group/template rounded-2xl border border-border bg-background" data-template-gallery>
    <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
      <span className="rounded-xl bg-primary/10 p-2 text-primary"><LayoutTemplate className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-bold">Pilih template invoice</span><span className="mt-0.5 block text-xs text-muted">{selected ? `${selected.name} · ${selected.category}` : `Desain ${value.layout === "modern" ? "modern" : "klasik"} sebelumnya`}</span></span>
      <span className="shrink-0 rounded-full bg-card px-2.5 py-1 text-xs font-bold text-primary">{INVOICE_TEMPLATES.length} pilihan</span><ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open/template:rotate-180" />
    </summary>
    <div className="border-t border-border p-3 sm:p-4">
      <p className="mb-3 text-xs leading-relaxed text-muted">Pilih komposisi kop, tipografi, tabel, dan ringkasan. Template menerapkan palet awal; warna, logo, dan detail tetap bisa diatur lagi. Data toko dan transaksi tetap tersimpan.</p>
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_130px]">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" /><Input aria-label="Cari template invoice" className="pl-9" placeholder="Cari nama atau gaya…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }} /></div>
        <Select aria-label="Kategori template invoice" value={category} onChange={(e) => setCategory(e.target.value)}><option value="Semua">Semua gaya</option>{INVOICE_TEMPLATE_CATEGORIES.map((group) => <option key={group}>{group}</option>)}</Select>
      </div>
      <p className="mb-2 text-xs text-muted" aria-live="polite">{matches.length} template tersedia{selected ? ` · Terpilih: ${selected.name}` : ""}</p>
      <div className="grid max-h-[470px] grid-cols-2 gap-3 overflow-y-auto p-1" aria-label="Galeri template invoice">
        {matches.map((item) => <button type="button" key={item.id} aria-pressed={selected?.id === item.id} aria-label={`Gunakan template ${item.name}`} onClick={() => { if (item.id !== value.templateId) onChange(applyInvoiceTemplate(value, item.id)); }} className={`group overflow-hidden rounded-xl border-2 bg-white text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected?.id === item.id ? "border-primary shadow-sm" : "border-transparent hover:border-primary/40"}`}>
          <InvoiceTemplateThumbnail template={item} />
          <span className="block border-t border-slate-100 p-2.5"><span className="flex items-center justify-between gap-1 text-xs font-bold text-slate-900">{item.name}{selected?.id === item.id && <Check className="h-4 w-4 text-emerald-700" />}</span><span className="mt-0.5 block text-[10px] text-slate-500">{item.category}</span></span>
        </button>)}
      </div>
      {matches.length === 0 && <p className="py-6 text-center text-sm text-muted">Template tidak ditemukan. Coba nama atau kategori lain.</p>}
      {selected && <p className="mt-3 rounded-lg border border-border bg-card p-3 text-xs leading-relaxed"><strong>{selected.name}:</strong> {selected.description}</p>}
    </div>
  </details>;
}

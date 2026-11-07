"use client";

import { InvoiceTemplateGallery } from "./invoice-template-gallery";
import { applyInvoiceTemplate, getInvoiceTemplate, INVOICE_TEMPLATES } from "@/lib/invoice-templates";
import type { InvoiceColors, InvoiceDesign } from "@/lib/types";
import { INVOICE_COLOR_LABELS, INVOICE_VISIBILITY_LABELS, contrastRatio, resolveInvoiceDesign } from "@/lib/invoice-design";
import { Field, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function InvoiceDesignEditor({ value, accent, onChange }: { value: InvoiceDesign; accent: string; onChange: (design: InvoiceDesign) => void }) {
  const selectedTemplate = getInvoiceTemplate(value.templateId);
  const changeColor = (key: keyof InvoiceColors, color: string) => onChange({ ...value, colors: { ...value.colors, [key]: color } });
  const poorContrast = contrastRatio(value.colors.tableHeader, value.colors.tableHeaderText) < 4.5 || contrastRatio(value.colors.total, value.colors.totalText) < 4.5;
  return (
    <div className="space-y-5">
      <InvoiceTemplateGallery value={value} onChange={onChange} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Susunan invoice">
          <Select aria-label="Susunan invoice" value={value.templateId ?? value.layout} onChange={(e) => {
            const chosen = e.target.value;
            if (chosen === "classic" || chosen === "modern") onChange({ ...value, templateId: undefined, layout: chosen });
            else onChange(applyInvoiceTemplate(value, chosen));
          }}>
            <option value="classic">Klasik · seperti referensi</option>
            <option value="modern">Modern · judul di kanan</option>
            <optgroup label="Template baru">{INVOICE_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.category}</option>)}</optgroup>
          </Select>
        </Field>
        <Field label={`Ukuran logo · ${value.logoWidth} px`} hint="Proporsi gambar tetap terjaga.">
          <input aria-label="Ukuran logo" type="range" min={40} max={180} step={5} value={value.logoWidth} onChange={(e) => onChange({ ...value, logoWidth: Number(e.target.value) })} className="h-11 w-full accent-[var(--primary)]" />
        </Field>
      </div>
      <fieldset>
        <legend className="text-sm font-bold">Warna per bagian</legend>
        <p className="mb-3 mt-1 text-xs text-muted">Setiap warna berdiri sendiri. Perubahan langsung terlihat di pratinjau.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.entries(INVOICE_COLOR_LABELS) as [keyof InvoiceColors, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium">
              {label}
              <input aria-label={`Warna ${label.toLowerCase()}`} type="color" value={value.colors[key]} onChange={(e) => changeColor(key, e.target.value)} className="h-8 w-12 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5" />
            </label>
          ))}
        </div>
        {poorContrast && <p role="status" className="mt-2 text-xs text-amber-700">Warna teks dan latar tabel atau total terlalu mirip. Pilih warna yang lebih kontras agar mudah dibaca.</p>}
        <Button type="button" variant="secondary" className="mt-3 h-9 text-xs" onClick={() => onChange({ ...value, colors: selectedTemplate ? { ...selectedTemplate.colors } : resolveInvoiceDesign({ accent }).colors })}>{selectedTemplate ? "Pulihkan warna template" : "Atur ulang warna ke aksen toko"}</Button>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-bold">Bagian yang ditampilkan</legend>
        <p className="mb-3 mt-1 text-xs text-muted">Nama toko, nomor, tanggal, pembeli, nama barang, jumlah, dan total tagihan selalu tampil. Ongkir/diskon bernilai tetap tampil agar perhitungan jelas. QR tetap tampil jika invoice ditandatangani.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(INVOICE_VISIBILITY_LABELS).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={value.visible[key as keyof typeof value.visible]} onChange={(e) => onChange({ ...value, visible: { ...value.visible, [key]: e.target.checked } })} />{label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

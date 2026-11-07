import { getInvoiceTemplate } from "./invoice-templates";
import type { InvoiceColors, InvoiceDesign, InvoiceSeller, InvoiceVisibility } from "./types";

export const INVOICE_COLOR_LABELS: Record<keyof InvoiceColors, string> = {
  brand: "Nama toko & garis kop", tagline: "Tagline", heading: "Latar / judul invoice", headingText: "Teks bilah invoice",
  text: "Teks utama", detail: "Isi rincian & nilai", muted: "Label & kontak", border: "Garis tabel",
  tableHeader: "Latar kepala tabel", tableHeaderText: "Teks kepala tabel",
  alternateRow: "Latar baris selang-seling", total: "Latar total tagihan", totalText: "Teks total tagihan", footer: "Ucapan penutup",
};

export const INVOICE_VISIBILITY_LABELS: Record<keyof InvoiceVisibility, string> = {
  logo: "Logo toko", tagline: "Tagline", storeAddress: "Alamat toko", storePhone: "Telepon / WA toko",
  storeEmail: "Email toko", buyerAddress: "Alamat pembeli", buyerPhone: "Telepon pembeli", dueDate: "Jatuh tempo",
  rowNumber: "Nomor urut barang", unit: "Kolom satuan", price: "Kolom harga satuan", subtotal: "Subtotal",
  shipping: "Ongkos kirim", discount: "Diskon", payment: "Informasi pembayaran", terbilang: "Terbilang",
  signature: "Blok tanda tangan", note: "Catatan invoice", footer: "Ucapan penutup",
};

const hex = (value: unknown, fallback: string) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;

/** Isi toko lama tetap dapat dicetak, termasuk bila cadangan belum punya desain. */
export function resolveInvoiceDesign(store?: Pick<InvoiceSeller, "accent" | "invoiceDesign">): InvoiceDesign {
  const accent = hex(store?.accent, "#166534");
  const colors: InvoiceColors = {
    brand: accent, tagline: "#a16207", heading: accent, headingText: "#ffffff", text: "#1e293b", detail: "#334155", muted: "#64748b",
    border: "#cbd5e1", tableHeader: accent, tableHeaderText: "#ffffff", alternateRow: "#f0f7f0",
    total: accent, totalText: "#ffffff", footer: accent,
  };
  const raw = store?.invoiceDesign;
  const preset = getInvoiceTemplate(raw?.templateId);
  if (preset) Object.assign(colors, preset.colors);
  const visible = Object.fromEntries(Object.keys(INVOICE_VISIBILITY_LABELS).map((key) => [key, true])) as InvoiceVisibility;
  for (const key of Object.keys(colors) as (keyof InvoiceColors)[]) colors[key] = hex(raw?.colors?.[key], colors[key]);
  for (const key of Object.keys(visible) as (keyof InvoiceVisibility)[]) {
    if (typeof raw?.visible?.[key] === "boolean") visible[key] = raw.visible[key];
  }
  return {
    ...(preset ? { templateId: preset.id } : {}),
    layout: raw?.layout === "modern" ? "modern" : "classic",
    logoWidth: typeof raw?.logoWidth === "number" && Number.isFinite(raw.logoWidth) ? Math.max(40, Math.min(180, raw.logoWidth)) : 100,
    colors, visible,
  };
}

export function snapshotInvoiceSeller(store: InvoiceSeller): InvoiceSeller {
  // Explicit fields avoid copying the catalog, IDs, or unrelated future data.
  return JSON.parse(JSON.stringify({
    name: store.name, address: store.address, phone: store.phone, email: store.email, logo: store.logo,
    bankInfo: store.bankInfo, invoicePrefix: store.invoicePrefix, signatureName: store.signatureName,
    note: store.note, accent: store.accent, tagline: store.tagline, paymentMethod: store.paymentMethod,
    footerText: store.footerText, eSignEnabled: store.eSignEnabled, eSignerName: store.eSignerName,
    invoiceDesign: resolveInvoiceDesign(store),
  })) as InvoiceSeller;
}

export function contrastRatio(a: string, b: string): number {
  const luminance = (color: string) => {
    const rgb = color.slice(1).match(/../g)!.map((v) => parseInt(v, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

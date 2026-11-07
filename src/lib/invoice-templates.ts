import type { InvoiceColors, InvoiceDesign } from "./types";

export type InvoiceHeader = "split" | "center" | "banner" | "rail" | "editorial" | "letterhead" | "stacked" | "corner" | "frame" | "ribbon" | "seal" | "mono" | "docket" | "reverse" | "badge" | "duplex";
export type InvoiceTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  header: InvoiceHeader;
  metadata: "split" | "cards" | "strip" | "stacked";
  table: "grid" | "rules" | "clean" | "striped";
  totals: "right" | "left" | "full" | "box" | "split";
  closing: "columns" | "stacked" | "center" | "reverse";
  flow: "standard" | "summary-first" | "payment-first";
  font: "sans" | "serif" | "mono" | "geometric";
  density: "compact" | "normal" | "airy";
  colors: InvoiceColors;
  logoWidth: number;
};

type Composition = Pick<InvoiceTemplate, "header" | "metadata" | "table" | "totals" | "closing" | "flow" | "font" | "density">;

function template(id: string, name: string, category: string, description: string, composition: Composition, brand: string, tint: string, highlight = brand): InvoiceTemplate {
  const lightHeader = composition.table === "clean" || composition.table === "rules";
  return {
    id: `${id}-v1`, name, category, description, ...composition,
    logoWidth: composition.header === "seal" || composition.header === "center" ? 76 : 90,
    colors: {
      brand, tagline: highlight, heading: brand, headingText: "#ffffff", text: "#172033", detail: "#334155", muted: "#64748b",
      border: "#d8dfe7", tableHeader: lightHeader ? "#ffffff" : brand, tableHeaderText: lightHeader ? brand : "#ffffff",
      alternateRow: tint, total: brand, totalText: "#ffffff", footer: highlight,
    },
  };
}

// Versioned IDs are part of saved invoice identity. Keep v1 compositions stable;
// future redesigns must get new IDs so previously issued documents do not drift.
export const INVOICE_TEMPLATES: readonly InvoiceTemplate[] = [
  template("atlas", "Atlas", "Korporat", "Kop dua sisi, identitas penerima dalam kartu, total tegas di kanan.", { header: "split", metadata: "cards", table: "grid", totals: "box", closing: "columns", flow: "standard", font: "sans", density: "normal" }, "#163b63", "#f0f5fa"),
  template("boardroom", "Boardroom", "Korporat", "Kop surat formal, tabel bergaris, dan ringkasan tagihan selebar kertas.", { header: "letterhead", metadata: "strip", table: "rules", totals: "full", closing: "reverse", flow: "standard", font: "serif", density: "compact" }, "#243746", "#f4f6f7"),
  template("executive", "Executive", "Korporat", "Panel kop terpisah dengan nilai tagihan muncul sebelum rincian.", { header: "duplex", metadata: "split", table: "clean", totals: "right", closing: "columns", flow: "summary-first", font: "geometric", density: "airy" }, "#233876", "#f1f3fa"),
  template("meridian", "Meridian", "Korporat", "Kop berbingkai, informasi vertikal, dan total di kiri.", { header: "frame", metadata: "stacked", table: "grid", totals: "left", closing: "stacked", flow: "standard", font: "sans", density: "normal" }, "#28534c", "#f0f7f5"),
  template("flux", "Flux", "Digital", "Banner penuh, data pelanggan dalam kartu, dan tabel bersih.", { header: "banner", metadata: "cards", table: "clean", totals: "box", closing: "columns", flow: "standard", font: "geometric", density: "normal" }, "#49328c", "#f5f2fc"),
  template("cloud", "Cloud", "Digital", "Identitas rata kanan, ringkasan di atas, dan total melebar.", { header: "reverse", metadata: "strip", table: "rules", totals: "full", closing: "stacked", flow: "summary-first", font: "sans", density: "airy" }, "#155e75", "#eff8fb"),
  template("pulse", "Pulse", "Digital", "Badge nominal pada kop, baris berselang, penutup berpusat.", { header: "badge", metadata: "split", table: "striped", totals: "split", closing: "center", flow: "standard", font: "geometric", density: "normal" }, "#274f82", "#edf4fc"),
  template("orbit", "Orbit", "Digital", "Kop terpusat dan panel pembayaran mendahului rincian.", { header: "center", metadata: "cards", table: "rules", totals: "right", closing: "reverse", flow: "payment-first", font: "sans", density: "compact" }, "#684176", "#f8f2fa"),
  template("mono", "Mono", "Minimal", "Tipografi mesin tik, garis tipis, dan total di sisi kiri.", { header: "mono", metadata: "strip", table: "rules", totals: "left", closing: "stacked", flow: "standard", font: "mono", density: "compact" }, "#27272a", "#f6f6f6"),
  template("whitespace", "Whitespace", "Minimal", "Judul lapang, tabel tanpa bingkai, dan ringkasan ringan.", { header: "corner", metadata: "split", table: "clean", totals: "right", closing: "columns", flow: "standard", font: "sans", density: "airy" }, "#334155", "#f8fafc"),
  template("gridline", "Gridline", "Minimal", "Judul berbingkai dan struktur grid yang mudah dipindai.", { header: "frame", metadata: "cards", table: "grid", totals: "full", closing: "reverse", flow: "standard", font: "mono", density: "normal" }, "#3f4652", "#f4f5f7"),
  template("plain", "Plain", "Minimal", "Judul di atas identitas, ringkasan awal, dan tabel ringkas.", { header: "stacked", metadata: "stacked", table: "clean", totals: "split", closing: "stacked", flow: "summary-first", font: "sans", density: "compact" }, "#44403c", "#faf9f6"),
  template("studio", "Studio", "Kreatif", "Judul editorial besar dan ringkasan nominal selebar halaman.", { header: "editorial", metadata: "split", table: "clean", totals: "full", closing: "columns", flow: "standard", font: "serif", density: "airy" }, "#7c3638", "#fcf4f2"),
  template("canvas", "Canvas", "Kreatif", "Pita judul berwarna, kartu pelanggan, dan total di kiri.", { header: "ribbon", metadata: "cards", table: "striped", totals: "left", closing: "center", flow: "standard", font: "geometric", density: "normal" }, "#9a4c23", "#fff7ed"),
  template("portfolio", "Portfolio", "Kreatif", "Komposisi asimetris, pembayaran di awal, dan penutup terbalik.", { header: "rail", metadata: "stacked", table: "rules", totals: "box", closing: "reverse", flow: "payment-first", font: "sans", density: "airy" }, "#345d52", "#f1f8f3"),
  template("folio", "Folio", "Kreatif", "Judul di sudut dengan total awal dan huruf bergaya editorial.", { header: "corner", metadata: "strip", table: "rules", totals: "split", closing: "stacked", flow: "summary-first", font: "serif", density: "normal" }, "#51426c", "#f7f4fb"),
  template("counter", "Counter", "Retail", "Kop kasir terpusat, rincian padat, dan total penuh.", { header: "docket", metadata: "strip", table: "striped", totals: "full", closing: "center", flow: "standard", font: "mono", density: "compact" }, "#285c42", "#f0f8f2"),
  template("boutique", "Boutique", "Retail", "Logo terpusat, huruf serif, dan penutup personal.", { header: "seal", metadata: "cards", table: "clean", totals: "box", closing: "center", flow: "standard", font: "serif", density: "normal" }, "#7b4658", "#fcf4f7"),
  template("market", "Market", "Retail", "Banner toko, rincian berkotak, dan ringkasan transaksi di kanan.", { header: "banner", metadata: "strip", table: "grid", totals: "right", closing: "columns", flow: "standard", font: "sans", density: "compact" }, "#246242", "#eff8f1"),
  template("receipt", "Receipt", "Retail", "Kop dua sisi bergaya struk dan ringkasan pembayaran di kiri.", { header: "mono", metadata: "stacked", table: "striped", totals: "left", closing: "center", flow: "payment-first", font: "mono", density: "normal" }, "#4a4b34", "#f8f8ef"),
  template("ledger", "Ledger", "Grosir", "Buku dagang formal dengan tabel berkotak dan subtotal berjenjang.", { header: "letterhead", metadata: "split", table: "grid", totals: "split", closing: "columns", flow: "standard", font: "sans", density: "compact" }, "#1f514a", "#eef7f5"),
  template("supply", "Supply", "Grosir", "Kop beraksen samping, kartu pelanggan, serta total dalam panel.", { header: "rail", metadata: "cards", table: "grid", totals: "box", closing: "stacked", flow: "standard", font: "geometric", density: "normal" }, "#274b6b", "#f0f6fa"),
  template("dispatch", "Dispatch", "Grosir", "Panel identitas dan dokumen dipisah, pembayaran di atas rincian.", { header: "duplex", metadata: "strip", table: "striped", totals: "full", closing: "reverse", flow: "payment-first", font: "sans", density: "compact" }, "#784f24", "#fbf6ef"),
  template("warehouse", "Warehouse", "Grosir", "Kop terbalik dan ringkasan awal untuk invoice barang dalam jumlah besar.", { header: "reverse", metadata: "stacked", table: "grid", totals: "right", closing: "columns", flow: "summary-first", font: "mono", density: "compact" }, "#37475b", "#f1f5f9"),
  template("consultant", "Consultant", "Jasa", "Kop surat bersih dan penutup vertikal untuk penagihan jasa.", { header: "split", metadata: "stacked", table: "rules", totals: "left", closing: "stacked", flow: "standard", font: "serif", density: "airy" }, "#294f71", "#f1f7fb"),
  template("project", "Project", "Jasa", "Judul editorial, identitas dalam kartu, serta ringkasan awal.", { header: "editorial", metadata: "cards", table: "grid", totals: "box", closing: "reverse", flow: "summary-first", font: "geometric", density: "normal" }, "#713e6c", "#faf3f9"),
  template("service", "Service", "Jasa", "Judul bertingkat, tabel lapang, dan petunjuk pembayaran di awal.", { header: "stacked", metadata: "split", table: "striped", totals: "full", closing: "columns", flow: "payment-first", font: "sans", density: "normal" }, "#166579", "#edf8fb"),
  template("agency", "Agency", "Jasa", "Badge tagihan, metadata horizontal, dan penutup profesional di tengah.", { header: "badge", metadata: "strip", table: "clean", totals: "split", closing: "center", flow: "standard", font: "geometric", density: "airy" }, "#5346a1", "#f5f3ff"),
  template("signature", "Signature", "Premium", "Kop terpusat beraksen hangat dengan tabel halus dan total berbingkai.", { header: "seal", metadata: "split", table: "rules", totals: "box", closing: "columns", flow: "standard", font: "serif", density: "normal" }, "#61482a", "#faf7f0", "#8a622f"),
  template("maison", "Maison", "Premium", "Pita judul dengan informasi vertikal dan penutup berpusat.", { header: "ribbon", metadata: "stacked", table: "clean", totals: "left", closing: "center", flow: "payment-first", font: "serif", density: "airy" }, "#3f5345", "#f4f7f3", "#756448"),
  template("heritage", "Heritage", "Premium", "Identitas berbingkai, tabel formal, dan ringkasan selebar halaman.", { header: "frame", metadata: "strip", table: "rules", totals: "full", closing: "stacked", flow: "standard", font: "serif", density: "normal" }, "#573b3b", "#faf5f2", "#806034"),
  template("gallery", "Gallery", "Premium", "Kop terpusat lapang, ringkasan nominal di awal, dan tanda tangan terbalik.", { header: "center", metadata: "cards", table: "clean", totals: "split", closing: "reverse", flow: "summary-first", font: "geometric", density: "airy" }, "#3c4554", "#f4f6f9", "#755e38"),
];

const byId = new Map(INVOICE_TEMPLATES.map((item) => [item.id, item]));
export const INVOICE_TEMPLATE_CATEGORIES = [...new Set(INVOICE_TEMPLATES.map((item) => item.category))];
export function getInvoiceTemplate(id?: string): InvoiceTemplate | undefined { return id ? byId.get(id) : undefined; }

export function applyInvoiceTemplate(design: InvoiceDesign, id: string): InvoiceDesign {
  const selected = getInvoiceTemplate(id);
  if (!selected) return design;
  return { ...design, templateId: selected.id, logoWidth: selected.logoWidth, colors: { ...selected.colors }, visible: { ...design.visible } };
}

export const INVOICE_FONTS = {
  sans: "Arial, Helvetica, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', Courier, monospace",
  geometric: "Verdana, Geneva, sans-serif",
} as const;

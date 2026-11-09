"use client";

import Image from "next/image";
import { Store as StoreIcon, ShieldCheck } from "lucide-react";
import React, { type CSSProperties, type ReactNode } from "react";
import type { InvoiceData } from "./invoice-document";
import type { InvoiceDesign, InvoiceSeller } from "@/lib/types";
import { INVOICE_FONTS, type InvoiceTemplate } from "@/lib/invoice-templates";
import { invoiceLineTotal, invoiceInWords } from "@/lib/invoices";
import { currency, formatDate, formatDateTime, numberFmt } from "@/lib/utils";

type Props = { store?: InvoiceSeller; invoice: InvoiceData; design: InvoiceDesign; template: InvoiceTemplate; qr: string | null; id?: string };

function TemplateHeader({ store, invoice, design, template }: Omit<Props, "qr">) {
  const c = design.colors;
  const v = design.visible;
  const style = template.header;
  const logo = v.logo ? <div className="it-logo shrink-0 bg-white" style={{ width: design.logoWidth, maxWidth: 180, padding: ["banner", "duplex"].includes(style) ? 6 : 0 }}>
    {store?.logo ? <Image src={store.logo} alt={`Logo ${store.name}`} width={design.logoWidth} height={design.logoWidth} style={{ width: "100%", height: "auto", maxHeight: 150, objectFit: "contain" }} loading="eager" unoptimized /> : <StoreIcon className="mx-auto h-10 w-10" style={{ color: c.brand }} />}
  </div> : null;
  const identity = (inverse = false) => <div className="min-w-0 break-words">
    <h2 className="text-[23px] font-bold leading-tight" style={{ color: inverse ? c.headingText : c.brand }}>{store?.name || "Nama toko"}</h2>
    {v.tagline && store?.tagline && <p className="mt-1 whitespace-pre-line text-[11px] font-medium" style={{ color: inverse ? c.headingText : c.tagline }}>{store.tagline}</p>}
    {v.storeAddress && store?.address && <p className="mt-2 whitespace-pre-line text-[10px] leading-relaxed" style={{ color: inverse ? c.headingText : c.muted }}>{store.address}</p>}
    {(v.storePhone && store?.phone || v.storeEmail && store?.email) && <p className="mt-1 text-[10px] leading-relaxed" style={{ color: inverse ? c.headingText : c.muted }}>{[v.storePhone && store?.phone && `Telp/WA: ${store.phone}`, v.storeEmail && store?.email].filter(Boolean).join(" · ")}</p>}
  </div>;
  const title = (size = 28, inverse = false) => <div className="min-w-0 break-words" style={{ color: inverse ? c.headingText : c.heading }}><p className="font-bold leading-none tracking-wider" style={{ fontSize: size }}>INVOICE</p><p className="mt-2 text-[11px] tracking-normal">{invoice.number || "—"}</p></div>;
  const brand = <div className="flex min-w-0 items-center gap-4">{logo}{identity()}</div>;
  const rule = { borderColor: c.brand };
  let content: ReactNode;
  switch (style) {
    case "center": content = <div className="text-center"><div className="mb-3 flex justify-center">{logo}</div>{identity()}<div className="mt-5 border-y py-3" style={rule}>{title(24)}</div></div>; break;
    case "banner": content = <div className="flex items-center justify-between gap-6 p-6" style={{ background: c.brand }}><div className="flex min-w-0 items-center gap-4">{logo}{identity(true)}</div><div className="shrink-0 text-right">{title(29, true)}</div></div>; break;
    case "rail": content = <div className="grid grid-cols-[1.6fr_1fr] gap-6 border-l-[10px] py-3 pl-5" style={rule}>{brand}<div className="border-l pl-5 text-right" style={{ borderColor: c.border }}>{title(34)}<p className="mt-4 text-[10px]" style={{ color: c.muted }}>{formatDate(invoice.date)}</p></div></div>; break;
    case "editorial": content = <div><div className="flex items-end justify-between gap-5 border-b-2 pb-4" style={rule}>{title(54)}{logo}</div><div className="mt-4 max-w-[75%]">{identity()}</div></div>; break;
    case "letterhead": content = <div><div className="flex items-start justify-between gap-6 border-b-2 pb-4" style={rule}>{identity()}{logo}</div><div className="mt-3 text-right">{title(20)}</div></div>; break;
    case "stacked": content = <div><div className="mb-5 border-b pb-3" style={{ borderColor: c.border }}>{title(40)}</div>{brand}</div>; break;
    case "corner": content = <div className="grid grid-cols-[1fr_1.4fr] items-start gap-8"><div>{title(42)}<div className="mt-5 h-1 w-16" style={{ background: c.brand }} /></div><div className="text-right"><div className="mb-3 flex justify-end">{logo}</div>{identity()}</div></div>; break;
    case "frame": content = <div className="border-2 p-5" style={rule}><div className="flex items-center justify-between gap-6">{brand}<div className="border-l pl-5 text-right" style={rule}>{title(26)}</div></div></div>; break;
    case "ribbon": content = <div>{brand}<div className="mt-5 flex items-center justify-between gap-4 px-5 py-3" style={{ background: c.heading, color: c.headingText }}><p className="text-[22px] font-bold tracking-[0.2em]">INVOICE</p><p className="break-all text-[11px]">{invoice.number || "—"}</p></div></div>; break;
    case "seal": content = <div className="text-center"><div className="flex justify-center">{logo}</div><div className="mx-auto mt-3 max-w-[85%]">{identity()}</div><div className="mx-auto my-4 w-20 border-t-2" style={rule} />{title(22)}</div>; break;
    case "mono": content = <div className="border-y-2 py-4" style={rule}><div className="flex items-start justify-between gap-8">{brand}<div className="text-right">{title(28)}<p className="mt-3 text-[10px]" style={{ color: c.muted }}>{formatDate(invoice.date)}</p></div></div></div>; break;
    case "docket": content = <div><div className="mx-auto max-w-[75%] text-center"><div className="mb-2 flex justify-center">{logo}</div>{identity()}</div><div className="mt-4 border-y border-dashed py-3 text-center" style={rule}>{title(25)}</div></div>; break;
    case "reverse": content = <div className="flex items-start justify-between gap-8 border-b-4 pb-5" style={rule}><div>{title(35)}</div><div className="flex max-w-[65%] items-start gap-4 text-right">{identity()}{logo}</div></div>; break;
    case "badge": content = <div className="flex items-start justify-between gap-6">{brand}<div className="shrink-0 rounded-xl border p-4 text-right" style={{ borderColor: c.border, background: c.alternateRow }}>{title(21)}<p className="mt-4 text-[9px] uppercase" style={{ color: c.muted }}>Total tagihan</p><p className="mt-1 text-[21px] font-bold" style={{ color: c.total }}>{currency.format(invoice.total)}</p></div></div>; break;
    case "duplex": content = <div className="grid grid-cols-[1.65fr_1fr] gap-3"><div className="border p-5" style={{ borderColor: c.border }}>{brand}</div><div className="flex flex-col justify-center p-5 text-right" style={{ background: c.heading }}>{title(27, true)}<p className="mt-4 text-[10px]" style={{ color: c.headingText }}>{formatDate(invoice.date)}</p></div></div>; break;
    default: content = <div className="flex items-start justify-between gap-6 border-b-2 pb-5" style={rule}>{brand}<div className="shrink-0 text-right">{title(29)}</div></div>;
  }
  return <header className={`it-header it-header-${style}`} style={{ breakInside: "avoid" }}>{content}</header>;
}

export function InvoiceTemplateDocument({ store, invoice, design, template: t, qr, id }: Props) {
  const c = design.colors, v = design.visible;
  const sig = invoice.signature;
  const pad = t.density === "compact" ? 5 : t.density === "airy" ? 8 : 6;
  const cell: CSSProperties = { padding: `${pad}px 7px`, borderBottom: t.table === "clean" ? "none" : `1px solid ${c.border}`, ...(t.table === "grid" ? { border: `1px solid ${c.border}` } : {}) };
  const headCell = { ...cell, borderBottom: `2px solid ${c.brand}` };
  const phone = invoice.buyerPhone?.trim();
  const factRows = [["Nomor invoice", invoice.number || "—"], ["Tanggal", formatDate(invoice.date)], ...(v.dueDate && invoice.dueDate ? [["Jatuh tempo", formatDate(invoice.dueDate)]] : [])];
  const facts = t.metadata === "strip" ? <dl className="grid grid-cols-3 gap-5">{factRows.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[9px] uppercase tracking-wide" style={{ color: c.muted }}>{label}</dt><dd className="mt-1 break-words text-[11px] font-semibold" style={{ color: c.detail }}>{value}</dd></div>)}</dl> : <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[10px]">{factRows.map(([label, value]) => <div key={label} className="contents"><dt style={{ color: c.muted }}>{label}</dt><dd className="break-all text-right font-medium" style={{ color: c.detail }}>{value}</dd></div>)}</dl>;
  const buyer = <div className="min-w-0 text-[11px]"><p className="mb-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: c.muted }}>Ditagihkan kepada</p><p className="break-words text-[14px] font-bold" style={{ color: c.detail }}>{invoice.buyer || "—"}</p>{v.buyerAddress && invoice.buyerAddress && <p className="mt-1 whitespace-pre-line break-words leading-relaxed" style={{ color: c.detail }}>{invoice.buyerAddress}</p>}{v.buyerPhone && phone && phone !== "-" && <p className="mt-1 break-words" style={{ color: c.muted }}>Telp/WA: {phone}</p>}</div>;
  const payment = v.payment && (store?.paymentMethod || store?.bankInfo) ? <div className="min-w-0 text-[10px] leading-relaxed"><p className="mb-1 font-bold uppercase tracking-wide" style={{ color: c.brand }}>Informasi pembayaran</p>{store.paymentMethod && <p>Metode: {store.paymentMethod}</p>}{store.bankInfo && <p className="whitespace-pre-line break-words" style={{ color: c.detail }}>{store.bankInfo}</p>}</div> : null;
  const note = v.note && invoice.note ? <div className="min-w-0 text-[10px] leading-relaxed"><p className="mb-1 font-bold" style={{ color: c.brand }}>Catatan</p><p className="whitespace-pre-line break-words" style={{ color: c.muted }}>{invoice.note}</p></div> : null;
  const signature = (v.signature || sig) ? <div className="it-signature w-[220px] shrink-0 text-center text-[10px]"><p style={{ color: c.muted }}>Hormat kami,</p>{sig ? <div className="mt-2 flex items-center justify-center gap-3 text-left">
    {qr && <Image src={qr} alt={`QR verifikasi ${sig.code}`} width={76} height={76} className="shrink-0" style={{ imageRendering: "pixelated", width: 76, height: 76 }} unoptimized />}
    <div className="min-w-0"><p className="break-words font-bold">{sig.signedBy || store?.signatureName || store?.name}</p><p className="mt-1 text-[9px]" style={{ color: c.muted }}>{formatDateTime(sig.signedAt)}</p><p className="mt-2 flex items-start gap-1 text-[8px]" style={{ color: c.brand }}><ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" /> Ditandatangani secara elektronik</p></div>
  </div> : <><div className="h-12" /><p className="break-words border-t pt-2 font-semibold" style={{ borderColor: c.border }}>{store?.signatureName || store?.name}</p></>}</div> : null;
  const closingGrid = ["center", "stacked"].includes(t.closing) && t.flow !== "payment-first" && Boolean(payment && note);
  const amounts = [
    ...(v.subtotal ? [["Subtotal", currency.format(invoice.subtotal)]] : []),
    ...(v.shipping || invoice.shipping > 0 ? [["Ongkos kirim", currency.format(invoice.shipping)]] : []),
    ...(v.discount || (invoice.discount ?? 0) > 0 ? [["Diskon", `${invoice.discount ? "− " : ""}${currency.format(invoice.discount ?? 0)}`]] : []),
  ];
  const totalRows = <div className={t.totals === "full" ? "grid grid-cols-3 gap-4" : "space-y-2"}>{amounts.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-3 text-[10px]"><span style={{ color: c.muted }}>{label}</span><span className="text-right font-medium" style={{ color: c.detail }}>{value}</span></div>)}</div>;
  const totalBar = <div className="it-total-bar flex items-center justify-between gap-4 px-4 py-3 font-bold" style={{ background: c.total, color: c.totalText }}><span className="text-[10px] uppercase tracking-wide">Total tagihan</span><span className="text-[17px] tabular-nums">{currency.format(invoice.total)}</span></div>;

  return <div id={id} data-invoice-template={t.id} className={`invoice-doc template-invoice mx-auto w-full max-w-[800px] bg-white it-density-${t.density}`} style={{ fontFamily: INVOICE_FONTS[t.font], color: c.text, fontSize: 11 }}>
    <div className="invoice-body p-8">
      <TemplateHeader store={store} invoice={invoice} design={design} template={t} />
      <section className={`invoice-metadata it-meta-${t.metadata} my-5`} style={{ breakInside: "avoid" }}>
        {t.metadata === "strip" ? <><div className="border-y py-3" style={{ borderColor: c.border }}>{facts}</div><div className="mt-4">{buyer}</div></> : <div className="grid grid-cols-[1.2fr_1fr] gap-5">
          <div className={t.metadata === "cards" ? "rounded-lg border p-4" : "py-2"} style={t.metadata === "cards" ? { borderColor: c.border, background: c.alternateRow } : {}}>{buyer}</div>
          <div className={t.metadata === "cards" ? "rounded-lg border p-4" : t.metadata === "stacked" ? "border-l py-2 pl-5" : "py-2"} style={{ borderColor: c.border }}>{facts}</div>
        </div>}
      </section>
      {t.flow === "summary-first" && <section className="mb-5 flex items-center justify-between gap-5 border-l-4 p-4" style={{ borderColor: c.brand, background: c.alternateRow, breakInside: "avoid" }}><div><p className="text-[10px] uppercase tracking-wide" style={{ color: c.muted }}>Ringkasan tagihan</p><p className="mt-1 text-[12px] font-semibold">{invoice.buyer || "—"}</p></div><p className="text-[25px] font-bold" style={{ color: c.brand }}>{currency.format(invoice.total)}</p></section>}
      {t.flow === "payment-first" && payment && <section className="mb-5 rounded-lg border p-4" style={{ borderColor: c.border, breakInside: "avoid" }}>{payment}</section>}
      <table className={`invoice-items w-full table-fixed border-collapse it-table-${t.table}`} style={{ fontSize: t.density === "compact" ? 10 : 11 }}>
        <thead style={{ background: c.tableHeader, color: c.tableHeaderText, display: "table-header-group", breakInside: "avoid" }}><tr>
          {v.rowNumber && <th className="text-center" style={{ ...headCell, width: v.description ? "5%" : "6%" }}>No</th>}<th className="text-left" style={headCell}>Nama barang</th>{v.description && <th className="w-[23%] text-left" style={headCell}>Keterangan</th>}<th className="text-right" style={{ ...headCell, width: v.description ? "8%" : "10%" }}>Qty</th>{v.unit && <th className="text-center" style={{ ...headCell, width: v.description ? "8%" : "10%" }}>Satuan</th>}{v.price && <th className="text-right" style={{ ...headCell, width: v.description ? "16%" : "18%" }}>Harga satuan (Rp)</th>}<th className="text-right" style={{ ...headCell, width: v.description ? "18%" : "21%" }}>Jumlah (Rp)</th>
        </tr></thead>
        <tbody style={{ color: c.detail }}>{invoice.lines.length ? invoice.lines.map((line, i) => <tr key={i} style={{ background: t.table === "striped" || t.table === "grid" ? i % 2 ? c.alternateRow : "#ffffff" : "#ffffff" }}>
          {v.rowNumber && <td className="text-center" style={cell}>{i + 1}</td>}<td className="break-words" style={cell}>{line.name}</td>{v.description && <td className="whitespace-pre-line" style={{ ...cell, overflowWrap: "anywhere" }}>{line.description || "—"}</td>}<td className="text-right tabular-nums" style={cell}>{numberFmt.format(line.quantity)}</td>{v.unit && <td className="break-words text-center" style={cell}>{line.unit}</td>}{v.price && <td className="text-right tabular-nums" style={cell}>{numberFmt.format(line.price)}</td>}<td className="text-right font-semibold tabular-nums" style={cell}>{numberFmt.format(invoiceLineTotal(line))}</td>
        </tr>) : <tr><td colSpan={3 + Number(v.rowNumber) + Number(v.unit) + Number(v.price) + Number(Boolean(v.description))} className="py-7 text-center" style={{ color: c.muted }}>Tambahkan barang untuk melihat rincian invoice.</td></tr>}</tbody>
      </table>
      <section className={`invoice-totals mt-5 it-totals-${t.totals}`} style={{ breakInside: "avoid", ...(t.totals === "right" || t.totals === "box" ? { width: "48%", marginLeft: "auto" } : t.totals === "left" ? { width: "48%" } : {}) }}>
        {t.totals === "split" ? <div className="grid grid-cols-2 gap-6"><div className="px-1">{totalRows}</div><div>{totalBar}</div></div> : <div className={t.totals === "box" ? "overflow-hidden rounded-lg border" : ""} style={{ borderColor: c.border }}><div className={t.totals === "box" ? "p-4" : "pb-3"}>{totalRows}</div>{totalBar}</div>}
      </section>
      {v.terbilang && <p className={`mt-4 text-[10px] italic ${t.closing === "center" ? "text-center" : ""}`} style={{ color: c.muted }}><strong className="not-italic">Terbilang: </strong>{invoiceInWords(invoice.total)}</p>}
      <div className="it-ending" style={{ breakInside: "avoid" }}>
      <section className={`invoice-closing mt-5 flex gap-5 it-closing-${t.closing} ${t.closing === "center" ? "flex-col items-center text-center" : t.closing === "stacked" ? "flex-col items-start" : t.closing === "reverse" ? "flex-row-reverse items-start justify-between" : "items-start justify-between"}`} style={{ breakInside: "avoid" }}>
        <div className={`min-w-0 ${closingGrid ? "grid w-full grid-cols-2 gap-5 text-left" : "space-y-3"} ${t.closing === "center" ? "max-w-[85%]" : "flex-1"}`}>{t.flow !== "payment-first" && payment}{note}</div>{signature}
      </section>
      {v.footer && store?.footerText && <p className="mt-4 whitespace-pre-line break-words border-t pt-3 text-center text-[10px] italic" style={{ color: c.footer, borderColor: c.border }}>{store.footerText}</p>}
      {sig && <div className="mt-3 border-t pt-2 text-[8px] leading-normal" style={{ borderColor: c.border, color: c.muted, breakInside: "avoid" }}><p className="break-all">Kode dokumen: {sig.code} · {sig.algo} · Hash: {sig.hash}</p><p>QR memuat ringkasan dan kode dokumen untuk pencocokan. Hash bukan tanda tangan tersertifikasi.</p></div>}
      </div>
    </div>
  </div>;
}

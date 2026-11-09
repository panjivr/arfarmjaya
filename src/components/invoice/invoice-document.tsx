"use client";

import Image from "next/image";
import React, { useMemo } from "react";
import qrcode from "qrcode-generator";
import { ShieldCheck, Store as StoreIcon } from "lucide-react";
import type { InvoiceLine, InvoiceSignature, InvoiceSeller } from "@/lib/types";
import { resolveInvoiceDesign } from "@/lib/invoice-design";
import { InvoiceTemplateDocument } from "./invoice-template-document";
import { getInvoiceTemplate } from "@/lib/invoice-templates";
import { invoiceInWords as terbilang, invoiceLineTotal } from "@/lib/invoices";
import { invoiceQrPayload } from "@/lib/invoice-sign";
import { currency, numberFmt, formatDate, formatDateTime } from "@/lib/utils";

export type InvoiceData = {
  number: string;
  buyer: string;
  buyerPhone?: string;
  buyerAddress?: string;
  date: string;
  dueDate?: string;
  lines: InvoiceLine[];
  subtotal: number;
  shipping: number;
  discount?: number;
  total: number;
  note?: string;
  signature?: InvoiceSignature;
};

/** QR verifikasi sebagai data URL (GIF) — dibuat sinkron, aman untuk cetak. */
function useInvoiceQr(payload: string | null): string | null {
  return useMemo(() => {
    if (!payload) return null;
    try {
      const qr = qrcode(0, "M");
      qr.addData(payload);
      qr.make();
      // cellSize besar → raster tajam, tetap terpindai saat dicetak.
      return qr.createDataURL(10, 4);
    } catch {
      return null;
    }
  }, [payload]);
}

export function InvoiceDocument({ store, invoice, id }: { store?: InvoiceSeller; invoice: InvoiceData; id?: string }) {
  const design = resolveInvoiceDesign(store);
  const { colors: c, visible: v, logoWidth, layout } = design;
  const template = getInvoiceTemplate(design.templateId);
  const sig = invoice.signature;
  const qr = useInvoiceQr(sig ? invoiceQrPayload({ ...invoice, storeName: store?.name ?? "" }, sig) : null);
  const phone = invoice.buyerPhone?.trim();
  const columns = 3 + Number(v.rowNumber) + Number(v.unit) + Number(v.price) + Number(Boolean(v.description));
  const contact = [v.storePhone && store?.phone && `Telp/WA: ${store.phone}`, v.storeEmail && store?.email].filter(Boolean).join(" · ");
  const cell = { border: `1px solid ${c.border}` };
  const detail = { color: c.detail };

  if (template) return <InvoiceTemplateDocument store={store} invoice={invoice} design={design} template={template} qr={qr} id={id} />;

  return (
    <div id={id} className="invoice-doc mx-auto w-full max-w-[800px] bg-white" style={{ fontFamily: "Arial, Helvetica, sans-serif", color: c.text, fontSize: 12 }}>
      <div className="invoice-body p-8">
        <header className={`flex items-center gap-6 border-b-2 pb-5 ${layout === "classic" ? "justify-between" : "items-start"}`} style={{ borderColor: c.brand }}>
          {v.logo && (
            <div className="shrink-0" style={{ width: logoWidth }}>
              {store?.logo ? <Image src={store.logo} alt={`Logo ${store.name}`} width={logoWidth} height={logoWidth} style={{ width: "100%", height: "auto", maxHeight: 150, objectFit: "contain" }} loading="eager" unoptimized /> : <StoreIcon className="mx-auto h-12 w-12" style={{ color: c.brand }} />}
            </div>
          )}
          <div className={`min-w-0 flex-1 ${layout === "classic" ? "text-right" : "text-left"}`}>
            <p className="break-words text-[23px] font-bold uppercase leading-tight" style={{ color: c.brand }}>{store?.name || "Nama toko"}</p>
            {v.tagline && store?.tagline && <p className="mt-1 whitespace-pre-line break-words text-[12px] font-semibold" style={{ color: c.tagline }}>{store.tagline}</p>}
            {v.storeAddress && store?.address && <p className="mt-1 whitespace-pre-line break-words text-[11px]" style={{ color: c.muted }}>{store.address}</p>}
            {contact && <p className="mt-1 break-words text-[11px]" style={{ color: c.muted }}>{contact}</p>}
          </div>
          {layout === "modern" && <p className="shrink-0 text-[24px] font-extrabold tracking-wide" style={{ color: c.heading }}>INVOICE</p>}
        </header>
        {layout === "classic" && <h2 className="mt-1 py-1.5 text-center text-[16px] font-bold tracking-[0.15em]" style={{ background: c.heading, color: c.headingText }}>INVOICE</h2>}

        <section className="invoice-metadata my-5 grid grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
          <div className="grid grid-cols-[85px_1fr] gap-x-2 gap-y-1.5">
            <span style={{ color: c.muted }}>No. invoice</span><strong className="break-all" style={detail}>{invoice.number || "—"}</strong>
            <span style={{ color: c.muted }}>Kepada</span><strong className="break-words" style={detail}>{invoice.buyer || "—"}</strong>
            {v.buyerAddress && invoice.buyerAddress && <><span style={{ color: c.muted }}>Alamat</span><span className="whitespace-pre-line break-words" style={detail}>{invoice.buyerAddress}</span></>}
          </div>
          <div className="grid grid-cols-[85px_1fr] content-start gap-x-2 gap-y-1.5">
            <span style={{ color: c.muted }}>Tanggal</span><span className="text-right" style={detail}>{formatDate(invoice.date)}</span>
            {v.dueDate && invoice.dueDate && <><span style={{ color: c.muted }}>Jatuh tempo</span><span className="text-right" style={detail}>{formatDate(invoice.dueDate)}</span></>}
            {v.buyerPhone && phone && phone !== "-" && <><span style={{ color: c.muted }}>No. telp/WA</span><span className="break-words text-right" style={detail}>{phone}</span></>}
          </div>
        </section>

        <table className="invoice-items w-full table-fixed border-collapse text-[11px]">
          <thead style={{ background: c.tableHeader, color: c.tableHeaderText }}>
            <tr>
              {v.rowNumber && <th className="px-1 py-2 text-center" style={{ width: v.description ? "5%" : "6%" }}>No</th>}
              <th className="px-2 py-2 text-left">Nama barang</th>
              {v.description && <th className="w-[23%] px-2 py-2 text-left">Keterangan</th>}
              <th className="px-1 py-2 text-right" style={{ width: v.description ? "8%" : "10%" }}>Qty</th>
              {v.unit && <th className="px-1 py-2 text-center" style={{ width: v.description ? "8%" : "10%" }}>Satuan</th>}
              {v.price && <th className="px-2 py-2 text-right" style={{ width: v.description ? "16%" : "19%" }}>Harga satuan (Rp)</th>}
              <th className="px-2 py-2 text-right" style={{ width: v.description ? "18%" : "21%" }}>Jumlah (Rp)</th>
            </tr>
          </thead>
          <tbody style={detail}>
            {invoice.lines.length === 0 ? <tr><td colSpan={columns} className="px-2 py-6 text-center" style={{ ...cell, color: c.muted }}>Tambahkan barang untuk melihat rincian invoice.</td></tr> : invoice.lines.map((line, i) => (
              <tr key={i} style={{ background: i % 2 ? c.alternateRow : "#ffffff" }}>
                {v.rowNumber && <td className="px-1 py-1.5 text-center" style={cell}>{i + 1}</td>}
                <td className="break-words px-2 py-1.5 font-medium" style={cell}>{line.name}</td>
                {v.description && <td className="whitespace-pre-line px-2 py-1.5 text-[10px]" style={{ ...cell, overflowWrap: "anywhere" }}>{line.description || "—"}</td>}
                <td className="px-1 py-1.5 text-right" style={cell}>{numberFmt.format(line.quantity)}</td>
                {v.unit && <td className="break-words px-1 py-1.5 text-center" style={cell}>{line.unit}</td>}
                {v.price && <td className="px-2 py-1.5 text-right tabular-nums" style={cell}>{numberFmt.format(line.price)}</td>}
                <td className="px-2 py-1.5 text-right font-medium tabular-nums" style={cell}>{numberFmt.format(invoiceLineTotal(line))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-totals ml-auto mt-0 w-[55%] text-[11px]" style={{ breakInside: "avoid" }}>
          {v.subtotal && <div className="flex justify-between gap-3 border-x border-b px-2 py-1.5" style={{ borderColor: c.border }}><span>Subtotal</span><strong style={detail}>{currency.format(invoice.subtotal)}</strong></div>}
          {(v.shipping || invoice.shipping > 0) && <div className="flex justify-between gap-3 border-x border-b px-2 py-1.5" style={{ borderColor: c.border }}><span>Ongkos kirim</span><span style={detail}>{currency.format(invoice.shipping)}</span></div>}
          {(v.discount || (invoice.discount ?? 0) > 0) && <div className="flex justify-between gap-3 border-x border-b px-2 py-1.5" style={{ borderColor: c.border }}><span>Diskon</span><span style={detail}>{invoice.discount ? `− ${currency.format(invoice.discount)}` : currency.format(0)}</span></div>}
          <div className="flex items-center justify-between gap-3 px-2 py-2 text-[12px] font-bold" style={{ background: c.total, color: c.totalText }}><span>TOTAL TAGIHAN</span><span>{currency.format(invoice.total)}</span></div>
        </div>
        {v.terbilang && <p className="mt-3 text-[11px] italic" style={{ color: c.muted }}><strong className="not-italic">Terbilang: </strong>{terbilang(invoice.total)}</p>}

        <section className="invoice-closing mt-6 flex items-start justify-between gap-8 text-[11px]" style={{ breakInside: "avoid" }}>
          <div className="min-w-0 flex-1 space-y-3">
            {v.payment && (store?.paymentMethod || store?.bankInfo) && <div><p className="mb-1 font-bold" style={{ color: c.brand }}>Informasi pembayaran</p>{store.paymentMethod && <p>Metode: {store.paymentMethod}</p>}{store.bankInfo && <p className="whitespace-pre-line break-words" style={detail}>{store.bankInfo}</p>}</div>}
            {v.note && invoice.note && <div><p className="mb-1 font-bold">Catatan</p><p className="whitespace-pre-line break-words" style={{ color: c.muted }}>{invoice.note}</p></div>}
          </div>
          {(v.signature || sig) && <div className="w-[200px] shrink-0 text-center">
            <p style={{ color: c.muted }}>Hormat kami,</p>
            {sig ? <>
              <p className="mt-1 flex items-center justify-center gap-1 text-[10px]" style={{ color: c.brand }}><ShieldCheck className="h-3 w-3" /> Ditandatangani secara elektronik</p>
              {qr && <Image src={qr} alt={`QR verifikasi ${sig.code}`} width={80} height={80} className="mx-auto my-2" style={{ imageRendering: "pixelated" }} unoptimized />}
              <p className="font-bold">{sig.signedBy || store?.signatureName || store?.name}</p><p className="mt-0.5 text-[10px]" style={{ color: c.muted }}>{formatDateTime(sig.signedAt)}</p>
            </> : <><div className="h-16" /><p className="border-t px-2 pt-1 font-semibold" style={{ borderColor: c.border }}>{store?.signatureName || store?.name}</p></>}
          </div>}
        </section>
        {v.footer && store?.footerText && <p className="mt-8 whitespace-pre-line break-words text-center text-[11px] italic" style={{ color: c.footer }}>{store.footerText}</p>}
        {sig && <div className="mt-6 border-t pt-2 text-[8px] leading-relaxed" style={{ borderColor: c.border, color: c.muted, breakInside: "avoid" }}><p>Kode dokumen: {sig.code} · {sig.algo}</p><p className="break-all">Hash: {sig.hash}</p><p>QR memuat ringkasan dan kode dokumen untuk pencocokan. Hash bukan tanda tangan tersertifikasi.</p></div>}
      </div>
    </div>
  );
}

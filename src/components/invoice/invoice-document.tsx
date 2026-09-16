"use client";

import Image from "next/image";
import { Store as StoreIcon } from "lucide-react";
import type { InvoiceLine, Store } from "@/lib/types";
import { currency, numberFmt, formatDate } from "@/lib/utils";

export type InvoiceData = {
  number: string;
  buyer: string;
  buyerPhone?: string;
  date: string;
  lines: InvoiceLine[];
  subtotal: number;
  shipping: number;
  total: number;
  note?: string;
};

export function InvoiceDocument({ store, invoice, id }: { store?: Store; invoice: InvoiceData; id?: string }) {
  const accent = store?.accent ?? "#007a4b";
  return (
    <div id={id} className="invoice-doc mx-auto w-full max-w-[800px] bg-white p-6 text-slate-900 sm:p-8" style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b-2 pb-4" style={{ borderColor: accent }}>
        <div className="flex items-start gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-white">
            {store?.logo ? (
              <Image src={store.logo} alt={store.name} width={64} height={64} className="h-full w-full object-contain" loading="eager" unoptimized />
            ) : (
              <StoreIcon className="h-8 w-8" style={{ color: accent }} />
            )}
          </div>
          <div>
            <p className="text-lg font-bold uppercase" style={{ color: accent }}>{store?.name ?? "Nama Toko"}</p>
            {store?.address && <p className="text-xs text-slate-600">{store.address}</p>}
            <p className="text-xs text-slate-600">
              {store?.phone && <>HP/WA: {store.phone}</>}
              {store?.email && <> · {store.email}</>}
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <p className="text-sm font-bold uppercase" style={{ color: accent }}>Invoice</p>
          <table className="ml-auto mt-1">
            <tbody>
              <tr><td className="pr-2 text-slate-500">Kepada</td><td className="font-semibold">: {invoice.buyer || "-"}</td></tr>
              {invoice.buyerPhone && <tr><td className="pr-2 text-slate-500">Telp</td><td>: {invoice.buyerPhone}</td></tr>}
              <tr><td className="pr-2 text-slate-500">No</td><td className="font-mono font-semibold">: {invoice.number}</td></tr>
              <tr><td className="pr-2 text-slate-500">Tanggal</td><td>: {formatDate(invoice.date)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Items */}
      <table className="mt-4 w-full border-collapse text-xs">
        <thead>
          <tr style={{ background: accent, color: "#fff" }}>
            <th className="border border-slate-300 px-2 py-1.5 text-center">No</th>
            <th className="border border-slate-300 px-2 py-1.5 text-left">Nama Barang</th>
            <th className="border border-slate-300 px-2 py-1.5 text-center">Satuan</th>
            <th className="border border-slate-300 px-2 py-1.5 text-right">Jumlah</th>
            <th className="border border-slate-300 px-2 py-1.5 text-right">Harga</th>
            <th className="border border-slate-300 px-2 py-1.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.length === 0 ? (
            <tr><td colSpan={6} className="border border-slate-300 px-2 py-4 text-center text-slate-400">Belum ada barang</td></tr>
          ) : (
            invoice.lines.map((l, i) => (
              <tr key={i}>
                <td className="border border-slate-300 px-2 py-1 text-center">{i + 1}</td>
                <td className="border border-slate-300 px-2 py-1">{l.name}</td>
                <td className="border border-slate-300 px-2 py-1 text-center">{l.unit}</td>
                <td className="border border-slate-300 px-2 py-1 text-right">{numberFmt.format(l.quantity)}</td>
                <td className="border border-slate-300 px-2 py-1 text-right">{numberFmt.format(l.price)}</td>
                <td className="border border-slate-300 px-2 py-1 text-right">{numberFmt.format(l.price * l.quantity)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-3 flex justify-end">
        <table className="text-xs">
          <tbody>
            <tr><td className="pr-6 py-0.5 text-slate-600">Subtotal</td><td className="text-right font-semibold">{currency.format(invoice.subtotal)}</td></tr>
            <tr><td className="pr-6 py-0.5 text-slate-600">Ongkos kirim</td><td className="text-right">{invoice.shipping ? currency.format(invoice.shipping) : "Rp -"}</td></tr>
            <tr style={{ color: accent }}><td className="pr-6 py-1 text-sm font-bold">Total</td><td className="text-right text-sm font-bold">{currency.format(invoice.total)}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Notes + signature */}
      <div className="mt-6 flex items-end justify-between gap-6 text-xs">
        <div className="max-w-[55%]">
          <p className="font-semibold">Catatan:</p>
          {store?.bankInfo && <p className="text-slate-600">Pembayaran via transfer: {store.bankInfo}</p>}
          {invoice.note && <p className="text-slate-600">{invoice.note}</p>}
        </div>
        <div className="text-center">
          <p className="mb-10 text-slate-600">{store?.signatureName ?? store?.name ?? ""}</p>
          <p className="border-t border-slate-400 px-6 pt-1 text-slate-500">Hormat kami</p>
        </div>
      </div>
    </div>
  );
}

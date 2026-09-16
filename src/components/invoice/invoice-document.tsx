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

/** Ubah angka menjadi kalimat "terbilang" bahasa Indonesia. */
function terbilang(value: number): string {
  const n = Math.floor(Math.abs(value));
  const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  const words = (x: number): string => {
    if (x < 12) return satuan[x];
    if (x < 20) return `${words(x - 10)} belas`;
    if (x < 100) return `${words(Math.floor(x / 10))} puluh${x % 10 ? ` ${words(x % 10)}` : ""}`;
    if (x < 200) return `seratus${x - 100 ? ` ${words(x - 100)}` : ""}`;
    if (x < 1000) return `${words(Math.floor(x / 100))} ratus${x % 100 ? ` ${words(x % 100)}` : ""}`;
    if (x < 2000) return `seribu${x - 1000 ? ` ${words(x - 1000)}` : ""}`;
    if (x < 1_000_000) return `${words(Math.floor(x / 1000))} ribu${x % 1000 ? ` ${words(x % 1000)}` : ""}`;
    if (x < 1_000_000_000) return `${words(Math.floor(x / 1_000_000))} juta${x % 1_000_000 ? ` ${words(x % 1_000_000)}` : ""}`;
    if (x < 1_000_000_000_000) return `${words(Math.floor(x / 1_000_000_000))} miliar${x % 1_000_000_000 ? ` ${words(x % 1_000_000_000)}` : ""}`;
    return `${words(Math.floor(x / 1_000_000_000_000))} triliun${x % 1_000_000_000_000 ? ` ${words(x % 1_000_000_000_000)}` : ""}`;
  };
  const text = (n === 0 ? "nol" : words(n)).replace(/\s+/g, " ").trim();
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} rupiah`;
}

export function InvoiceDocument({ store, invoice, id }: { store?: Store; invoice: InvoiceData; id?: string }) {
  const accent = store?.accent ?? "#007a4b";
  const contact = [store?.phone && `HP/WA: ${store.phone}`, store?.email].filter(Boolean).join("  ·  ");

  return (
    <div
      id={id}
      className="invoice-doc mx-auto w-full max-w-[800px] overflow-hidden rounded-md bg-white text-slate-900"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {/* Aksen atas */}
      <div style={{ height: 6, background: accent }} />

      <div className="p-6 sm:p-8">
        {/* Kop */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-white ring-1 ring-slate-200">
              {store?.logo ? (
                <Image src={store.logo} alt={store.name} width={64} height={64} className="h-full w-full object-contain" loading="eager" unoptimized />
              ) : (
                <StoreIcon className="h-8 w-8" style={{ color: accent }} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold uppercase leading-tight" style={{ color: accent }}>{store?.name ?? "Nama Toko"}</p>
              {store?.address && <p className="mt-0.5 text-[11px] leading-snug text-slate-600">{store.address}</p>}
              {contact && <p className="text-[11px] text-slate-600">{contact}</p>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-extrabold uppercase tracking-wide" style={{ color: accent }}>Invoice</p>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-800">{invoice.number}</p>
            <p className="text-[11px] text-slate-500">{formatDate(invoice.date)}</p>
          </div>
        </div>

        {/* Kepada */}
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Ditujukan kepada</p>
          <p className="text-sm font-bold text-slate-800">{invoice.buyer || "-"}</p>
          {invoice.buyerPhone && <p className="text-[11px] text-slate-600">Telp: {invoice.buyerPhone}</p>}
        </div>

        {/* Rincian barang */}
        <table className="mt-5 w-full border-collapse text-xs">
          <thead>
            <tr style={{ background: accent, color: "#fff" }}>
              <th className="px-2 py-2 text-center font-semibold" style={{ width: "6%" }}>No</th>
              <th className="px-3 py-2 text-left font-semibold">Nama Barang</th>
              <th className="px-2 py-2 text-center font-semibold" style={{ width: "10%" }}>Satuan</th>
              <th className="px-2 py-2 text-right font-semibold" style={{ width: "12%" }}>Jumlah</th>
              <th className="px-3 py-2 text-right font-semibold" style={{ width: "18%" }}>Harga</th>
              <th className="px-3 py-2 text-right font-semibold" style={{ width: "20%" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.length === 0 ? (
              <tr><td colSpan={6} className="border border-slate-200 px-2 py-5 text-center text-slate-400">Belum ada barang</td></tr>
            ) : (
              invoice.lines.map((l, i) => (
                <tr key={i} style={{ background: i % 2 === 1 ? "#f8fafc" : "#ffffff" }}>
                  <td className="border-x border-slate-200 px-2 py-1.5 text-center text-slate-500">{i + 1}</td>
                  <td className="border-x border-slate-200 px-3 py-1.5 font-medium">{l.name}</td>
                  <td className="border-x border-slate-200 px-2 py-1.5 text-center">{l.unit}</td>
                  <td className="border-x border-slate-200 px-2 py-1.5 text-right">{numberFmt.format(l.quantity)}</td>
                  <td className="border-x border-slate-200 px-3 py-1.5 text-right">{numberFmt.format(l.price)}</td>
                  <td className="border-x border-slate-200 px-3 py-1.5 text-right font-semibold">{numberFmt.format(l.price * l.quantity)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={{ height: 2, background: accent }} />

        {/* Total + terbilang */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-[52%] rounded-md border border-dashed border-slate-300 px-4 py-3 text-[11px] leading-relaxed">
            <p className="font-semibold text-slate-700">Terbilang</p>
            <p className="italic text-slate-600">{terbilang(invoice.total)}</p>
          </div>
          <div className="w-full sm:w-[280px]">
            <div className="flex justify-between px-1 py-1 text-xs text-slate-600">
              <span>Subtotal</span><span className="font-semibold text-slate-800">{currency.format(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between px-1 py-1 text-xs text-slate-600">
              <span>Ongkos kirim</span><span>{invoice.shipping ? currency.format(invoice.shipping) : "Rp -"}</span>
            </div>
            <div className="mt-1 flex items-center justify-between rounded-md px-3 py-2 text-sm font-bold text-white" style={{ background: accent }}>
              <span>TOTAL</span><span>{currency.format(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Pembayaran + tanda tangan */}
        <div className="mt-6 flex items-end justify-between gap-6 text-xs">
          <div className="max-w-[55%]">
            <p className="font-semibold text-slate-700">Informasi Pembayaran</p>
            {store?.bankInfo ? (
              <p className="mt-0.5 text-slate-600">Transfer: {store.bankInfo}</p>
            ) : (
              <p className="mt-0.5 text-slate-400">—</p>
            )}
            {invoice.note && <p className="mt-2 text-slate-600">{invoice.note}</p>}
          </div>
          <div className="text-center">
            <p className="text-slate-600">Hormat kami,</p>
            <div className="h-12" />
            <p className="border-t border-slate-400 px-6 pt-1 font-semibold text-slate-700">
              {store?.signatureName ?? store?.name ?? ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

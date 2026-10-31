"use client";

import Image from "next/image";
import { Store as StoreIcon } from "lucide-react";
import type { OfficialLetter, Store } from "@/lib/types";
import { formatLongDate, terbilang } from "@/lib/letters";
import { currency, numberFmt } from "@/lib/utils";

export function LetterDocument({ store, letter, id }: { store?: Store; letter: OfficialLetter; id?: string }) {
  const accent = store?.accent ?? "#007a4b";
  const contact = [store?.phone && `HP/WA: ${store.phone}`, store?.email].filter(Boolean).join("  ·  ");
  const phone = letter.recipientPhone?.trim() ?? "";
  const hasPhone = phone.length > 0 && phone !== "-";
  const signer = store?.signatureName?.trim() || store?.name || "";

  return (
    <div
      id={id}
      className="letter-doc mx-auto w-full max-w-[800px] overflow-hidden rounded-md bg-white text-slate-900"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <div style={{ height: 6, background: accent }} />

      <div className="p-6 sm:p-8">
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
              <p className="text-lg font-bold uppercase leading-tight" style={{ color: accent }}>{store?.name ?? letter.storeName}</p>
              {store?.address && <p className="mt-0.5 text-[11px] leading-snug text-slate-600">{store.address}</p>}
              {contact && <p className="text-[11px] text-slate-600">{contact}</p>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-extrabold uppercase tracking-wide" style={{ color: accent }}>Surat Penagihan</p>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-800">{letter.number}</p>
            <p className="text-[11px] text-slate-500">{letter.place}, {formatLongDate(letter.date)}</p>
          </div>
        </div>

        <div className="mt-4 text-[12px] leading-relaxed text-slate-700">
          <p><span className="inline-block w-16 font-semibold">Perihal</span>: {letter.subject}</p>
          {letter.reference && <p><span className="inline-block w-16 font-semibold">Ref.</span>: {letter.reference}</p>}
          {letter.dueDate && <p><span className="inline-block w-16 font-semibold">Tempo</span>: {formatLongDate(letter.dueDate)}</p>}
        </div>

        <div className="mt-4 text-[13px] leading-relaxed">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Kepada Yth.</p>
          <p className="font-bold text-slate-800">{letter.recipient || "-"}</p>
          {letter.recipientAddress && <p className="whitespace-pre-wrap text-slate-600">{letter.recipientAddress}</p>}
          {hasPhone && <p className="text-slate-600">Telp: {phone}</p>}
        </div>

        <div className="mt-4 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-800">{letter.opening}</div>

        <table className="mt-4 w-full border-collapse text-xs">
          <thead>
            <tr style={{ background: accent, color: "#fff" }}>
              <th className="px-2 py-2 text-center font-semibold" style={{ width: "6%" }}>No</th>
              <th className="px-3 py-2 text-left font-semibold">Barang</th>
              <th className="px-2 py-2 text-right font-semibold" style={{ width: "14%" }}>Jumlah</th>
              <th className="px-3 py-2 text-left font-semibold" style={{ width: "28%" }}>Keterangan</th>
              <th className="px-3 py-2 text-right font-semibold" style={{ width: "20%" }}>Jumlah (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {letter.lines.length === 0 ? (
              <tr><td colSpan={5} className="border border-slate-200 px-2 py-5 text-center text-slate-400">Belum ada barang</td></tr>
            ) : (
              letter.lines.map((line, index) => (
                <tr key={`${line.name}-${index}`} style={{ background: index % 2 === 1 ? "#f8fafc" : "#ffffff" }}>
                  <td className="border-x border-slate-200 px-2 py-1.5 text-center text-slate-500">{index + 1}</td>
                  <td className="border-x border-slate-200 px-3 py-1.5 font-medium">{line.name}</td>
                  <td className="border-x border-slate-200 px-2 py-1.5 text-right">{numberFmt.format(line.quantity)} {line.unit}</td>
                  <td className="border-x border-slate-200 px-3 py-1.5 text-slate-600">{line.note || "—"}</td>
                  <td className="border-x border-slate-200 px-3 py-1.5 text-right font-semibold">{numberFmt.format(line.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={{ height: 2, background: accent }} />

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-[58%] rounded-md border border-dashed border-slate-300 px-4 py-3 text-[11px] leading-relaxed">
            <p className="font-semibold text-slate-700">Terbilang</p>
            <p className="italic text-slate-600">{terbilang(letter.total)}</p>
          </div>
          <div className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-bold text-white sm:min-w-[240px]" style={{ background: accent }}>
            <span>TOTAL TAGIHAN</span>
            <span>{currency.format(letter.total)}</span>
          </div>
        </div>

        <div className="mt-4 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-800">{letter.closing}</div>

        <div className="mt-6 flex items-end justify-between gap-6 text-xs" style={{ breakInside: "avoid" }}>
          <div className="max-w-[55%]">
            <p className="font-semibold text-slate-700">Informasi Pembayaran</p>
            {letter.bankInfo ? (
              <p className="mt-0.5 text-slate-600">Transfer: {letter.bankInfo}</p>
            ) : (
              <p className="mt-0.5 text-slate-400">Rekening belum diisi pada pengaturan toko.</p>
            )}
          </div>
          <div className="min-w-[180px] text-center">
            <p className="text-slate-600">{letter.place}, {formatLongDate(letter.date)}</p>
            <p className="text-slate-600">Hormat kami,</p>
            <div className="h-14" />
            <p className="border-t border-slate-400 px-6 pt-1 font-semibold text-slate-700">{signer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

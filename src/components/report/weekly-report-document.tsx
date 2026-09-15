"use client";

import Image from "next/image";
import { Leaf } from "lucide-react";
import type { ReportProfile, WeeklyActivity } from "@/lib/types";
import { formatDate, formatLongDate, numberFmt } from "@/lib/utils";

export type WeeklyReportData = {
  number: string;
  executor: string;
  group: string;
  location: string;
  week: string;
  periodStart?: string;
  periodEnd?: string;
  signPlace: string;
  signDate: string;
  activities: WeeklyActivity[];
  total: number;
};

type Column = {
  key: "no" | "date" | "activity" | "purpose" | "hst" | "amount" | "output" | "photo";
  label: string;
  weight: number;
  align: "left" | "center" | "right";
};

const ink = "#1f2937";
const inkMuted = "#5b6472";
const line = "#cbd0d8";
const zebra = "#fafbfc";
const totalBg = "#f3f4f6";

function buildColumns(profile: ReportProfile): Column[] {
  const columns: Column[] = [
    { key: "no", label: "No.", weight: 4, align: "center" },
    { key: "date", label: "Tanggal", weight: 10, align: "center" },
    { key: "activity", label: "Jenis Kegiatan", weight: 16, align: "left" },
    { key: "purpose", label: "Tujuan", weight: 21, align: "left" },
  ];
  if (profile.showHst) columns.push({ key: "hst", label: "Umur HST\n(Hari Setelah Tanam)", weight: 9, align: "center" });
  if (profile.showAmount) columns.push({ key: "amount", label: profile.currencyLabel || "Nominal (Rp)", weight: 11, align: "right" });
  if (profile.showOutput) columns.push({ key: "output", label: "Output", weight: 21, align: "left" });
  if (profile.showPhoto) columns.push({ key: "photo", label: "Foto Kegiatan", weight: 14, align: "center" });
  return columns;
}

/** Ambil angka HST ("14 HST" → 14) untuk ringkasan rentang umur tanaman. */
function hstValue(raw: string) {
  const match = raw.match(/-?\d+/);
  return match ? Number(match[0]) : null;
}

function periodLabel(report: WeeklyReportData) {
  if (report.periodStart && report.periodEnd) return `${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)}`;
  if (report.periodStart) return formatDate(report.periodStart);
  const dates = report.activities.map((a) => a.date).filter(Boolean).sort();
  if (dates.length === 0) return "-";
  return dates[0] === dates[dates.length - 1]
    ? formatDate(dates[0])
    : `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`;
}

/** Isi satu sel tabel sesuai kolomnya. */
function cellValue(key: Column["key"], activity: WeeklyActivity, index: number) {
  switch (key) {
    case "no":
      return String(index + 1);
    case "date":
      return activity.date ? formatDate(activity.date) : "";
    case "amount":
      return numberFmt.format(Number(activity.amount) || 0);
    case "activity":
      return activity.activity;
    case "purpose":
      return activity.purpose;
    case "hst":
      return activity.hst;
    case "output":
      return activity.output;
    default:
      return "";
  }
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 py-[3px]">
      <span className="w-[170px] shrink-0" style={{ color: inkMuted }}>
        {label}
      </span>
      <span className="shrink-0" style={{ color: inkMuted }}>
        :
      </span>
      <span className="min-w-0 flex-1 font-semibold" style={{ color: ink }}>
        {value?.trim() ? value : "......................................"}
      </span>
    </div>
  );
}

function SignatureColumn({
  role,
  name,
  identifier,
  signatureImage,
  place,
}: {
  role: string;
  name?: string;
  identifier?: string;
  signatureImage?: string;
  place?: string;
}) {
  return (
    <div className="w-[230px] text-center" style={{ breakInside: "avoid" }}>
      <p style={{ color: ink }}>{place?.trim() ? place : "\u00A0"}</p>
      <p className="mt-0.5 whitespace-pre-line" style={{ color: ink }}>
        {role}
      </p>
      <div className="relative mx-auto flex h-[52px] w-full items-center justify-center">
        {signatureImage && (
          <Image src={signatureImage} alt={`Tanda tangan ${name ?? role}`} width={180} height={64} className="max-h-[52px] w-auto object-contain" unoptimized />
        )}
      </div>
      <p className="font-bold underline" style={{ color: ink }}>
        {name?.trim() ? `( ${name} )` : "(  ..............................................  )"}
      </p>
      <p className="mt-0.5" style={{ color: inkMuted }}>
        {identifier?.trim() ? `NIP/ID. ${identifier}` : "NIP/ID. ........................................"}
      </p>
    </div>
  );
}

/**
 * Laporan pelaksanaan mingguan siap cetak (A4 landscape). Dipakai untuk pratinjau
 * di layar dan sebagai isi `#print-area` saat mencetak / menyimpan PDF.
 */
export function WeeklyReportDocument({
  profile,
  report,
  id,
  printedAt,
}: {
  profile: ReportProfile;
  report: WeeklyReportData;
  id?: string;
  printedAt?: string;
}) {
  const accent = profile.accent || "#c0201c";
  const columns = buildColumns(profile);
  const weightTotal = columns.reduce((t, c) => t + c.weight, 0);
  const width = (column: Column) => `${((column.weight / weightTotal) * 100).toFixed(3)}%`;

  const rows = report.activities;
  const blanks = Math.max(0, (profile.minRows || 0) - rows.length);
  const contact = [profile.address, profile.phone && `Telp/HP: ${profile.phone}`, profile.email].filter(Boolean).join("  |  ");

  const hstNumbers = rows.map((a) => hstValue(a.hst)).filter((v): v is number => v !== null);
  const hstMin = hstNumbers.length ? Math.min(...hstNumbers) : null;
  const hstMax = hstNumbers.length ? Math.max(...hstNumbers) : null;
  const hstRange = hstMin === null ? "-" : hstMin === hstMax ? `${hstMin} HST` : `${hstMin} – ${hstMax} HST`;

  const summary = [
    { label: "Jumlah Kegiatan", value: `${rows.length} kegiatan` },
    { label: "Periode Kegiatan", value: periodLabel(report) },
    ...(profile.showHst ? [{ label: "Rentang Umur Tanaman", value: hstRange }] : []),
    ...(profile.showAmount ? [{ label: "Total Nominal", value: `Rp ${numberFmt.format(report.total)}` }] : []),
  ];

  const cellBase = "align-top px-2 py-1";
  const borderStyle = { border: `1px solid ${line}` };

  return (
    <div
      id={id}
      className="report-doc mx-auto w-full bg-white p-6 text-[10px] leading-snug sm:p-8"
      style={{ fontFamily: "Arial, Helvetica, sans-serif", color: ink, maxWidth: "1180px" }}
    >
      {/* Kop surat */}
      <header className="flex items-center gap-4 pb-2" style={{ borderBottom: `2px solid ${accent}` }}>
        <div className="flex h-[52px] w-[124px] shrink-0 items-center justify-start">
          {profile.logo ? (
            <Image src={profile.logo} alt={profile.organization} width={260} height={116} className="max-h-[52px] w-auto object-contain" unoptimized />
          ) : (
            <Leaf className="h-9 w-9" style={{ color: accent }} />
          )}
        </div>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[15px] font-bold uppercase leading-tight" style={{ color: accent }}>
            {profile.organization}
          </p>
          {profile.tagline && (
            <p className="text-[10px] italic" style={{ color: accent, opacity: 0.85 }}>
              {profile.tagline}
            </p>
          )}
          {profile.program && (
            <p className="mt-0.5 text-[10px] font-bold" style={{ color: ink }}>
              {profile.program}
            </p>
          )}
          {contact && (
            <p className="mt-0.5 text-[8px]" style={{ color: inkMuted }}>
              {contact}
            </p>
          )}
        </div>
        <div className="h-[52px] w-[124px] shrink-0" />
      </header>

      {/* Judul laporan */}
      <div className="mt-3 px-3 py-2 text-center" style={{ background: accent }}>
        <h1 className="text-[13px] font-bold uppercase tracking-wide text-white">{profile.reportTitle}</h1>
      </div>

      {/* Identitas pelaksana */}
      <section className="mt-3 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
        <div>
          <IdentityRow label="Nama Pelaksana / Penyuluh" value={report.executor} />
          <IdentityRow label="Kelompok Tani" value={report.group} />
        </div>
        <div>
          <IdentityRow label="Lokasi / Desa" value={report.location} />
          <IdentityRow label="Minggu Ke- / Periode" value={report.week} />
        </div>
      </section>

      {/* Tabel kegiatan */}
      <table className="mt-3 w-full border-collapse" style={{ tableLayout: "fixed" }}>
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={{ width: width(column) }} />
          ))}
        </colgroup>
        <thead style={{ display: "table-header-group" }}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="whitespace-pre-line px-2 py-2 text-center text-[9.5px] font-bold uppercase leading-tight text-white"
                style={{ background: accent, border: `1px solid ${accent}` }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((activity, index) => (
            <tr key={activity.id} style={{ breakInside: "avoid", background: index % 2 === 1 ? zebra : "#ffffff" }}>
              {columns.map((column) => {
                if (column.key === "photo") {
                  return (
                    <td key={column.key} className={`${cellBase} text-center`} style={borderStyle}>
                      {activity.photo ? (
                        <Image
                          src={activity.photo}
                          alt={`Foto ${activity.activity || `kegiatan ${index + 1}`}`}
                          width={320}
                          height={220}
                          className="mx-auto h-[70px] w-auto max-w-full rounded-sm object-contain"
                          unoptimized
                        />
                      ) : (
                        <span
                          className="flex h-[70px] items-center justify-center rounded-sm px-1 text-[8px]"
                          style={{ border: `1px dashed ${line}`, color: inkMuted }}
                        >
                          (tempel foto di sini)
                        </span>
                      )}
                    </td>
                  );
                }
                const value = cellValue(column.key, activity, index);
                return (
                  <td
                    key={column.key}
                    className={`${cellBase} ${column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : "text-left"} ${
                      column.key === "activity" ? "font-semibold" : ""
                    }`}
                    style={{ ...borderStyle, whiteSpace: "pre-line" }}
                  >
                    {value || "\u00A0"}
                  </td>
                );
              })}
            </tr>
          ))}

          {Array.from({ length: blanks }).map((_, index) => (
            <tr key={`blank-${index}`} style={{ breakInside: "avoid" }}>
              {columns.map((column) => (
                <td key={column.key} className={`${cellBase} text-center`} style={{ ...borderStyle, height: profile.showPhoto ? 28 : 22 }}>
                  {column.key === "no" ? <span style={{ color: inkMuted }}>{rows.length + index + 1}</span> : <span>&nbsp;</span>}
                </td>
              ))}
            </tr>
          ))}

          {profile.showAmount && (
            <tr style={{ background: totalBg, breakInside: "avoid" }}>
              <td
                colSpan={columns.findIndex((c) => c.key === "amount")}
                className="px-2 py-1 text-right text-[10px] font-bold"
                style={borderStyle}
              >
                Total {profile.currencyLabel || "Nominal (Rp)"}
              </td>
              <td className="px-2 py-1 text-right text-[11px] font-bold" style={borderStyle}>
                {numberFmt.format(report.total)}
              </td>
              {columns.slice(columns.findIndex((c) => c.key === "amount") + 1).map((column) => (
                <td key={column.key} style={borderStyle} />
              ))}
            </tr>
          )}
        </tbody>
      </table>

      {/* Ringkasan + tanda tangan */}
      <section className="mt-3 flex flex-wrap items-start justify-between gap-6" style={{ breakInside: "avoid" }}>
        <div className="min-w-[280px] flex-1">
          {profile.showSummary && summary.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {summary.map((item) => (
                <div key={item.label} className="rounded px-3 py-1.5" style={{ border: `1px solid ${line}`, background: zebra }}>
                  <p className="text-[8px] uppercase tracking-wide" style={{ color: inkMuted }}>
                    {item.label}
                  </p>
                  <p className="text-[10.5px] font-bold" style={{ color: ink }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {profile.showNotes && profile.notes.filter(Boolean).length > 0 && (
            <div className="mt-3">
              <p className="text-[9px] font-bold" style={{ color: accent }}>
                Keterangan Pengisian:
              </p>
              <ul className="mt-1 space-y-0.5">
                {profile.notes.filter(Boolean).map((note, index) => (
                  <li key={index} className="text-[8.5px]" style={{ color: inkMuted }}>
                    • {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {profile.approverRole?.trim() && (
            <SignatureColumn role={`Mengetahui,\n${profile.approverRole}`} name={profile.approverName} identifier={profile.approverId} />
          )}
          <SignatureColumn
            role={profile.signatureRole}
            name={profile.signatureName || report.executor}
            identifier={profile.signatureId}
            signatureImage={profile.signatureImage}
            place={`${report.signPlace || profile.signaturePlace || "................................"}, ${formatLongDate(report.signDate)}`}
          />
        </div>
      </section>

      {/* Kaki halaman */}
      <footer
        className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1.5 text-[8px]"
        style={{ borderTop: `1px solid ${line}`, color: inkMuted }}
      >
        <span>
          No. Dokumen: <span className="font-semibold">{report.number || "-"}</span>
        </span>
        <span>{profile.organization}</span>
        <span>Dicetak: {printedAt ?? "-"}</span>
      </footer>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import qrcode from "qrcode-generator";
import { activityPhotos } from "@/lib/activity-photos";
import { Leaf, ShieldCheck } from "lucide-react";
import type { ReportColumnKey, ReportProfile, WeeklyActivity } from "@/lib/types";
import { resolveReportColumns, type ResolvedColumn } from "@/lib/report-columns";
import { buildReportSignature, reportQrPayload, type ReportSignature } from "@/lib/report-sign";
import { formatDate, formatDateTime, formatLongDate, numberFmt } from "@/lib/utils";

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
  eSignAt?: string; // ISO — waktu tanda tangan elektronik (dipilih manual)
  activities: WeeklyActivity[];
  total: number;
};

const ink = "#1f2937";
const inkMuted = "#5b6472";
const line = "#cbd0d8";
const zebra = "#fafbfc";
const totalBg = "#f3f4f6";

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
function cellValue(key: ReportColumnKey, activity: WeeklyActivity, index: number) {
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
    case "payment":
      return "";
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

/**
 * Kolom tanda tangan/pengesahan. Menyediakan ruang kosong (untuk TTE/QR atau
 * tanda tangan basah) di antara lead & nama, sehingga bisa diisi visual nanti.
 */
function ApprovalColumn({
  lead,
  place,
  role,
  name,
  signatureImage,
  qr,
  signedLabel,
}: {
  lead: string;
  place?: string;
  role?: string;
  name?: string;
  signatureImage?: string;
  qr?: string | null; // data URL QR TTE (bila tanda tangan elektronik aktif)
  signedLabel?: string; // "nama · waktu" tanda tangan elektronik
}) {
  return (
    <div className="w-[240px] text-center" style={{ breakInside: "avoid" }}>
      <p className="font-semibold" style={{ color: ink }}>{lead}</p>
      {qr && (
        <p className="mt-0.5 flex items-center justify-center gap-1 text-[9px] font-medium text-green-700">
          <ShieldCheck className="h-3 w-3" /> Ditandatangani secara elektronik
        </p>
      )}
      {place?.trim() && (
        <p className="text-[9px]" style={{ color: inkMuted }}>{place}</p>
      )}
      {/* Ruang tanda tangan: QR TTE > gambar TTD basah > kosong untuk diisi manual */}
      <div className="relative mx-auto flex h-[62px] w-full items-center justify-center">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR tanda tangan elektronik" width={60} height={60} className="rounded bg-white p-0.5 ring-1 ring-slate-200" style={{ imageRendering: "pixelated", width: 60, height: 60 }} />
        ) : signatureImage ? (
          <Image src={signatureImage} alt={`Tanda tangan ${name ?? role ?? ""}`} width={180} height={64} className="max-h-[56px] w-auto object-contain" loading="eager" unoptimized />
        ) : null}
      </div>
      <p className="font-bold underline" style={{ color: ink }}>
        {name?.trim() ? `( ${name} )` : "(  ..............................................  )"}
      </p>
      {role?.trim() && (
        <p className="mt-0.5 whitespace-pre-line text-[9px]" style={{ color: inkMuted }}>{role}</p>
      )}
      {signedLabel && (
        <p className="mt-0.5 text-[8px] text-green-700">Ditandatangani elektronik: {signedLabel}</p>
      )}
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
  const columns: ResolvedColumn[] = resolveReportColumns(profile);
  const width = (column: ResolvedColumn) => `${column.widthPct.toFixed(3)}%`;
  const isVisible = (key: ReportColumnKey) => columns.some((c) => c.key === key);
  const photoVisible = isVisible("photo") || isVisible("payment");
  const amountVisible = isVisible("amount");
  const amountIndex = columns.findIndex((c) => c.key === "amount");
  // Tinggi baris & kotak foto/bukti (arah vertikal). Default 70px; dibatasi
  // agar tetap masuk akal saat dicetak.
  const rowH = Math.max(32, Math.min(1000, Math.round(profile.rowHeight || 70)));

  // Bagian LPJ yang dapat diatur (checklist). Default menjaga kompatibilitas
  // profil lama: ringkasan eksekutif & blok "Dibuat oleh" aktif; blok
  // "Mengetahui" aktif bila jabatan pengesah diisi; reimbursement nonaktif.
  const execSummaryOn = profile.showExecutiveSummary !== false;
  const signExecutorOn = profile.signExecutor !== false;
  const signApproverOn = profile.signApprover ?? Boolean(profile.approverRole?.trim());
  const reimbursementOn = Boolean(profile.showReimbursement);
  const eSignOn = Boolean(profile.showESign);

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
    ...(isVisible("hst") ? [{ label: "Rentang Umur Tanaman", value: hstRange }] : []),
    ...(amountVisible ? [{ label: "Total Nominal", value: `Rp ${numberFmt.format(report.total)}` }] : []),
  ];

  // Tanda tangan elektronik laporan (opsional): hash SHA-256 atas isi laporan
  // → kode dokumen + QR. Dihitung di klien; siap sebelum cetak (jeda 350ms).
  const eSignCanonical = useMemo(
    () =>
      [
        report.number,
        report.executor,
        report.group,
        report.location,
        report.week,
        report.total,
        ...rows.map((a) => `${a.date}|${a.activity}|${a.amount}`),
      ].join("\n"),
    [report.number, report.executor, report.group, report.location, report.week, report.total, rows],
  );
  const [reportSig, setReportSig] = useState<ReportSignature | null>(null);
  useEffect(() => {
    if (!eSignOn) {
      setReportSig(null);
      return;
    }
    let alive = true;
    buildReportSignature(eSignCanonical, report.eSignAt).then((s) => {
      if (alive) setReportSig(s);
    });
    return () => {
      alive = false;
    };
  }, [eSignOn, eSignCanonical, report.eSignAt]);
  // Nama terang penanda tangan (otomatis: nama pada TTD, atau nama pelaksana).
  const eSignerName = (profile.signatureName?.trim() || report.executor?.trim() || "Pelaksana");
  const eSignAtLabel = reportSig ? formatDateTime(reportSig.signedAt) : "";
  const eSignQr = useMemo(() => {
    if (!eSignOn || !reportSig) return null;
    try {
      const qr = qrcode(0, "M");
      qr.addData(
        reportQrPayload({
          number: report.number,
          total: report.total,
          code: reportSig.code,
          signer: eSignerName,
          signedAt: formatDateTime(reportSig.signedAt),
        }),
      );
      qr.make();
      return qr.createDataURL(10, 4);
    } catch {
      return null;
    }
  }, [eSignOn, reportSig, report.number, report.total, eSignerName]);

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
            <Image src={profile.logo} alt={profile.organization} width={260} height={116} className="max-h-[52px] w-auto object-contain" loading="eager" unoptimized />
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

      {/* Ringkasan Eksekutif — kartu ringkas di atas tabel (gaya LPJ korporat) */}
      {execSummaryOn && (
        <section className="mt-3 grid grid-cols-3 gap-2" style={{ breakInside: "avoid" }}>
          {[
            { label: "Total Serapan Anggaran", value: `Rp ${numberFmt.format(report.total)}` },
            { label: "Kegiatan Terlaksana", value: `${rows.length} kegiatan` },
            { label: "Periode Laporan", value: periodLabel(report) },
          ].map((c) => (
            <div key={c.label} className="rounded px-3 py-1.5" style={{ border: `1px solid ${line}`, borderLeft: `3px solid ${accent}`, background: "#ffffff" }}>
              <p className="text-[8px] font-semibold uppercase tracking-wide" style={{ color: inkMuted }}>{c.label}</p>
              <p className="text-[12px] font-bold" style={{ color: ink }}>{c.value}</p>
            </div>
          ))}
        </section>
      )}

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
                if (column.key === "photo" || column.key === "payment") {
                  // Foto kegiatan bisa lebih dari satu (mis. dua foto potret
                  // berdampingan agar rapi); bukti pembayaran tetap satu.
                  const sources =
                    column.key === "photo"
                      ? activityPhotos(activity)
                      : activity.paymentProof
                        ? [activity.paymentProof]
                        : [];
                  const placeholder = column.key === "photo" ? "(tempel foto di sini)" : "(tempel nota/kwitansi)";
                  const altBase =
                    column.key === "photo"
                      ? `Foto ${activity.activity || `kegiatan ${index + 1}`}`
                      : `Bukti pembayaran ${activity.activity || `kegiatan ${index + 1}`}`;
                  return (
                    <td key={column.key} className="align-middle p-1 text-center" style={borderStyle}>
                      {sources.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {sources.map((src, i) => (
                            <Image
                              key={i}
                              src={src}
                              alt={sources.length > 1 ? `${altBase} (${i + 1})` : altBase}
                              width={640}
                              height={440}
                              className="rounded-sm object-contain"
                              // Satu bukti → mempet memenuhi lebar kotak, tinggi mengikuti
                              // gambar sampai batas tinggi baris. Banyak foto → berdampingan.
                              style={
                                sources.length === 1
                                  ? { width: "100%", height: "auto", maxHeight: rowH }
                                  : { height: rowH, width: "auto", maxWidth: "100%" }
                              }
                              loading="eager"
                              unoptimized
                            />
                          ))}
                        </div>
                      ) : (
                        <span
                          className="flex items-center justify-center rounded-sm px-1 text-[8px]"
                          style={{ height: rowH, border: `1px dashed ${line}`, color: inkMuted }}
                        >
                          {placeholder}
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
                <td key={column.key} className={`${cellBase} text-center`} style={{ ...borderStyle, height: photoVisible ? rowH : 22 }}>
                  {column.key === "no" ? <span style={{ color: inkMuted }}>{rows.length + index + 1}</span> : <span>&nbsp;</span>}
                </td>
              ))}
            </tr>
          ))}

          {amountVisible && amountIndex >= 0 && (
            <tr style={{ background: totalBg, breakInside: "avoid" }}>
              {amountIndex > 0 && (
                <td colSpan={amountIndex} className="px-2 py-1 text-right text-[10px] font-bold" style={borderStyle}>
                  Total {profile.currencyLabel || "Nominal (Rp)"}
                </td>
              )}
              <td className="px-2 py-1 text-right text-[11px] font-bold" style={borderStyle}>
                {amountIndex === 0 ? `Total: ${numberFmt.format(report.total)}` : numberFmt.format(report.total)}
              </td>
              {columns.slice(amountIndex + 1).map((column) => (
                <td key={column.key} style={borderStyle} />
              ))}
            </tr>
          )}
        </tbody>
      </table>

      {/* Ringkasan bawah (opsional) */}
      {profile.showSummary && summary.length > 0 && (
        <section className="mt-4 flex flex-wrap gap-2" style={{ breakInside: "avoid" }}>
          {summary.map((item) => (
            <div key={item.label} className="rounded px-3 py-1.5" style={{ border: `1px solid ${line}`, background: "#ffffff" }}>
              <p className="text-[8px] uppercase tracking-wide" style={{ color: inkMuted }}>
                {item.label}
              </p>
              <p className="text-[10.5px] font-bold" style={{ color: ink }}>
                {item.value}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Blok Klaim Reimbursement (opsional) — instruksi pembayaran korporat */}
      {reimbursementOn && (
        <div className="my-6 rounded-md p-4" style={{ border: "1px solid #e5e7eb", background: "#f9fafb", breakInside: "avoid" }}>
          <p className="text-[11px] leading-relaxed" style={{ color: "#374151" }}>
            Berdasarkan rincian pelaksanaan program di atas, kami mengajukan permohonan penggantian dana operasional
            (reimbursement) sebesar <span className="font-bold" style={{ color: "#111827" }}>Rp {numberFmt.format(report.total)}</span>.
            Pembayaran dapat ditransfer ke rekening vendor pelaksana/agregator berikut:
          </p>
          <div className="mt-2 space-y-0.5 text-[11px] font-semibold" style={{ color: "#111827" }}>
            <div className="flex gap-2"><span className="w-[130px] shrink-0">Nama Bank</span><span>:</span><span>{profile.reimbursementBank?.trim() || "-"}</span></div>
            <div className="flex gap-2"><span className="w-[130px] shrink-0">Nomor Rekening</span><span>:</span><span>{profile.reimbursementAccount?.trim() || "-"}</span></div>
            <div className="flex gap-2"><span className="w-[130px] shrink-0">Atas Nama</span><span>:</span><span>{profile.reimbursementHolder?.trim() || "-"}</span></div>
          </div>
        </div>
      )}

      {/* Blok pengesahan — "Dibuat oleh" (kiri) & "Mengetahui/Menyetujui" (kanan) */}
      {(signExecutorOn || signApproverOn) && (
        <section className="mt-6 flex items-start justify-between gap-8" style={{ breakInside: "avoid" }}>
          {signExecutorOn ? (
            <ApprovalColumn
              lead="Dibuat oleh,"
              place={`${report.signPlace || profile.signaturePlace || "................................"}, ${formatLongDate(report.signDate)}`}
              role={profile.signatureRole}
              name={profile.signatureName || report.executor}
              signatureImage={profile.signatureImage}
              qr={eSignQr}
              signedLabel={eSignQr ? `${eSignerName} · ${eSignAtLabel}` : undefined}
            />
          ) : (
            <div />
          )}
          {signApproverOn && (
            <ApprovalColumn lead="Mengetahui/Menyetujui," role={profile.approverRole} name={profile.approverName} />
          )}
        </section>
      )}

      {/* Kaki halaman */}
      <footer
        className="mt-3 pt-1.5 text-[8px]"
        style={{ borderTop: `1px solid ${line}`, color: inkMuted }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            No. Dokumen: <span className="font-semibold">{report.number || "-"}</span>
          </span>
          <span>{profile.organization}</span>
          <span>Dicetak: {printedAt ?? "-"}</span>
        </div>
        {reportSig && (
          <p className="mt-1 break-all" style={{ color: "#9ca3af" }}>
            TTE oleh <span className="font-semibold">{eSignerName}</span> · {eSignAtLabel} · Kode:{" "}
            <span className="font-mono">{reportSig.code}</span> · {reportSig.algo} · Hash:{" "}
            <span className="font-mono">{reportSig.hash}</span>
          </p>
        )}
      </footer>
    </div>
  );
}

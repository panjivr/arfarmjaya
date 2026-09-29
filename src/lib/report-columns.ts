// Sumber kebenaran tunggal untuk kolom tabel laporan mingguan. Dipakai oleh
// dokumen cetak (weekly-report-document) dan modal pengaturan format agar
// keduanya selalu sepakat: kolom mana yang tampil dan berapa lebarnya.

import type { ReportColumnKey, ReportColumnSetting, ReportProfile } from "@/lib/types";

export type ColumnMeta = {
  key: ReportColumnKey;
  /** Label bawaan (kolom nominal bisa ditimpa currencyLabel profil). */
  label: string;
  align: "left" | "center" | "right";
  /** Bobot lebar bawaan bila pengguna belum mengatur lebar manual. */
  defaultWeight: number;
};

// Urutan kanonik kolom pada tabel laporan.
export const REPORT_COLUMN_META: ColumnMeta[] = [
  { key: "no", label: "No.", align: "center", defaultWeight: 4 },
  { key: "date", label: "Tanggal", align: "center", defaultWeight: 10 },
  { key: "activity", label: "Jenis Kegiatan", align: "left", defaultWeight: 16 },
  { key: "purpose", label: "Tujuan", align: "left", defaultWeight: 21 },
  { key: "hst", label: "Umur HST", align: "center", defaultWeight: 9 },
  { key: "amount", label: "Nominal (Rp)", align: "right", defaultWeight: 11 },
  { key: "output", label: "Output", align: "left", defaultWeight: 17 },
  { key: "photo", label: "Foto Kegiatan", align: "center", defaultWeight: 12 },
  { key: "payment", label: "Bukti Pembayaran\n(Nota / Kwitansi)", align: "center", defaultWeight: 12 },
];

// Kolom inti tanpa flag show* lama — dulu selalu tampil. Sekarang bisa disembunyikan.
const CORE_KEYS: ReportColumnKey[] = ["no", "date", "activity", "purpose"];

/** Visibilitas bawaan sebuah kolom untuk profil lama (tanpa `columns`). */
function legacyVisible(profile: ReportProfile, key: ReportColumnKey): boolean {
  switch (key) {
    case "hst":
      return profile.showHst !== false;
    case "amount":
      return profile.showAmount !== false;
    case "output":
      return profile.showOutput !== false;
    case "photo":
      return profile.showPhoto !== false;
    case "payment":
      return profile.showPayment !== false;
    default:
      return CORE_KEYS.includes(key); // no/date/activity/purpose
  }
}

/**
 * Kembalikan daftar kolom lengkap (9 kolom) beserta visibilitas & lebar tersimpan,
 * dalam urutan kanonik. Menggabungkan pengaturan `columns` profil dengan bawaan,
 * sehingga profil lama maupun konfigurasi sebagian tetap aman.
 */
export function ensureColumnSettings(profile: ReportProfile): ReportColumnSetting[] {
  const saved = new Map((profile.columns ?? []).map((c) => [c.key, c]));
  return REPORT_COLUMN_META.map((meta) => {
    const found = saved.get(meta.key);
    if (found) {
      return {
        key: meta.key,
        visible: found.visible !== false,
        width: Number.isFinite(found.width) && (found.width as number) > 0 ? found.width : undefined,
      };
    }
    return { key: meta.key, visible: legacyVisible(profile, meta.key), width: undefined };
  });
}

export type ResolvedColumn = {
  key: ReportColumnKey;
  label: string;
  align: "left" | "center" | "right";
  /** Lebar akhir dalam persen; seluruh kolom yang tampil berjumlah 100%. */
  widthPct: number;
};

/**
 * Kolom yang benar-benar dirender: hanya yang tampil, dengan lebar dinormalkan
 * ke 100%. Kolom yang lebarnya diatur manual memakai angka itu sebagai bobot;
 * kolom "otomatis" memakai bobot bawaannya. Semua lalu diskalakan agar total 100%.
 */
export function resolveReportColumns(profile: ReportProfile): ResolvedColumn[] {
  const settings = ensureColumnSettings(profile);
  const metaByKey = new Map(REPORT_COLUMN_META.map((m) => [m.key, m]));
  const visible = settings.filter((s) => s.visible);
  if (visible.length === 0) return [];

  const weightOf = (s: ReportColumnSetting) =>
    s.width && s.width > 0 ? s.width : metaByKey.get(s.key)!.defaultWeight;
  const total = visible.reduce((sum, s) => sum + weightOf(s), 0) || 1;

  return visible.map((s) => {
    const meta = metaByKey.get(s.key)!;
    const label = s.key === "amount" ? profile.currencyLabel?.trim() || meta.label : meta.label;
    return {
      key: s.key,
      label,
      align: meta.align,
      widthPct: (weightOf(s) / total) * 100,
    };
  });
}

export function columnLabel(key: ReportColumnKey): string {
  return (REPORT_COLUMN_META.find((m) => m.key === key)?.label ?? key).replace(/\n/g, " ");
}

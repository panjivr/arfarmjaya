import type { JournalCategory } from "@/lib/types";

export const JOURNAL_CATEGORIES: JournalCategory[] = [
  "Kualitas Air",
  "Kesehatan & Penyakit",
  "Perlakuan",
  "Cuaca",
  "Pemeliharaan",
  "Catatan Umum",
];

/** Warna badge per kategori jurnal (aman untuk mode gelap). */
export function journalTone(category: JournalCategory): string {
  switch (category) {
    case "Kualitas Air":
      return "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300";
    case "Kesehatan & Penyakit":
      return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";
    case "Perlakuan":
      return "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300";
    case "Cuaca":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
    case "Pemeliharaan":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

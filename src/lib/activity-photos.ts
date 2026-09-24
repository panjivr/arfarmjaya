import type { WeeklyActivity } from "@/lib/types";

type PhotoFields = Pick<WeeklyActivity, "photo" | "photos">;

/**
 * Daftar foto kegiatan, kompatibel mundur: laporan lama hanya punya `photo`
 * (satu foto), laporan baru memakai `photos` (banyak foto). Tidak ada data lama
 * yang hilang — `photo` tetap dibaca bila `photos` belum ada.
 */
export function activityPhotos(a: PhotoFields): string[] {
  if (Array.isArray(a.photos) && a.photos.length > 0) return a.photos.filter(Boolean);
  return a.photo ? [a.photo] : [];
}

/**
 * Menyimpan daftar foto sekaligus menjaga `photo` tetap terisi foto pertama,
 * supaya versi/ekspor lama yang membaca `photo` tetap berfungsi.
 */
export function setActivityPhotos<T extends PhotoFields>(activity: T, photos: string[]): T {
  const list = photos.filter(Boolean);
  return { ...activity, photos: list, photo: list[0] };
}

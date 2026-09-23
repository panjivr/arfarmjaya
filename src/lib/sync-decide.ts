// Keputusan sinkronisasi saat aplikasi dimuat. Dipisah sebagai fungsi murni
// agar bisa diuji: aturan yang salah di sini pernah membuat perangkat dengan
// data lama menimpa data server yang lebih baru.

export type SyncDecision = "push-local" | "adopt-server";

export type SyncInputs = {
  /** Snapshot lokal saat ini (serialized). */
  localStr: string;
  /** Snapshot lokal saat effect mulai — dipakai mendeteksi edit selama memuat. */
  baseline: string;
  /** Apakah server punya data. */
  hasServerData: boolean;
  /** updatedAt dari server sekarang. */
  serverUpdatedAt: string | null;
  /** updatedAt server saat perangkat ini terakhir sinkron. */
  metaSyncedAt?: string;
  /** Tanda tangan snapshot saat perangkat ini terakhir sinkron. */
  metaSig?: string;
  /** Tanda tangan snapshot lokal sekarang. */
  localSig: string;
  /** Jumlah record lokal & server (hanya untuk sinkron pertama kali). */
  localWeight: number;
  serverWeight: number;
};

export function decideSync(i: SyncInputs): SyncDecision {
  // Ada perubahan lokal selama proses memuat → jangan sampai hilang.
  if (i.localStr !== i.baseline) return "push-local";

  // Server belum punya data → perangkat ini jadi sumber awal.
  if (!i.hasServerData) return "push-local";

  // Perangkat ini belum pernah sinkron → yang datanya lebih banyak menang.
  if (!i.metaSyncedAt) return i.localWeight > i.serverWeight ? "push-local" : "adopt-server";

  // Sudah pernah sinkron. Mendorong data lokal hanya aman bila server TIDAK
  // berubah sejak sinkron terakhir perangkat ini; kalau server sudah berubah
  // (perangkat lain menulis), server yang menang agar data baru tidak tertimpa.
  const serverUnchanged = Boolean(i.serverUpdatedAt) && i.serverUpdatedAt === i.metaSyncedAt;
  if (serverUnchanged && i.metaSig && i.localSig !== i.metaSig) return "push-local";

  return "adopt-server";
}

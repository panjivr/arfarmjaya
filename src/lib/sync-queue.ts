export type SaveResult = { ok: boolean; message?: string };
export type SaveReply = { status: number; json: Record<string, unknown> };

/** Shared by automatic saves and explicit restore: one request at a time. */
export class SyncQueue {
  private revision?: string;
  private lastAck = "";
  private tail: Promise<unknown> = Promise.resolve();
  private stopped = false;
  private conflict = false;

  constructor(
    private send: (serialized: string, revision: string) => Promise<SaveReply>,
    private acknowledged: (serialized: string, reply: Record<string, unknown>) => void,
  ) {}

  initialize(revision: string, serialized = "") {
    this.revision = revision;
    this.lastAck = serialized;
  }
  stop() { this.stopped = true; }
  get acknowledgedSnapshot() { return this.lastAck; }

  save(serialized: string): Promise<SaveResult> {
    const task = this.tail.then(async (): Promise<SaveResult> => {
      if (this.stopped || !this.revision) return { ok: false, message: "Data server belum berhasil dimuat. Muat ulang sebelum menyimpan." };
      if (this.conflict) return { ok: false, message: "Ada konflik data. Unduh cadangan perangkat ini, lalu muat ulang dan rekonsiliasi perubahan sebelum menyimpan kembali." };
      if (serialized === this.lastAck) return { ok: true };
      try {
        const { status, json } = await this.send(serialized, this.revision);
        if (this.stopped) return { ok: false, message: "Sinkronisasi dihentikan." };
        if (status >= 200 && status < 300 && json.ok === true && json.partial !== true && typeof json.revision === "string" && typeof json.updatedAt === "string") {
          this.revision = json.revision;
          this.lastAck = serialized;
          this.acknowledged(serialized, json);
          return { ok: true };
        }
        if (status === 409 || status === 428) {
          this.conflict = true;
          return { ok: false, message: "Data server berubah di perangkat lain. Perubahan lokal dipertahankan. Unduh cadangan lokal sebelum memuat ulang dan rekonsiliasi data." };
        }
        return { ok: false, message: status === 401 ? "Sesi login berakhir. Masuk ulang untuk menyimpan." : status === 403 ? "Perubahan ditolak karena izin akun tidak sesuai." : json.db === false ? "Database server tidak aktif. Data belum tersimpan ke server." : `Gagal menyimpan ke server (HTTP ${status}).` };
      } catch {
        return { ok: false, message: "Tidak terhubung ke server. Perubahan belum dikonfirmasi tersimpan." };
      }
    });
    this.tail = task;
    return task;
  }
}

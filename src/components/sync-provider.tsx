"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useUiStore, factorySnapshot } from "@/lib/store";
import { decideSync } from "@/lib/sync-decide";

import { WORKSPACE_KEYS, parseWorkspace, canonicalJson, isPristineSnapshot } from "@/lib/workspace-data";
import { preserveLocalSnapshot, useStorageHealth } from "@/lib/local-persistence";
import { SyncQueue, type SaveResult } from "@/lib/sync-queue";
export { readLocalBackup } from "@/lib/local-persistence";

type Snapshot = Record<string, unknown>;

/** Serialisasi → byte, di-gzip bila browser mendukung (mengecilkan kiriman). */
async function toBytes(serialized: string): Promise<{ bytes: Uint8Array; gzip: boolean }> {
  try {
    if (typeof CompressionStream !== "undefined") {
      const stream = new Blob([serialized]).stream().pipeThrough(new CompressionStream("gzip"));
      const ab = await new Response(stream).arrayBuffer();
      return { bytes: new Uint8Array(ab), gzip: true };
    }
  } catch {
    /* fallback tanpa gzip */
  }
  return { bytes: new TextEncoder().encode(serialized), gzip: false };
}

// Batas aman per request di bawah limit server (Vercel ~4.5 MB). Data yang lebih
// besar dikirim bertahap (chunk) & disusun ulang di server → tanpa batas total.
const CHUNK_LIMIT = 3_500_000;

/**
 * Kirim seluruh state ke server. Otomatis gzip; bila masih lebih besar dari
 * batas request, dipecah menjadi beberapa potongan (chunk). Mengembalikan
 * status HTTP terakhir + JSON balasan, agar pemanggil menangani sukses/gagal.
 */
async function sendChunked(url: string, method: string, serialized: string, headers: Record<string, string>): Promise<{ status: number; json: Record<string, unknown> }> {
  const { bytes, gzip } = await toBytes(serialized);
  const base: Record<string, string> = { "Content-Type": "application/octet-stream", ...headers, ...(gzip ? { "x-encoding": "gzip" } : {}) };

  if (bytes.length <= CHUNK_LIMIT) {
    const res = await fetch(url, { method, headers: base, body: bytes as unknown as BodyInit });
    return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  }

  const uploadId = (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)).replace(/-/g, "");
  const total = Math.ceil(bytes.length / CHUNK_LIMIT);
  let last: { status: number; json: Record<string, unknown> } = { status: 0, json: {} };
  for (let i = 0; i < total; i++) {
    const chunk = bytes.subarray(i * CHUNK_LIMIT, Math.min((i + 1) * CHUNK_LIMIT, bytes.length));
    const res = await fetch(url, {
      method,
      headers: { ...base, "x-upload-id": uploadId, "x-chunk-index": String(i), "x-chunk-total": String(total) },
      body: chunk as unknown as BodyInit,
    });
    last = { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
    if (!res.ok || last.json?.ok === false) return last; // batalkan bila ada potongan gagal
  }
  return last;
}

async function sendStateRequest(serialized: string, revision: string): Promise<{ status: number; json: Record<string, unknown> }> {
  return sendChunked("/api/state", "PUT", serialized, { "x-base-revision": revision });
}

/**
 * Unggah snapshot perangkat sebagai salinan pemulihan di server (baris
 * "recovery:" — tidak mengubah data utama). Dipakai pemulihan konflik
 * otomatis agar data perangkat tidak hilang tanpa pengguna mengunduh berkas.
 */
async function uploadRecoveryCopy(serialized: string): Promise<{ ok: boolean; id?: string; updatedAt?: string }> {
  try {
    const { status, json } = await sendChunked("/api/backup", "POST", serialized, {});
    if (status >= 200 && status < 300 && json.ok === true && json.partial !== true && typeof json.id === "string") {
      return { ok: true, id: json.id, updatedAt: typeof json.updatedAt === "string" ? json.updatedAt : undefined };
    }
  } catch { /* jaringan gagal — pemulihan otomatis tidak dilakukan */ }
  return { ok: false };
}

function snapshot(state: Record<string, unknown>): Snapshot {
  const out: Snapshot = {};
  for (const key of WORKSPACE_KEYS) out[key] = state[key];
  return out;
}

// Hash cepat (cyrb53) untuk menandai isi snapshot terakhir yang sudah sinkron.
function sig(str: string): string {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

const META_KEY = "arfarmjaya-sync-meta-v2";
type Meta = { syncedAt?: string; sig?: string; cacheFailed?: boolean };
// Per-tab metadata: another tab must never advance this tab's write revision.
function readMeta(): Meta {
  try { return JSON.parse(sessionStorage.getItem(META_KEY) || "{}") as Meta; } catch { return {}; }
}
function writeMeta(meta: Meta) {
  try { sessionStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* next load will preserve a backup before adopting */ }
}

export type SyncStatusValue = "idle" | "saving" | "saved" | "error";
type SyncStatusState = {
  status: SyncStatusValue;
  at?: string;
  message?: string;
  /** Informasi non-error, mis. pemberitahuan pemulihan konflik otomatis. */
  notice?: string;
  serverUpdatedAt?: string;
  setStatus: (patch: Partial<Omit<SyncStatusState, "setStatus">>) => void;
};
export const useSyncStatus = create<SyncStatusState>((set) => ({ status: "idle", setStatus: (patch) => set(patch) }));
let activeSave: (() => Promise<SaveResult>) | undefined;
export async function syncNow(): Promise<SaveResult> {
  return activeSave ? activeSave() : { ok: false, message: "Sinkronisasi belum siap. Masuk dan tunggu data server berhasil dimuat." };
}

export function reloadFromServer(fileBackupReady = false): SaveResult {
  const data = snapshot(useUiStore.getState() as unknown as Record<string, unknown>);
  // A downloaded backup file is an equally durable safety copy — more durable
  // than local storage, in fact. When the device storage is too full to hold
  // another full snapshot, a completed download in this dialog may stand in
  // for the local snapshot instead of blocking recovery forever.
  if (!preserveLocalSnapshot(data) && !fileBackupReady) return { ok: false, message: "Cadangan lokal gagal disimpan (penyimpanan perangkat penuh). Unduh cadangan terlebih dahulu lewat tombol Unduh cadangan lokal — setelah berkasnya terunduh, tombol ini bisa melanjutkan." };
  try { sessionStorage.removeItem(META_KEY); }
  catch { return { ok: false, message: "Metadata perangkat tidak dapat diperbarui. Periksa izin penyimpanan browser." }; }
  window.location.reload();
  return { ok: true };
}

export function SyncProvider() {
  const hasHydrated = useUiStore((s) => s.hasHydrated);
  const userId = useUiStore((s) => s.user?.id ?? null);

  useEffect(() => {
    if (!hasHydrated || !userId) return;
    let cancelled = false;
    let ready = false;
    let applyingServer = false;
    let pending = 0;
    let initializing: Promise<void> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const snap = () => snapshot(useUiStore.getState() as unknown as Record<string, unknown>);
    const baseline = canonicalJson(snap());
    const meta = readMeta();
    const setStatus = useSyncStatus.getState().setStatus;
    setStatus({ status: "idle", message: "Memeriksa data server…", notice: undefined, serverUpdatedAt: undefined });
    const queue = new SyncQueue(sendStateRequest, (serialized, reply) => {
      writeMeta({ syncedAt: reply.updatedAt as string, sig: sig(serialized), cacheFailed: Boolean(useStorageHealth.getState().error) });
      setStatus({ serverUpdatedAt: reply.updatedAt as string });
    });

    async function save(): Promise<SaveResult> {
      if (!ready || cancelled) return { ok: false, message: "Data server belum siap atau terjadi konflik. Unduh cadangan lokal sebelum memuat ulang." };
      const serialized = canonicalJson(snap());
      pending++;
      setStatus({ status: "saving", message: undefined });
      const result = await queue.save(serialized);
      pending--;
      if (!cancelled) {
        const current = canonicalJson(snap());
        setStatus({ status: result.ok ? (pending || current !== queue.acknowledgedSnapshot ? "saving" : "saved") : "error", at: new Date().toISOString(), message: result.message });
      }
      return result;
    }
    const saveOrInitialize = async (): Promise<SaveResult> => {
      // An explicit retry after a conflict must re-read the server first: the
      // queue alone keeps refusing with the revision that already failed.
      if (!ready || queue.hasConflict) await initialize();
      return save();
    };
    activeSave = saveOrInitialize;
    const schedule = () => {
      if (!ready || applyingServer || cancelled) return;
      if (canonicalJson(snap()) === queue.acknowledgedSnapshot) return;
      setStatus({ status: "saving", message: undefined });
      clearTimeout(timer);
      timer = setTimeout(() => { void save(); }, 700);
    };
    const unsubscribe = useUiStore.subscribe(schedule);
    const flush = () => {
      if (!ready || canonicalJson(snap()) === queue.acknowledgedSnapshot) return;
      clearTimeout(timer);
      void save();
    };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    const onOnline = () => { if (ready) flush(); else void initialize(); };
    window.addEventListener("online", onOnline);
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (useSyncStatus.getState().status !== "saved") { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    async function load() {
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        const json = await response.json();
        if (!response.ok || json.db !== true || typeof json.revision !== "string" || !(json.data === null || (json.data && typeof json.updatedAt === "string"))) {
          throw new Error(response.status === 401 ? "Sesi login berakhir. Masuk ulang." : "Database server tidak dapat dibaca. Tidak ada data yang ditimpa atau dikirim.");
        }
        if (cancelled) return;
        const serverData = json.data === null ? null : parseWorkspace(json.data);
        const localData = snap();
        const localStr = canonicalJson(localData);
        let decision = decideSync({ localStr, baseline, hasServerData: Boolean(serverData), serverStr: serverData ? canonicalJson(serverData) : undefined, serverUpdatedAt: json.updatedAt ?? null,
          metaSyncedAt: meta.syncedAt, metaSig: meta.sig, metaCacheFailed: meta.cacheFailed, localPristine: isPristineSnapshot(localData, factorySnapshot()), localSig: sig(localStr) });
        let recovery: { id: string; updatedAt?: string } | undefined;
        if (decision === "conflict" && serverData) {
          // Pemulihan konflik otomatis: salinan data perangkat disimpan ke
          // server terlebih dahulu (baris "recovery:"); sesudah aman di
          // server, data server dimuat. Data perangkat tidak hilang dan
          // pengguna tidak perlu mengunduh atau merekonsiliasi apa pun
          // secara manual. Bila unggahan gagal (mis. tidak ada koneksi),
          // perilaku lama berlaku: konflik dipertahankan, data lokal utuh.
          const uploaded = await uploadRecoveryCopy(localStr);
          if (uploaded.ok && uploaded.id) {
            recovery = { id: uploaded.id, updatedAt: uploaded.updatedAt };
            decision = "adopt-server";
          }
        }
        if (decision === "conflict") throw new Error("Perubahan lokal berbeda dengan versi server dan salinan pemulihan belum dapat disimpan ke server. Data lokal dipertahankan; periksa koneksi Anda lalu coba lagi.");
        if (decision === "adopt-server" && serverData) {
          // Never drop fields unknown to this browser (e.g. an older client).
          const unknown = Object.keys(json.data).filter((key) => !(WORKSPACE_KEYS as readonly string[]).includes(key));
          if (unknown.length) throw new Error("Versi data server berbeda. Perbarui aplikasi sebelum menyimpan.");
          if (localStr !== canonicalJson(serverData) && !preserveLocalSnapshot(snap()) && !recovery) throw new Error("Cadangan lokal gagal dibuat. Data perangkat dipertahankan; unduh cadangan dan kosongkan ruang penyimpanan sebelum memuat ulang.");
          applyingServer = true;
          useUiStore.setState(serverData);
          applyingServer = false;
          const adopted = canonicalJson(snap());
          queue.initialize(json.revision, adopted);
          writeMeta({ syncedAt: json.updatedAt, sig: sig(adopted), cacheFailed: Boolean(useStorageHealth.getState().error) });
          ready = true;
          if (recovery) {
            useUiStore.getState().audit("Pemulihan otomatis", "Sinkronisasi", `Data perangkat berbeda dengan server; salinan perangkat disimpan di server (${recovery.id}) dan data server dimuat.`);
            setStatus({ status: "saved", at: new Date().toISOString(), message: undefined, serverUpdatedAt: json.updatedAt,
              notice: "Data di perangkat ini berbeda dengan data server, jadi sistem menyimpan salinan data perangkat ke server sebagai salinan pemulihan lalu memuat data server. Tidak ada data yang hilang — admin dapat meninjau salinan pemulihan di Pengaturan → Cadangan & Pemulihan." });
          } else {
            setStatus({ status: "saved", at: new Date().toISOString(), message: undefined, serverUpdatedAt: json.updatedAt });
          }
        } else {
          queue.initialize(json.revision);
          ready = true;
          await save();
        }
      } catch (error) {
        if (!cancelled) setStatus({ status: "error", message: error instanceof Error ? error.message : "Data server gagal dimuat. Perubahan lokal dipertahankan." });
      }
    }
    function initialize(): Promise<void> {
      if (cancelled) return Promise.resolve();
      if (!initializing) initializing = load().finally(() => { initializing = undefined; });
      return initializing;
    }
    void initialize();

    return () => {
      cancelled = true;
      ready = false;
      queue.stop();
      if (activeSave === saveOrInitialize) activeSave = undefined;
      clearTimeout(timer);
      unsubscribe();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [hasHydrated, userId]);
  return null;
}

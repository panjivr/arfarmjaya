"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useUiStore } from "@/lib/store";
import { decideSync } from "@/lib/sync-decide";

import { WORKSPACE_KEYS, parseWorkspace, canonicalJson } from "@/lib/workspace-data";
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
async function sendStateRequest(serialized: string, revision: string): Promise<{ status: number; json: Record<string, unknown> }> {
  const { bytes, gzip } = await toBytes(serialized);
  const enc: Record<string, string> = gzip ? { "x-encoding": "gzip" } : {};
  const base: Record<string, string> = { "Content-Type": "application/octet-stream", "x-base-revision": revision, ...enc };

  if (bytes.length <= CHUNK_LIMIT) {
    const res = await fetch("/api/state", { method: "PUT", headers: base, body: bytes as unknown as BodyInit });
    return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  }

  const uploadId = (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)).replace(/-/g, "");
  const total = Math.ceil(bytes.length / CHUNK_LIMIT);
  let last: { status: number; json: Record<string, unknown> } = { status: 0, json: {} };
  for (let i = 0; i < total; i++) {
    const chunk = bytes.subarray(i * CHUNK_LIMIT, Math.min((i + 1) * CHUNK_LIMIT, bytes.length));
    const res = await fetch("/api/state", {
      method: "PUT",
      headers: { ...base, "x-upload-id": uploadId, "x-chunk-index": String(i), "x-chunk-total": String(total) },
      body: chunk as unknown as BodyInit,
    });
    last = { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
    if (!res.ok || last.json?.ok === false) return last; // batalkan bila ada potongan gagal
  }
  return last;
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
  serverUpdatedAt?: string;
  setStatus: (patch: Partial<Omit<SyncStatusState, "setStatus">>) => void;
};
export const useSyncStatus = create<SyncStatusState>((set) => ({ status: "idle", setStatus: (patch) => set(patch) }));
let activeSave: (() => Promise<SaveResult>) | undefined;
export async function syncNow(): Promise<SaveResult> {
  return activeSave ? activeSave() : { ok: false, message: "Sinkronisasi belum siap. Masuk dan tunggu data server berhasil dimuat." };
}

export function reloadFromServer(): SaveResult {
  const data = snapshot(useUiStore.getState() as unknown as Record<string, unknown>);
  if (!preserveLocalSnapshot(data)) return { ok: false, message: "Cadangan lokal gagal disimpan. Unduh cadangan dan kosongkan ruang penyimpanan sebelum memuat data server." };
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
    setStatus({ status: "idle", message: "Memeriksa data server…", serverUpdatedAt: undefined });
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
      if (!ready) await initialize();
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
        const localStr = canonicalJson(snap());
        const decision = decideSync({ localStr, baseline, hasServerData: Boolean(serverData), serverStr: serverData ? canonicalJson(serverData) : undefined, serverUpdatedAt: json.updatedAt ?? null,
          metaSyncedAt: meta.syncedAt, metaSig: meta.sig, metaCacheFailed: meta.cacheFailed, localSig: sig(localStr) });
        if (decision === "conflict") throw new Error("Perubahan lokal berbeda dengan versi server. Data lokal dipertahankan; unduh cadangan sebelum memuat ulang dan rekonsiliasi data.");
        if (decision === "adopt-server" && serverData) {
          // Never drop fields unknown to this browser (e.g. an older client).
          const unknown = Object.keys(json.data).filter((key) => !(WORKSPACE_KEYS as readonly string[]).includes(key));
          if (unknown.length) throw new Error("Versi data server berbeda. Perbarui aplikasi sebelum menyimpan.");
          if (localStr !== canonicalJson(serverData) && !preserveLocalSnapshot(snap())) throw new Error("Cadangan lokal gagal dibuat. Data perangkat dipertahankan; unduh cadangan dan kosongkan ruang penyimpanan sebelum memuat ulang.");
          applyingServer = true;
          useUiStore.setState(serverData);
          applyingServer = false;
          const adopted = canonicalJson(snap());
          queue.initialize(json.revision, adopted);
          writeMeta({ syncedAt: json.updatedAt, sig: sig(adopted), cacheFailed: Boolean(useStorageHealth.getState().error) });
          ready = true;
          setStatus({ status: "saved", at: new Date().toISOString(), message: undefined, serverUpdatedAt: json.updatedAt });
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

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { create } from "zustand";
import { useUiStore } from "@/lib/store";
import { COLLECTIONS, makeOperations, type Collection, type Snapshot, type Versions } from "@/lib/workspace-protocol";
import { readDraft, writeDraft, type Draft } from "@/lib/workspace-draft";

export type SyncStatusValue = "idle" | "saving" | "saved" | "error";
type SyncStatusState = { status: SyncStatusValue; at?: string; message?: string; serverUpdatedAt?: string; setStatus: (patch: Partial<Omit<SyncStatusState, "setStatus">>) => void };
export const useSyncStatus = create<SyncStatusState>(set => ({ status: "idle", setStatus: patch => set(patch) }));
let saveNow: (() => Promise<{ ok: boolean; message?: string }>) | undefined;
let retryLoad: (() => Promise<void>) | undefined;
let discardDraft: (() => Promise<void>) | undefined;
const BACKUP_KEY = "arfarmjaya-local-backup";
export function readLocalBackup(): { at: string; data: Record<string, unknown> } | null {
  try { return JSON.parse(localStorage.getItem(BACKUP_KEY) || "null"); } catch { return null; }
}
function snapshot(): Snapshot {
  const state = useUiStore.getState() as unknown as Record<string, unknown>;
  return JSON.parse(JSON.stringify(Object.fromEntries(COLLECTIONS.map(key => [key, state[key]])))) as Snapshot;
}
function stash(data: Snapshot) {
  try { if (localStorage.getItem(BACKUP_KEY)) return; localStorage.setItem(BACKUP_KEY, JSON.stringify({ at: new Date().toISOString(), data })); } catch { /* IndexedDB journal remains authoritative for new drafts. */ }
}
export async function syncNow(): Promise<{ ok: boolean; message?: string }> {
  return saveNow ? saveNow() : { ok: false, message: "Data server belum dimuat. Jangan tutup halaman." };
}
export async function retryWorkspace() { await retryLoad?.(); }
export async function discardWorkspaceDraft() { await discardDraft?.(); }
export async function downloadWorkspaceDraft() {
  const uid = useUiStore.getState().user?.id;
  const draft = uid ? await readDraft(uid) : undefined;
  const blob = new Blob([JSON.stringify(draft ?? { next: snapshot() }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `arfarmjaya-draf-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function jsonRequest(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(30000) });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}
function message(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  if (code === "record_conflict") return "Catatan yang sama berubah di perangkat lain. Draf tetap disimpan; unduh draf sebelum memuat data server.";
  if (code === "unauthorized") return "Sesi berakhir. Masuk ulang; draf tetap disimpan pada perangkat ini.";
  if (code === "storage_upgrade_pending") return "Penyimpanan sedang disiapkan. Admin perlu menyelesaikan aktivasi database.";
  if (code === "workspace_not_initialized") return "Database belum berisi workspace. Admin perlu memulihkan cadangan sebelum aplikasi digunakan.";
  if (code === "payload_too_large") return "Perubahan terlalu besar. Kurangi lampiran; draf tetap tersimpan.";
  return "Belum tersimpan ke server. Periksa koneksi lalu coba lagi; jangan hapus data browser.";
}

export function SyncProvider() {
  const pathname = usePathname();
  const active = pathname !== "/" && pathname !== "/login";
  const hydrated = useUiStore(s => s.hasHydrated);
  const userId = useUiStore(s => s.user?.id ?? null);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const status = useSyncStatus(s => s.status);
  const errorMessage = useSyncStatus(s => s.message);
  useEffect(() => {
    if (!hydrated || !userId || !active) return;
    const uid = userId;
    let cancelled = false, initialized = false, applying = false;
    let base: Snapshot = {}, versions: Versions = {}, allowed: Collection[] = [];
    let pending: Draft | undefined;
    let ownsLock = false;
    let releaseLock: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let flight: Promise<{ ok: boolean; message?: string }> | undefined;
    let journal = Promise.resolve();
    const setStatus = useSyncStatus.getState().setStatus;
    const fail = (error: unknown) => { const text = message(error); setStatus({ status: "error", message: text }); return { ok: false, message: text }; };
    // All journal writes are ordered. A local durability error prevents network writes.
    const persist = (draft?: Draft) => {
      journal = journal.catch(() => {}).then(() => writeDraft(uid, draft));
      return journal;
    };
    function stage() {
      pending = { base, versions, next: snapshot(), at: new Date().toISOString(), request: pending?.request };
      setStatus({ status: "saving", message: "Menunggu konfirmasi server." });
      return persist(pending);
    }
    async function push(): Promise<{ ok: boolean; message?: string }> {
      if (!initialized || !ownsLock) return { ok: false, message: "Data server belum dimuat." };
      if (flight) return flight;
      flight = (async () => {
        try {
          while (!cancelled) {
            const next = snapshot();
            const operations = pending?.request?.operations ?? makeOperations(base, next, versions, allowed);
            if (!operations.length) {
              pending = undefined; await persist();
              setStatus({ status: "saved", message: undefined });
              return { ok: true };
            }
            if (operations.length > 5000) throw new Error("payload_too_large");
            const request = pending?.request ?? { requestId: crypto.randomUUID(), operations };
            // Retain exactly the sent state for an idempotent retry after a lost response.
            const sent = pending?.request ? pending.base : base;
            const sentNext = pending?.request ? applyOperations(sent, request.operations) : next;
            pending = { base: sent, next, versions, request, at: new Date().toISOString() };
            await persist(pending);
            if (cancelled) return { ok: false, message: "Draf disimpan." };
            const body = JSON.stringify(request);
            if (new Blob([body]).size > 3_500_000) throw new Error("payload_too_large");
            const result = await jsonRequest("/api/state", { method: "PATCH", headers: { "Content-Type": "application/json" }, body });
            if (cancelled) return { ok: false, message: "Draf disimpan; konfirmasi dilanjutkan saat dibuka kembali." };
            if (!result.ok || !result.versions) throw new Error("invalid_response");
            base = sentNext;
            versions = { ...versions, ...result.versions };
            pending = { base, next: snapshot(), versions, at: new Date().toISOString() };
            await persist(pending);
            setStatus({ serverUpdatedAt: result.updatedAt, at: new Date().toISOString() });
          }
          return { ok: false, message: "Halaman ditutup; draf disimpan." };
        } catch (error) { return fail(error); }
      })().finally(() => { flight = undefined; });
      return flight;
    }
    async function load() {
      if (flight || cancelled || !ownsLock) return;
      initialized = false; setBlocked(true); setLoading(true);
      try {
        pending = await readDraft(uid);
        const result = await jsonRequest("/api/state");
        if (cancelled) return;
        if (result.protocol !== 2 || !result.data || !result.versions || !Array.isArray(result.writable)) throw new Error("invalid_response");
        allowed = result.writable;
        if (pending) {
          // Do not re-expose cached fields after an account's role was reduced.
          const visible = Object.keys(result.data);
          pending = { ...pending, next: Object.fromEntries(Object.entries(pending.next).filter(([key]) => visible.includes(key))) };
        }
        stash(snapshot()); // Preserve legacy browser data; never automatically upload it.
        base = pending?.base ?? result.data;
        versions = pending?.versions ?? result.versions;
        // Clear hidden collections as well when changing users on the same device.
        const cleared = Object.fromEntries(COLLECTIONS.map(k => [k, k === "settings" ? {} : []]));
        applying = true;
        useUiStore.setState({ ...cleared, ...result.data, ...(pending?.next ?? {}) } as never);
        applying = false;
        initialized = true;
        setBlocked(false);
        setStatus({ status: pending ? "saving" : "saved", message: undefined, serverUpdatedAt: result.updatedAt });
        if (pending) await push();
      } catch (error) { fail(error); } finally { if (!cancelled) setLoading(false); }
    }
    const unsub = useUiStore.subscribe((state, previous) => {
      if (!initialized || applying || cancelled) return;
      if (!allowed.some(k => state[k] !== previous[k])) return;
      // Persist immediately, without waiting for the network debounce.
      stage().catch(error => fail(error));
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { void push(); }, 700);
    });
    saveNow = push;
    retryLoad = async () => { if (!ownsLock) await acquire(); else if (!initialized) await load(); else await push(); };
    discardDraft = async () => {
      if (flight) return;
      // The user explicitly selects server data after downloading their draft.
      await downloadWorkspaceDraft();
      await persist(); pending = undefined;
      await load();
    };
    const onOnline = () => { void retryLoad?.(); };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pending || flight) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
    // Read fresh server data on focus only when there are no unsaved edits.
    const onFocus = () => { if (initialized && !pending && !flight) void load(); };
    window.addEventListener("focus", onFocus);
    async function acquire() {
      setBlocked(true);
      if (!navigator.locks) {
        setStatus({ status: "error", message: "Browser ini belum mendukung perlindungan draf. Gunakan Chrome, Edge, atau Safari versi terbaru." });
        return;
      }
      void navigator.locks.request(`arfarmjaya-editor:${uid}`, { ifAvailable: true }, async lock => {
        if (cancelled) return;
        if (!lock) {
          setStatus({ status: "error", message: "Aplikasi sedang dibuka di tab lain. Tutup tab tersebut lalu coba lagi agar draf tidak saling menimpa." });
          return;
        }
        ownsLock = true;
        const released = new Promise<void>(resolve => { releaseLock = resolve; });
        await load();
        await released;
      }).catch(error => { if (!cancelled) fail(error); });
    }
    void acquire();
    return () => {
      cancelled = true; if (timer) clearTimeout(timer); unsub();
      window.removeEventListener("online", onOnline); window.removeEventListener("beforeunload", onBeforeUnload); window.removeEventListener("focus", onFocus);
      void journal.catch(() => {}).finally(() => releaseLock?.());
      saveNow = undefined; retryLoad = undefined; discardDraft = undefined;
    };
  }, [hydrated, userId, active]);
  if (!active || !blocked || !userId) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6"><div className="max-w-lg rounded-xl bg-white p-6 text-slate-900" role="alert"><h2 className="mb-3 text-lg font-bold">{loading ? "Memuat data server…" : "Data server belum tersedia"}</h2><p>{status === "error" ? errorMessage : "Tunggu sampai data berhasil dimuat sebelum mengubah catatan."}</p><button className="mt-4 rounded bg-emerald-700 px-4 py-2 text-white" disabled={loading} onClick={() => void retryWorkspace()}>Coba lagi</button></div></div>;
}
function applyOperations(base: Snapshot, operations: import("@/lib/workspace-protocol").Operation[]): Snapshot {
  const next = { ...base };
  for (const op of operations) {
    if (op.collection === "settings") { next.settings = op.data; continue; }
    const values = [...(next[op.collection] as unknown[] ?? [])];
    const identify = (v: unknown) => op.collection === "readNotifications" ? v : op.collection === "products" ? (v as { sku: string }).sku : (v as { id: string }).id;
    const index = values.findIndex(v => identify(v) === op.id);
    if (index >= 0) { if (op.data === null) values.splice(index, 1); else values[index] = op.data; }
    else if (op.data !== null) values.push(op.data);
    next[op.collection] = values;
  }
  return next;
}

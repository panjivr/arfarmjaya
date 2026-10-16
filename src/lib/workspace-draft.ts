import type { Operation, Snapshot, Versions } from "@/lib/workspace-protocol";
export type Draft = { base: Snapshot; next: Snapshot; versions: Versions; request?: { requestId: string; operations: Operation[] }; at: string };
const DB = "arfarmjaya-drafts";
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("drafts");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function readDraft(userId: string): Promise<Draft | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("drafts", "readonly");
      const req = tx.objectStore("drafts").get(userId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally { db.close(); }
}
export async function writeDraft(userId: string, draft?: Draft): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      if (draft) tx.objectStore("drafts").put(draft, userId);
      else tx.objectStore("drafts").delete(userId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

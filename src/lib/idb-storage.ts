/**
 * Penyimpanan key-value asinkron di atas IndexedDB.
 *
 * localStorage terbatas ±5–10 MB per origin dan dataset aplikasi ini sudah
 * ±5,4 MB — satu salinan persist saja nyaris memenuhi kuota, sehingga
 * penulisan cache lokal rutin gagal ("penyimpanan penuh"). IndexedDB
 * menyediakan ruang yang jauh lebih besar dan memang dirancang untuk data
 * aplikasi sebesar ini.
 */
export type KvBackend = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

const DB_NAME = "arfarmjaya-db";
const STORE_NAME = "kv";

let dbPromise: Promise<IDBDatabase> | null = null;
function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("indexeddb_open_failed"));
    });
  }
  return dbPromise;
}

async function idbRequest<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const request = run(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexeddb_request_failed"));
  });
}

/** Backend IndexedDB asli (browser). Di luar browser semua operasi kosong. */
export const indexedDbBackend: KvBackend = {
  async get(key) {
    if (typeof indexedDB === "undefined") return null;
    const value = await idbRequest("readonly", (store) => store.get(key));
    return typeof value === "string" ? value : null;
  },
  async set(key, value) {
    if (typeof indexedDB === "undefined") return;
    await idbRequest("readwrite", (store) => store.put(value, key));
  },
  async remove(key) {
    if (typeof indexedDB === "undefined") return;
    await idbRequest("readwrite", (store) => store.delete(key));
  },
};

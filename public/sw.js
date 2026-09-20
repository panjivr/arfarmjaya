/* AR FARM JAYA — Service Worker
 * Strategi:
 *  - Navigasi (halaman): network-first, fallback ke cache lalu halaman offline.
 *  - Aset statis Next (/_next/static): cache-first (immutable, aman).
 *  - API (/api/*): SELALU network, tidak pernah di-cache (data harus real-time).
 * Versi cache dinaikkan saat rilis → cache lama otomatis dibersihkan.
 */
const CACHE = "arfarmjaya-v1";
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL])).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API tidak pernah di-cache — biar data selalu segar dari server.
  if (url.pathname.startsWith("/api/")) return;

  // Navigasi halaman → network-first agar build terbaru langsung terpakai.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL)) || Response.error()),
    );
    return;
  }

  // Aset statis Next → cache-first (di-hash, immutable).
  if (url.pathname.startsWith("/_next/static") || /\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
            return res;
          }),
      ),
    );
  }
});

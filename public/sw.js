/* AR FARM JAYA — Service Worker (v2, self-healing)
 * Prinsip: SELALU utamakan jaringan (network-first) untuk semua permintaan GET,
 * cache hanya sebagai cadangan saat offline. Ini mencegah "aplikasi ke-cache
 * versi lama" setelah deploy — penyebab halaman termuat tapi tidak bisa diklik.
 * API tidak pernah di-cache. Saat aktif, SEMUA cache lama dibersihkan.
 */
const CACHE = "arfarmjaya-v2";

self.addEventListener("install", () => {
  // Versi baru langsung mengambil alih tanpa menunggu tab lama ditutup.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Bersihkan SEMUA cache lama supaya aset usang tidak lagi disajikan.
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // POST login/logout dll. lewat apa adanya

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // data selalu langsung ke server

  const isAsset =
    request.mode === "navigate" ||
    url.pathname.startsWith("/_next/") ||
    /\.(?:png|jpg|jpeg|svg|ico|webp|woff2?|css|js)$/.test(url.pathname);

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(request);
        if (res && res.status === 200 && isAsset) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") return (await caches.match("/")) || Response.error();
        return Response.error();
      }
    })(),
  );
});

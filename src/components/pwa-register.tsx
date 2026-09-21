"use client";

import { useEffect } from "react";

// Mendaftarkan service worker (installable) DAN memastikan versi baru langsung
// dipakai: begitu SW baru mengambil alih, halaman dimuat ulang sekali agar
// pengguna tidak terjebak pada aset lama yang ter-cache. Juga memulihkan diri
// otomatis dari error memuat chunk (aset usang) dengan reload sekali.
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Pemulihan dari aset/chunk usang: reload sekali (dijaga agar tak berulang).
    const recoverFromStaleChunk = (message: string) => {
      if (!/ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed/i.test(message)) return;
      try {
        if (!sessionStorage.getItem("arfj-chunk-reload")) {
          sessionStorage.setItem("arfj-chunk-reload", "1");
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    };
    const onError = (e: ErrorEvent) => recoverFromStaleChunk(e?.message || "");
    const onRejection = (e: PromiseRejectionEvent) => recoverFromStaleChunk(String(e?.reason?.message || e?.reason || ""));
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return () => {
        window.removeEventListener("error", onError);
        window.removeEventListener("unhandledrejection", onRejection);
      };
    }

    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.update().catch(() => {});
          reg.addEventListener("updatefound", () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener("statechange", () => {
              // Versi baru siap & sudah ada SW yang mengontrol → aktifkan segera.
              if (nw.state === "installed" && navigator.serviceWorker.controller) {
                nw.postMessage("SKIP_WAITING");
              }
            });
          });
        })
        .catch(() => {});
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}

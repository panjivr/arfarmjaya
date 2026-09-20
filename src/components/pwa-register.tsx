"use client";

import { useEffect } from "react";

// Mendaftarkan service worker agar aplikasi bisa dipasang (installable) dan
// tetap bisa dibuka saat koneksi buruk. Hanya berjalan di produksi (HTTPS).
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registrasi gagal — aplikasi tetap berjalan normal tanpa offline */
      });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}

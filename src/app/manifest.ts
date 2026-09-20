import type { MetadataRoute } from "next";

// Web App Manifest (Next.js file convention → /manifest.webmanifest).
// Membuat aplikasi bisa dipasang di layar utama (Android/desktop) seperti APK.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AR FARM JAYA — Manajemen Budidaya & Gudang",
    short_name: "AR FARM JAYA",
    description:
      "Sistem manajemen budidaya lele, gudang, penjualan, dan keuangan AR FARM JAYA. Data tersinkron ke server dan bisa dipasang di layar utama.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f8fafc",
    theme_color: "#007a4b",
    lang: "id",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icon-180.png", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

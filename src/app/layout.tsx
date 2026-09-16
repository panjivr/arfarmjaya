import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeApplier } from "@/components/theme-applier";
import { SyncProvider } from "@/components/sync-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://arfarmjaya.biz.id"),
  title: {
    default: "AR FARM JAYA — Sistem Manajemen Gudang",
    template: "%s · AR FARM JAYA",
  },
  description:
    "AR FARM JAYA (ARFARM BHINNEKA NUSA JAYA) — sistem manajemen gudang & retail: inventori real-time, pembelian, penerimaan, distribusi, POS, invoice multi-toko, laporan, dan analitik.",
  keywords: ["manajemen gudang", "WMS", "inventori", "AR FARM JAYA", "ARFARM", "invoice", "POS", "Ponorogo"],
  applicationName: "AR FARM JAYA WMS",
  openGraph: {
    title: "AR FARM JAYA — Sistem Manajemen Gudang & Retail",
    description:
      "Kelola inventori, pembelian, distribusi, POS, dan invoice multi-toko dalam satu sistem yang rapi dan siap audit.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeApplier />
        <SyncProvider />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AR FARM JAYA - Sistem Manajemen Gudang",
  description: "Sistem manajemen gudang, inventori, pembelian, distribusi, dan barang keluar AR FARM JAYA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

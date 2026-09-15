import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const compactNumber = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const numberFmt = new Intl.NumberFormat("id-ID");

export function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function daysUntil(value?: string) {
  if (!value) return Infinity;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return Infinity;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = value == null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function formatLongDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Buka dialog cetak browser dengan ukuran kertas yang sudah diatur. Dialog yang
 * sama dipakai untuk "Simpan sebagai PDF", sehingga hasil PDF mengikuti margin
 * dan orientasi di bawah ini (bukan hasil tangkapan layar).
 */
export function printDocument(options?: { landscape?: boolean; margin?: string; bodyClass?: string }) {
  if (typeof document === "undefined") return;
  const style = document.createElement("style");
  style.media = "print";
  style.textContent = `@page { size: A4 ${options?.landscape ? "landscape" : "portrait"}; margin: ${options?.margin ?? "10mm"}; }`;
  document.head.appendChild(style);
  if (options?.bodyClass) document.body.classList.add(options.bodyClass);

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    style.remove();
    if (options?.bodyClass) document.body.classList.remove(options.bodyClass);
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
  // Cadangan untuk browser yang tidak mengirim event afterprint.
  window.setTimeout(cleanup, 4000);
}

/** Ukuran area cetak A4 landscape dengan margin 10mm, dalam piksel CSS (96dpi). */
export const A4_LANDSCAPE_PRINT = { width: 1047, height: 718 };

/**
 * Hitung faktor `zoom` supaya dokumen muat satu halaman. Elemen diukur sementara
 * pada lebar area cetak sebenarnya, lalu dikembalikan ke gaya semula. Bila
 * dokumen terlalu panjang (skala di bawah `min`), biarkan mengalir multi-halaman.
 */
export function fitPrintZoom(
  element: HTMLElement,
  options: { width: number; height: number; min?: number },
) {
  const previous = element.getAttribute("style") ?? "";
  element.style.cssText = `${previous};position:fixed;left:-20000px;top:0;display:block;visibility:hidden;width:${options.width}px;zoom:1;`;
  const height = element.scrollHeight;
  element.setAttribute("style", previous);
  if (height <= options.height) return 1;
  const zoom = options.height / height;
  return zoom >= (options.min ?? 0.75) ? Number(zoom.toFixed(3)) : 1;
}

const IMAGE_MAX_SIDE = 900;
const IMAGE_QUALITY = 0.72;

/**
 * Kecilkan foto sebelum disimpan agar data laporan tetap muat di localStorage.
 * Mengembalikan data URL JPEG; gambar kecil dikembalikan apa adanya.
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca berkas gambar."));
    reader.onload = () => {
      const source = String(reader.result);
      const image = new window.Image();
      image.onerror = () => reject(new Error("Berkas bukan gambar yang valid."));
      image.onload = () => {
        const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(image.width, image.height));
        if (scale === 1 && source.length < 120_000) return resolve(source);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(source);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

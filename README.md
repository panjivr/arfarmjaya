# AR FARM JAYA WMS

Sistem Manajemen Gudang untuk ARFARM BHINNEKA NUSA JAYA — aplikasi web yang berjalan penuh di sisi klien (static export) dengan data tersimpan di browser (localStorage). Semua modul saling terhubung ke satu sumber data inventori.

## Fitur

- **Autentikasi & RBAC** — role `Admin Utama` (akses penuh) dan `Karyawan Gudang` (hanya Barang Keluar).
- **Dasbor** — metrik live (nilai inventori, stok rendah/habis, hampir kedaluwarsa) dan grafik yang dihitung langsung dari data stok.
- **Inventori** — cari, filter status/kategori, ekspor CSV, tambah & hapus barang.
- **Data Master** — Kategori, Pemasok, Gudang, dan Rak dengan CRUD penuh dan statistik turunan.
- **Operasional** — Pembelian (PO + persetujuan), Penerimaan Barang (menambah stok), Barang Keluar, Distribusi, Permintaan Barang, Stok Opname (adjustment), dan POS Retail (mengurangi stok).
- **Laporan Mingguan Lapangan** — generator *Laporan Pelaksanaan Mingguan* (mis. program penanaman kedelai): kop lembaga + logo, tabel kegiatan (tanggal, jenis kegiatan, tujuan, umur HST, nominal, output, foto), total otomatis, ringkasan, blok tanda tangan, dan keterangan pengisian. Hasilnya bisa disimpan, dicetak, atau diekspor ke PDF (A4 landscape, otomatis muat satu halaman) dan CSV. Semua elemen kop, judul, kolom, tanda tangan, dan catatan dapat diatur lewat **Pengaturan Format**.
- **Analitik & Laporan** — laporan valuasi, stok rendah, kedaluwarsa, pergerakan stok, dan ekspor CSV.
- **Sistem** — Notifikasi otomatis (stok rendah/kedaluwarsa), Log Audit setiap aksi, Pengguna & Role, dan Pengaturan.
- **UX** — mode terang/gelap, command palette (Ctrl/Cmd+K), pencarian global, dan notifikasi toast.

Semua transaksi (masuk, keluar, penerimaan, distribusi, opname, POS) memperbarui stok inventori yang sama dan menulis entri log audit.

### Cetak & PDF

Cetak dan "Simpan sebagai PDF" memakai dialog cetak browser, sehingga hasilnya tetap tajam (teks vektor) dan mengikuti margin serta orientasi yang sudah diatur aplikasi:

- Invoice: A4 potrait.
- Laporan Mingguan: A4 landscape, margin 10 mm, header tabel berulang tiap halaman, dan penyesuaian skala otomatis agar laporan muat satu halaman (bisa dimatikan di Pengaturan Format).

Pada dialog cetak, pilih tujuan **Simpan sebagai PDF** untuk menghasilkan berkas PDF.

## Akun Demo

- Admin Utama: `admin` / `admin123`
- Karyawan Gudang: `karyawan` / `gudang123`

## Data

Stok awal berasal dari `STOCK BAHAN BAKU GUDANG ARFARM.xlsx` (`src/lib/stock-products.ts`). Saat aplikasi dijalankan, data di-seed ke store dan perubahan disimpan di browser. Gunakan menu **Pengaturan → Reset Data** untuk mengembalikan ke data awal.

## Stack

- Next.js 15 (App Router, static export) + React 19 + TypeScript
- TailwindCSS v4
- Zustand (state + persistensi localStorage)
- Recharts, Lucide Icons, Framer Motion

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Build Statis

```bash
npm run build
```

Output diekspor ke `out/` dan dapat dihosting sebagai situs statis (mis. GitHub Pages).

## Arsitektur

Lihat `docs/ARCHITECTURE.md` untuk struktur modul dan model data.

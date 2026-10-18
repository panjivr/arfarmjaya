# AR FARM JAYA WMS

Sistem Manajemen Gudang untuk ARFARM BHINNEKA NUSA JAYA — aplikasi Next.js dengan API server dan PostgreSQL untuk data bersama, serta cache browser (localStorage). Semua modul saling terhubung ke satu sumber data inventori. Penyimpanan perusahaan memerlukan database persisten; cache browser bukan pengganti backup server.

## Fitur

- **Autentikasi & RBAC** — role `Admin Utama` (akses penuh) dan `Karyawan Gudang` (hanya Barang Keluar).
- **Dasbor** — metrik live (nilai inventori, stok rendah/habis, hampir kedaluwarsa) dan grafik yang dihitung langsung dari data stok.
- **Inventori** — cari, filter status/kategori, ekspor CSV, tambah & hapus barang.
- **Data Master** — Kategori, Pemasok, Gudang, dan Rak dengan CRUD penuh dan statistik turunan.
- **Operasional** — Pembelian (PO + persetujuan), Penerimaan Barang (menambah stok), Barang Keluar, Distribusi, Permintaan Barang, Stok Opname (adjustment), dan POS Retail (mengurangi stok).
- **Laporan Mingguan Lapangan** — generator *Laporan Pelaksanaan Mingguan* (mis. program penanaman kedelai): kop lembaga + logo, tabel kegiatan (tanggal, jenis kegiatan, tujuan, umur HST, nominal, output, foto), total otomatis, ringkasan, blok tanda tangan, dan keterangan pengisian. Hasilnya bisa disimpan, dicetak, atau diekspor ke PDF (A4 landscape, otomatis muat satu halaman) dan CSV. Semua elemen kop, judul, kolom, tanda tangan, dan catatan dapat diatur lewat **Pengaturan Format**.
- **Budidaya Lele** — area terpisah untuk peternakan lele: monitoring tiap kolam berdasarkan kode (mis. A12) — umur lele, jumlah ikan hidup, sintasan (SR), pakan harian + biaya, kematian, sampling bobot, biomassa, dan panen; ringkasan laba-rugi & FCR per siklus; pilihan **pakan dari katalog merk** (Hi-Pro-Vite, CP, Matahari Sakti, Cargill, dll. — ukuran, protein, harga) dengan biaya otomatis; **Jurnal Lele** (kualitas air, kesehatan, perlakuan, cuaca, pemeliharaan) dengan ekspor CSV; serta simulator proyeksi bisnis (panen, kebutuhan pakan, HPP, BEP, ROI). Semua tersinkron antar-perangkat dan mendukung mode gelap.
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
- Staff Gudang: `gudang` / `gudang123`
- Staff Lele: `lele` / `lele123`
- Staff Reporting: `laporan` / `laporan123`

Akun bawaan digunakan untuk mode demo lokal atau seed database kosong. Konfigurasikan kata sandi akun saat menyiapkan production; gangguan database tidak mengaktifkan kembali akun demo.

## Data

Stok awal berasal dari `STOCK BAHAN BAKU GUDANG ARFARM.xlsx` (`src/lib/stock-products.ts`). Saat aplikasi dijalankan, data di-seed ke store dan perubahan dicache di browser. Jika `DATABASE_URL` tersedia, data disinkronkan ke PostgreSQL dengan pemeriksaan revisi agar perangkat lain tidak tertimpa. Periksa indikator **Tersimpan** untuk konfirmasi server. **Pengaturan → Reset Data** mengganti data ke kondisi awal dan wajib membuat cadangan pengaman terlebih dahulu.

## Stack

- Next.js 15 (App Router + API server) + React 19 + TypeScript
- TailwindCSS v4
- Zustand (state + persistensi localStorage)
- Recharts, Lucide Icons, Framer Motion

## Menjalankan Lokal

```bash
npm ci
npm run dev
```

Buka `http://localhost:3000`.

## Build dan penyimpanan production

```bash
npm run build
npm run start
```

Output server berada di `.next/`; aplikasi ini memerlukan API dan **bukan static export**.
Konfigurasikan `DATABASE_URL` ke PostgreSQL persisten dan `AUTH_SECRET` sebelum
menjalankan production. Tanpa database, mode lokal dapat dipakai untuk demo,
tetapi simpan ke server ditandai gagal. Lihat [panduan deployment](DEPLOY-VERCEL.md).

```bash
npm test
npm run lint
```

Temuan, perlindungan konflik, pengujian database, dan prosedur pemulihan dijelaskan
di [audit penyimpanan data](docs/DATA-STORAGE-AUDIT.md). Server mempertahankan 20
versi sebelumnya; tetap siapkan backup terjadwal di lokasi terpisah.

## Arsitektur

Lihat `docs/ARCHITECTURE.md` untuk struktur modul dan model data.

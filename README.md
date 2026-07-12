# AR FARM JAYA WMS

Sistem Manajemen Gudang untuk ARFARM BHINNEKA NUSA JAYA.

## Fitur

- Login dengan role `Admin Utama` dan `Karyawan Gudang`.
- Admin Utama memiliki akses penuh ke seluruh menu.
- Karyawan Gudang hanya dapat mencatat Barang Keluar.
- Dasbor inventori, pembelian, distribusi, penjualan, pendapatan, dan biaya.
- Data barang dengan SKU, barcode, rak, gudang, pemasok, batch, dan tanggal kedaluwarsa.
- Stok bahan baku real dari `STOCK BAHAN BAKU GUDANG ARFARM.xlsx`.
- Modul kategori, pemasok, gudang, rak, pembelian, penerimaan barang, distribusi, permintaan barang, stok opname, POS retail, laporan, pengguna, notifikasi, log audit, analitik, dan pengaturan.
- Prisma schema PostgreSQL ternormalisasi dan seed data role awal.

## Akun Demo

- Admin Utama: `admin` / `admin123`
- Karyawan Gudang: `karyawan` / `gudang123`

## Stack

- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- Prisma dan PostgreSQL
- Better Auth-ready
- Zustand
- TanStack Table
- Recharts
- React Hook Form dan Zod
- Lucide Icons
- Framer Motion

## Menjalankan Lokal

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

Buka `http://localhost:3000`.

## Database

Isi `DATABASE_URL` di `.env`, lalu jalankan:

```bash
npm run prisma:migrate
npm run prisma:seed
```

## Arsitektur

Lihat `docs/ARCHITECTURE.md` untuk struktur modul, model keamanan, API, dan ERD.

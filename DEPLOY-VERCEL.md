# Menjalankan AR FARM JAYA di Vercel

Aplikasi memerlukan Next.js server dan PostgreSQL persisten. Jangan gunakan
static hosting atau filesystem fungsi Vercel untuk menyimpan data perusahaan.

## Pertahankan data yang sudah ada

Jika sudah ada aplikasi yang digunakan, unduh **Pengaturan → Cadangan &
Pemulihan → Unduh dari Server** terlebih dahulu. Pertahankan DATABASE_URL yang
sama bila hanya memindahkan hosting. Jangan mengganti koneksi ke database baru
sebelum cadangan diverifikasi dan rencana pemulihan disiapkan.

## Project dan database

1. Masuk ke Vercel dan import repository `panjivr/arfarmjaya` pada branch yang
   berisi perbaikan penyimpanan. Framework: Next.js. `vercel.json` sudah memilih
   `npm run vercel-build`.
2. Hubungkan PostgreSQL persisten yang sudah digunakan. Untuk project yang
   benar-benar baru, buat database melalui penyedia PostgreSQL/marketplace
   pilihan Anda. Pilih retensi dan backup yang sesuai untuk perusahaan;
   jangan menganggap paket gratis tidak memiliki batas atau masa berlaku.
3. Isi environment variables Vercel untuk lingkungan yang sesuai:
   - `DATABASE_URL`: connection string PostgreSQL dengan TLS sesuai penyedia.
   - `AUTH_SECRET`: rahasia acak minimal 32 karakter, tetap antar-redeploy.
   - `ADMIN_PASSWORD`, `LELE_PASSWORD`, `GUDANG_PASSWORD`, `LAPORAN_PASSWORD`:
     kata sandi seed awal minimal 12 karakter bila database benar-benar kosong.
     ADMIN_PASSWORD wajib untuk database production kosong. Akun staf hanya
     di-seed jika kata sandinya dikonfigurasi; tidak ada akun demo otomatis
     di production. Mengubah variabel
     ini tidak mengganti hash akun yang sudah ada; gunakan manajemen akun.
   Jangan masukkan nilai rahasia ke Git, log, atau chat.
4. Untuk database **baru dan kosong** saja, siapkan tabel menggunakan
   `npx prisma db push --skip-generate` dari lingkungan tepercaya yang memiliki
   DATABASE_URL. Untuk database perusahaan yang sudah berisi data, periksa
   kesesuaian skema dan lakukan perubahan melalui proses perubahan database.
   Rilis ini tidak menambah model atau kolom; backup versi memakai tabel
   Workspace yang sudah ada.
5. Deploy. Build memeriksa keberadaan/format konfigurasi production dan
   menghasilkan Prisma client. Build tidak mengubah skema database otomatis.
   Preview deployment juga tidak boleh memodifikasi skema database production.

## Verifikasi sebelum digunakan

```bash
npm run check:production
npm run verify:deployment -- https://ALAMAT-APLIKASI.vercel.app
```

`check:production` dijalankan di lingkungan dengan variabel yang tersedia;
perintah ini tidak mencetak nilai rahasia. `verify:deployment` hanya membaca
endpoint publik, tidak membuat transaksi atau membaca data perusahaan.

- `/api/health` harus HTTP 200, `status: ready`, dan build
  `2026-10-18 · data-storage-2`. Endpoint memeriksa kedua tabel yang diperlukan
  tanpa membaca isi data perusahaan. HTTP 503 berarti belum siap.
- Login dengan akun yang sah. Buat perubahan yang memang diizinkan pengguna,
  tunggu indikator **Tersimpan**, muat ulang, lalu periksa hasilnya dari
  perangkat lain. Jangan memakai akun tebakan untuk menguji production.
- Klien lama tanpa header revisi mendapat HTTP 428 dan harus dimuat ulang.
- Jika aplikasi baru menggunakan database baru, pulihkan backup yang sudah
  diperiksa melalui **Pulihkan dari Berkas**, lalu pastikan status tersimpan.

Jika deploy memakai CLI dari workspace ini, autentikasi Vercel harus tersedia.
Gunakan login CLI yang sah atau masukkan VERCEL_TOKEN secara aman melalui
pengaturan lingkungan. Token tidak diperlukan oleh runtime aplikasi; jangan
menyertakannya dalam environment variables aplikasi di Vercel.

## Backup dan pemulihan

Server menyimpan 20 versi sebelumnya pada database yang sama. Daftar versi
tersedia untuk admin di `/api/backup?versions=1`; unduh versi terpilih lewat
`/api/backup?version=backup:<uuid>`.

Ini bukan pengganti backup terjadwal di lokasi berbeda. Aktifkan backup/PITR
sesuai layanan database dan uji pemulihannya. Panduan konflik dan batas model
penyimpanan ada di [audit penyimpanan](docs/DATA-STORAGE-AUDIT.md).

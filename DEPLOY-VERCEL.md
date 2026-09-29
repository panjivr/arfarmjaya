# Deploy ke Vercel + Neon (database permanen, gratis)

Render memakai PostgreSQL **gratis yang kedaluwarsa berkala** — itu penyebab
data hilang. Solusi: host di **Vercel** (bagus untuk Next.js) + database
**Neon** (PostgreSQL gratis yang **permanen**, tidak kedaluwarsa).

> Urutan penting: **amankan data dulu**, baru pindah. Database Neon yang baru
> mulai kosong — data lama harus di-import.

## 1) Amankan data yang ada sekarang
Di aplikasi yang sedang jalan (login sebagai admin):
- **Pengaturan → Cadangan & Pemulihan → "Unduh dari Server"** (mengunduh
  seluruh data server sebagai `arfarmjaya-server-backup-YYYY-MM-DD.json`).
- Simpan berkas itu di tempat aman (kirim ke WA/email sendiri). Ini "download
  semua database".

## 2) Buat database Neon (gratis, permanen)
1. Buka https://neon.tech → daftar (bisa via GitHub) → **Create project**.
2. Salin **connection string** (format `postgresql://...neon.tech/...?sslmode=require`).
   Pakai string yang biasa (bukan yang khusus "pooled" bila ragu — untuk skala
   kecil ini cukup).

## 3) Deploy ke Vercel
1. Buka https://vercel.com → login GitHub → **Add New… → Project** → pilih repo
   `panjivr/arfarmjaya` → **Import**.
2. Framework otomatis terdeteksi **Next.js**. Jangan ubah build command
   (repo sudah menyetel `vercel-build` = `prisma generate && prisma db push &&
   next build`).
3. **Environment Variables** (Settings → Environment Variables), isi:
   - `DATABASE_URL` = connection string Neon dari langkah 2.
   - `AUTH_SECRET` = teks acak panjang (mis. hasil dari `openssl rand -hex 32`,
     atau ketik acak ≥ 32 karakter). Wajib, untuk tanda tangan sesi login.
   - (opsional) `ADMIN_PASSWORD`, `LELE_PASSWORD`, `GUDANG_PASSWORD`,
     `LAPORAN_PASSWORD` bila ingin ganti kata sandi bawaan.
4. **Deploy**. Tunggu selesai, buka URL `*.vercel.app`.

## 4) Pulihkan data ke server baru
- Login di URL Vercel → **Pengaturan → Cadangan & Pemulihan → "Pulihkan dari
  Berkas"** → pilih berkas backup dari langkah 1 → otomatis tersimpan ke Neon.
- Pastikan **Info Aplikasi → Sinkronisasi = "Tersimpan ke server"**.

## 5) (Opsional) Domain arfarmjaya.biz.id ke Vercel
- Vercel → Project → **Settings → Domains → Add** `arfarmjaya.biz.id` → ikuti
  instruksi DNS di DomaiNesia (biasanya A record ke `76.76.21.21` untuk apex
  atau CNAME `cname.vercel-dns.com` untuk `www`; pakai nilai persis yang Vercel
  tampilkan).

## Catatan
- Database di sini disimpan sebagai satu dokumen JSON (tabel `Workspace`) plus
  akun login (tabel `AppUser`); `prisma db push` membuat tabelnya otomatis saat
  build pertama.
- Selama `DATABASE_URL` menunjuk ke Neon, data **tidak akan kedaluwarsa**.
- Backup rutin: sesekali klik **Unduh dari Server** dan simpan berkasnya.

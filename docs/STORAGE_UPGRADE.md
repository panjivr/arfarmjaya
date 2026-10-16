# Penyimpanan server AR Farm Jaya — panduan aktivasi

Status: implementasi di branch, belum diaktifkan pada database/situs produksi.

## Perilaku baru

- PostgreSQL menjadi sumber data utama. Setiap catatan disimpan sebagai baris `WorkspaceRecord` dengan koleksi, ID dan versi. Data per catatan masih JSONB dengan validasi dari tipe aplikasi; ini bukan klaim bahwa seluruh domain sudah menjadi tabel relasional dengan foreign key.
- Klien mengirim perubahan catatan saja lewat PATCH, bukan menimpa seluruh workspace. Semua catatan dalam satu pengiriman berhasil bersama atau dibatalkan bersama.
- Nomor versi mencegah penimpaan ketika dua perangkat mengedit catatan sama. ID pengiriman membuat retry setelah respons terputus tidak menggandakan transaksi.
- Perubahan disimpan lebih dahulu sebagai draf di IndexedDB, terpisah per akun. Satu tab editor per akun/per browser dilindungi Web Locks; perangkat berbeda tetap dapat bekerja bersamaan. Jangan menghapus data browser sebelum draf diselesaikan.
- Konflik tidak di-merge secara diam-diam. UI menyediakan coba lagi, unduh draf, dan gunakan data server. Opsi terakhir mengunduh draf sebelum mengganti tampilan. Draf berformat jurnal (`base`, `next`, `versions`); untuk pemulihan manual, data aplikasi ada dalam `next`.
- Permintaan baca yang gagal tidak pernah menyebabkan unggahan cache. Database kosong harus diinisialisasi oleh admin dari cadangan, bukan dari perangkat yang kebetulan login.
- PUT lama selalu ditolak. Tab lama perlu dimuat ulang.
- Hak baca/tulis ditegakkan per koleksi di server. Akun aktif, role terbaru, dan versi sesi diperiksa ulang di API. Perubahan password membatalkan sesi lama. Produksi tidak lagi memakai login fallback jika database gagal.
- Riwayat batch ditulis server, terpisah dari audit tampilan. UI tidak dapat mengganti atau menghapus audit server melalui API state.
- Foto JPEG/PNG/WebP otomatis dipindahkan ke bucket privat R2 ketika catatan diubah jika R2 telah dikonfigurasi. Foto lama yang belum diedit tetap inline dan tetap dapat dibaca. Tidak ada penghapusan otomatis foto/riwayat.
- Foto dilayani melalui endpoint berautentikasi dan izin koleksi. Bucket tidak boleh dipublikasikan. Jangan cache `/api/` di CDN atau service worker.

## 1. Amankan kondisi sekarang

1. Unduh backup JSON dari situs lama. Simpan juga backup PostgreSQL penuh (`pg_dump` menggunakan URL direct) agar akun, hash password, dan tabel lain ikut tersimpan. JSON aplikasi tidak mencadangkan tabel akun.
2. Cocokkan jumlah catatan dan cek foto. Jika ada draf berbeda di perangkat lain, ekspor dari perangkat tersebut sebelum cutover.
3. Buat database/branch uji yang terisolasi. **Preview Vercel tidak boleh memakai DATABASE_URL produksi.** Jangan aktifkan flag penyimpanan pada Preview yang mengarah ke produksi.
4. Uji salinan database dengan prosedur berikut. Jangan menghapus database lama.

## 2. Konfigurasi aplikasi

Isi environment di dashboard hosting/secret manager, bukan di chat atau file yang di-commit:

| Variabel | Isi |
|---|---|
| `DATABASE_URL` | URL PostgreSQL. Untuk serverless gunakan pooling sesuai provider, TLS aktif. |
| `AUTH_SECRET` | Rahasia acak minimal 32 karakter. Pertahankan nilai lama jika sudah kuat. |
| `WORKSPACE_RECORDS_ENABLED` | `true` hanya pada deployment yang siap diaktifkan. Tanpa flag, API gagal tertutup dengan 503. |
| `ADMIN_PASSWORD` | Wajib hanya saat membuat akun produksi pada DB kosong. Gunakan password kuat. Tidak mengganti akun yang sudah ada. |
| `R2_ACCOUNT_ID` | ID akun Cloudflare. |
| `R2_BUCKET` | Nama bucket privat lampiran. |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Kredensial server dengan akses minimum ke bucket lampiran. Jangan memakai `NEXT_PUBLIC_`. |

R2 opsional untuk menjalankan data; tanpa R2 foto tetap inline dan biaya storage database bertambah. Batas satu pengiriman 3,5 MB, maksimal 5.000 perubahan, transaksi maksimal 30 detik; batas ini disengaja. Ini bukan unggahan tanpa batas. Pilih region aplikasi dekat database.

## 3. Siapkan schema dan migrasi

Build sekarang **tidak mengubah schema database secara otomatis**. Jalankan langkah admin terpisah pada target yang benar:

```bash
npm ci
npx prisma generate
npm run storage:prepare
```

`storage:prepare` menjalankan `prisma db push` tanpa `--accept-data-loss`. Perubahan yang direncanakan hanya menambah tabel dan kolom `sessionVersion`. Tinjau SQL di `prisma/upgrades/20261016_record_storage.sql`; SQL ini ditujukan untuk schema lama repo dan tidak diulang setelah berhasil. Ini belum memakai riwayat `prisma migrate deploy` karena database lama dibuat memakai db push.

- **DB lama/salinannya sudah punya `Workspace/main`:** pada pembacaan pertama setelah flag aktif, migrasi berjalan dalam satu transaksi dengan advisory lock PostgreSQL. Semua catatan divalidasi lebih dulu, salinan awal disimpan gzip di `WorkspaceBackup`, baris per catatan dibuat, lalu marker `records:v1` ditulis. Dokumen `main` tidak ditimpa oleh aplikasi baru.
- **DB baru dari backup JSON:** jalankan `npm run storage:import -- /path/backup.json` dengan env DB target dan flag aktif. Perintah menolak menimpa DB yang sudah memiliki workspace. Akun perlu dibuat/di-seed terpisah; untuk mempertahankan akun lama, pindahkan database penuh.
- Kegagalan validasi atau transaksi menggagalkan migrasi. Jangan menghapus marker atau memaksa impor untuk mengatasi kegagalan; periksa data pada salinan uji.

Saat cutover: hentikan input sementara, buat backup final, siapkan schema, deploy kode baru, aktifkan flag pada deployment produksi baru, lalu login dan verifikasi sebelum staf kembali bekerja. Tab lama akan ditolak saat menyimpan dan perlu reload. Jangan memberi staf URL deployment lama; deployment lama masih memiliki kode tulis lama.

## 4. Verifikasi produksi

- Login admin dan setiap peran; pastikan data modul lain tidak keluar dari API.
- Cocokkan jumlah catatan, beberapa saldo/stok, foto, dan hasil cetak dengan backup final.
- Buat satu catatan uji, reload, lalu cek dari perangkat kedua.
- Edit catatan sama di dua perangkat: salah satu harus mendapat konflik, bukan menimpa.
- Putuskan koneksi: indikator harus belum tersimpan; setelah tersambung retry tidak boleh menggandakan catatan.
- Uji backup dan pemulihan pada **database kosong terpisah**. Backup belum dianggap operasional hanya karena workflow tersedia.

## 5. Backup otomatis

Workflow `.github/workflows/storage-backup.yml` tersedia tetapi dinonaktifkan sampai variable repo `STORAGE_BACKUPS_ENABLED=true` dipasang. Jadwal 01:17 WIB; jadwal GitHub dapat terlambat. Aktifkan hanya setelah uji manual berhasil. GitHub Actions dapat menimbulkan biaya sesuai paket/minute repository.

Siapkan secrets GitHub:

- `DATABASE_BACKUP_URL`: URL **direct**, akses membaca seluruh tabel untuk pg_dump.
- `BACKUP_ENCRYPTION_PASSWORD`: rahasia kuat independen; simpan salinannya di password manager di luar akun hosting.
- `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_BACKUP_BUCKET`: bucket backup wajib berbeda dan privat.
- `R2_BACKUP_ACCESS_KEY_ID`, `R2_BACKUP_SECRET_ACCESS_KEY`: baca bucket sumber dan tulis bucket backup. Aplikasi utama sebaiknya tidak memiliki akses bucket backup.
- Variable opsional `BACKUP_POSTGRES_IMAGE`: default `postgres:18`; major pg_dump harus >= major server.

Workflow mencadangkan **semua tabel termasuk akun** ke arsip pg_dump, memeriksa daftar isinya, mengenkripsi dengan GPG AES256, menyalin lampiran, lalu mengunggah arsip dan SHA256. Tidak ada dump plaintext di GitHub artifacts. Tidak ada auto-delete; pantau pertumbuhan penyimpanan dan tetapkan retensi setelah kebutuhan disepakati. Salinan awal migrasi dan history dalam database yang sama bukan pengganti backup terpisah.

Backup JSON dari UI tetap tersedia untuk admin. Jika sudah memakai R2, JSON berisi tautan foto; pemulihan lengkap membutuhkan salinan bucket juga. Untuk backup lengkap gunakan workflow.

### Latihan restore

1. Unduh arsip `.dump.gpg`, file SHA256, dan foto dari bucket backup.
2. Cocokkan SHA256. Jalankan `gpg --output restore.dump --decrypt backup.dump.gpg`; GPG meminta password secara lokal.
3. Buat **database kosong baru** dan simpan URL-nya secara privat. Jalankan `pg_restore --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" restore.dump`. Jangan memakai opsi clean pada produksi.
4. Salin direktori `attachments/` ke bucket pemulihan privat; gunakan konfigurasi R2 pemulihan pada deployment uji.
5. Uji login, hitungan catatan, foto dan beberapa transaksi. Catat tanggal latihan dan hasilnya.
6. Target awal RPO 24 jam adalah target operasional setelah backup sukses terverifikasi, bukan jaminan provider. RTO belum diukur.

## 6. Rollback

Sebelum ada tulisan baru di sistem v2, rollback kode dapat memakai dokumen `main` lama. Setelah ada perubahan v2, `main` sudah tertinggal: **jangan sekadar rollback deployment**. Ekspor data terbaru dari v2 atau pulihkan backup ke lingkungan terpisah dahulu. Simpan kedua versi; rekonsiliasi perubahan sebelum memindahkan trafik.

## Batas yang masih ada

Schema per catatan memakai JSONB, bukan foreign key penuh per domain. Validasi tipe dan transaksi batch sudah ada, tetapi aturan bisnis lintas entitas masih perlu dikembangkan sebagai layanan domain (contoh: alokasi batch FIFO dan semua pembatalan transaksi). Tampilan belum push realtime; perangkat mengambil data server saat dibuka/fokus kembali. History dan tombstone belum memiliki auto-retention, jadi perlu pemantauan kapasitas. Kredensial R2 serta backup eksternal belum diuji pada akun produksi melalui sesi ini.

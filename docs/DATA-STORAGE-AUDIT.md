# Audit dan perbaikan penyimpanan data

Audit ini memeriksa kode penyimpanan lokal, sinkronisasi, API workspace,
backup/pemulihan, dan autentikasi yang melindungi akses data. Pengujian memakai
PostgreSQL sementara dan data uji; database perusahaan tidak diakses atau diubah.

## Temuan yang diperbaiki

| Risiko sebelumnya | Perbaikan |
| --- | --- |
| Seluruh snapshot perangkat terakhir dapat menimpa perubahan perangkat lain. | GET mengembalikan revisi; PUT wajib menyertakan `x-base-revision`. Pembandingan dan penulisan memakai PostgreSQL transaction advisory lock yang sama. Versi usang mendapat HTTP 409 tanpa mengubah data. |
| Gagal membaca server dianggap server kosong lalu data lokal diunggah. | HTTP 401/503, JSON tidak valid, dan database tidak aktif menghentikan inisialisasi sinkronisasi. Edit lokal tidak dikirim sebelum pembacaan berhasil. |
| Banyaknya record/aktivitas menentukan snapshot yang menang, termasuk setelah penghapusan sah. | Jumlah record tidak menentukan versi. Edit lokal dan server yang sama-sama berubah menghasilkan konflik; perubahan lokal dipertahankan. |
| Simpan otomatis, flush halaman, dan pemulihan manual dapat berjalan bersamaan atau selesai terbalik. | Semuanya melalui antrean simpan yang sama. Revisi hanya maju setelah respons akhir yang berhasil; respons parsial bukan bukti tersimpan. Metadata sinkronisasi dipisahkan per tab. |
| PUT mengganti data tanpa versi pemulihan. | Snapshot sebelumnya disimpan dalam transaksi yang sama. Kegagalan backup/penulisan/pruning membatalkan transaksi. Disimpan maksimal 20 versi sebelumnya. |
| Potongan unggahan tidak diperiksa jumlah, urutan, pemilik, atau kesesuaian metadata. | Semua diperiksa sebelum data digabung. Ukuran request dan hasil dekompresi dibatasi; batas dataset 64 MiB, maksimal 20 chunk. |
| JSON backup bebas dapat mengganti tipe koleksi dan merusak store. | Validasi struktur, identitas unik, angka hingga, pengaturan dan produk dasar; hanya kunci data bisnis yang dimuat. Backup inti versi lama tetap didukung. |
| Kuota localStorage penuh gagal diam-diam. | Kegagalan terlihat pada indikator simpan. Data lokal rusak tidak ditimpa default kosong. Penggantian/pemulihan/reset dibatalkan jika cadangan pengaman tidak berhasil dibuat. |
| Riwayat diam-diam dipotong pada 500 audit, 1.000 mutasi gudang dan 5.000 mutasi lele. | Batas pemotongan tersebut dihapus, termasuk agar pasangan transfer lele tidak terpisah akibat pemotongan. |
| Akun login apa pun dapat mengganti seluruh departemen dan mengunduh backup server. | Perubahan dibatasi pada koleksi departemennya; inisialisasi database dan unduh backup server memerlukan admin. |
| Database gagal membuat login kembali menerima kata sandi bawaan. | Kegagalan autentikasi database ditolak. Akun bawaan hanya berlaku ketika DATABASE_URL tidak dikonfigurasi. AUTH_SECRET wajib untuk production. |

## Perilaku saat konflik dan kegagalan

Indikator **Tersimpan** berarti server sudah mengonfirmasi snapshot yang berlaku.
Perubahan yang masih menunggu atau ditolak tidak diberi status tersimpan.
Kegagalan penyimpanan lokal tetap ditampilkan meskipun server berhasil menyimpan.

Klik indikator untuk melihat masalah, mengunduh backup lokal, atau mencoba simpan
lagi. Untuk konflik, simpan backup unduhan dahulu. **Cadangkan & muat data server**
menyimpan salinan perangkat, menghapus metadata versi tab, lalu memuat versi
server. Rekonsiliasi transaksi lokal bersama admin; jangan langsung mengimpor
seluruh snapshot usang karena itu juga dapat menghapus transaksi baru server.
Jika ruang lokal tidak cukup untuk cadangan pengaman, penggantian dibatalkan.

Cadangan lokal sebelumnya disimpan dengan kunci
`arfarmjaya-local-backup:<uuid>` dan cadangan terbaru dengan kunci
`arfarmjaya-local-backup`. Cadangan lokal berada di browser yang sama dan dapat
hilang jika data situs dihapus. Unduhan JSON tetap diperlukan untuk pemulihan
independen. Metadata lama pada localStorage tidak digunakan sebagai izin
menimpa versi server; metadata baru menggunakan sessionStorage per tab.

## Pemulihan versi server

Tidak perlu migrasi skema: versi pengaman memakai baris Workspace dengan ID
`backup:<uuid>`. Baris utama tetap `main`; unggahan sementara memakai `upload:`.

Admin dapat memakai endpoint berikut dari sesi login yang sah:

- `GET /api/backup`: unduh data `main`; HTTP 404 jika belum ada data.
- `GET /api/backup?versions=1`: daftar ID/tanggal 20 versi pengaman terakhir.
- `GET /api/backup?version=backup:<uuid>`: unduh versi yang dipilih.

Periksa isi cadangan sebelum menggunakan **Pulihkan dari Berkas**. Pemulihan
melewati pemeriksaan revisi yang sama dan dapat ditolak jika perangkat lain
sudah menulis. Tidak ada jalur pemulihan yang melewati perlindungan konflik.

## Validasi

- `npm test`: 31 pengujian regresi, termasuk kuota lokal, import store sebenarnya,
  riwayat melewati batas lama, konflik, antrean, dan unggahan rusak.
- `npm run lint` dan `npx tsc --noEmit`: lulus.
- `npm run build`: lulus.
- PostgreSQL 16 sementara: inisialisasi, penulis bersamaan, pembatasan izin,
  rollback SQL setelah backup dibuat, dan retensi 20 versi lulus. Pengujian
  menggunakan Prisma client normal dan engine standar dengan checksum yang
  diverifikasi, sesuai jalur produksi.
- HTTP aplikasi Next.js dengan database sementara: autentikasi, PUT tanpa
  revisi, validasi, simpan gzip, penolakan versi usang, unggahan tidak lengkap,
  unduh versi backup dan pembatasan akun staf lulus.
- Chromium: dua perangkat tidak saling menimpa; data lokal yang konflik tetap
  ada, backup dapat diunduh, pemuatan ulang server mencadangkan perubahan lokal;
  kegagalan GET awal tidak menghasilkan PUT meskipun pengguna mengedit.

Uji database dapat diulang dengan `npm run test:postgres` setelah Prisma client
normal dihasilkan dan `DATABASE_URL` menunjuk database **kosong dan sementara**
di localhost dengan nama berakhiran `_test` atau `_audit`. Skrip tidak menghapus
isi database yang sudah terisi. Jangan gunakan database perusahaan untuk uji ini.

## Batas dan tindak lanjut operasional

- Backup 20 versi berada pada database yang sama dan dihitung per perubahan,
  bukan per hari. Ini tidak melindungi dari database dihapus/kedaluwarsa.
  Untuk operasional perusahaan, tetap perlukan backup terjadwal di lokasi
  terpisah dan pemulihan yang diuji, serta database persisten.
- Model masih satu dokumen JSON untuk semua departemen. Konflik ditolak untuk
  menjaga data; penggabungan otomatis dan transaksi bisnis per record belum
  diterapkan. Besarnya data/foto memengaruhi biaya snapshot dan penyimpanan.
- Validasi baru melindungi struktur penyimpanan, bukan audit menyeluruh semua
  aturan bisnis/nilai akuntansi atau seluruh hubungan antar-record.
- Sesi masih berupa cookie bertanda tangan yang berlaku hingga kedaluwarsa;
  pencabutan sesi segera dan audit server yang tidak dapat diubah belum tersedia.
  Pembacaan workspace masih mengikuti model lama: semua akun login membaca
  dokumen bersama. Pemisahan akses baca per departemen perlu desain terpisah.
- Riwayat yang sudah terpotong oleh versi lama tidak dapat dibuat kembali dari
  kode; cari salinannya di backup/perangkat yang masih menyimpannya.
- Cadangkan data production sebelum menerapkan rilis. Terapkan frontend dan API
  bersama. Klien lama tanpa header revisi mendapat HTTP 428 dan harus dimuat
  ulang. Pastikan DATABASE_URL dan AUTH_SECRET terkonfigurasi; tidak ada kredensial
  atau data perusahaan yang ditambahkan oleh perubahan ini.

## Pemeriksaan kesiapan Vercel

Rilis `2026-10-18 · data-storage-2` menambahkan `/api/health`, pemeriksaan
konfigurasi production, dan build command Vercel yang eksplisit. DATABASE_URL
harus valid dan AUTH_SECRET minimal 32 karakter. Build/start tidak lagi mengubah
skema database perusahaan secara otomatis. Lihat DEPLOY-VERCEL.md.

Perbaikan lanjutan melindungi cache lama setelah kegagalan tulis lokal: metadata
mencatat kegagalan cache, sehingga muat ulang tidak dianggap sebagai edit offline
yang boleh menimpa server. Tombol coba simpan dan event online juga mencoba ulang
pembacaan awal yang sebelumnya gagal. Kedua skenario diuji di Chromium dalam
mode production, selain pengujian unit.

Database production baru hanya menginisialisasi admin dengan ADMIN_PASSWORD
minimal 12 karakter. Akun staf tanpa password yang dikonfigurasi tidak di-seed.
Kata sandi demo tetap terbatas pada pengembangan lokal; akun lama tidak diubah
otomatis. Inisialisasi akun menggunakan INSERT ... ON CONFLICT DO NOTHING agar login
pertama bersamaan tidak gagal karena duplikasi username. Uji khusus tersedia
melalui `NODE_ENV=production npm run test:auth:postgres` dengan database lokal
sementara, tabel AppUser kosong, dan ADMIN_PASSWORD uji yang kuat.

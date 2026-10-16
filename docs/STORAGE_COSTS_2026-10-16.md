# Pilihan biaya penyimpanan — 16 Oktober 2026

Harga USD sebelum pajak, penggunaan tambahan, domain dan tagihan hosting yang sudah ada. Konversi rupiah di bawah hanya simulasi USD 1 = Rp17.000, bukan kurs pasar. Tidak ada paket berbayar yang dibeli atau akun/bucket yang dibuat pada pekerjaan ini.

## Rekomendasi

Pertahankan database PostgreSQL yang sekarang bila sehat dan berada di akun yang Anda kuasai. Identitas provider dan paket produksi belum dapat dipastikan hanya dari repo. Perbaikan kode tidak memerlukan pindah provider. Untuk layanan baru: Neon Free + R2 Standard privat merupakan titik awal hemat; naikkan paket setelah batas terukur, bukan karena jumlah menu aplikasi.

| Opsi penyimpanan | Biaya dasar | Kapasitas/poin penting | Cocok untuk |
|---|---:|---|---|
| Neon Free + R2 Standard dalam kuota gratis | $0 tambahan/bulan | Neon 1 GB DB dan 100 CU-hour/bulan per proyek; R2 10 GB-month, 1 juta operasi A, 10 juta operasi B | Awal, penggunaan kecil, dengan backup terpisah yang diaktifkan |
| Neon Launch + R2 | Berdasarkan penggunaan | Compute $0,106/CU-hour; DB $0,35/GB-month; history $0,20/GB-month perubahan; scheduled snapshot $0,09/GB-month | Penggunaan usaha yang perlu ruang tumbuh/riwayat lebih panjang |
| Supabase Free | $0 | 500 MB database, 1 GB file; proyek aktivitas rendah dapat dijeda setelah 7 hari; automatic backup tidak termasuk | Uji atau penggunaan kecil yang menerima batas gratis |
| Supabase Pro | Mulai $25/bulan ≈ Rp425.000 | 8 GB disk DB/proyek, 100 GB file; daily backup DB 7 hari, perhatikan biaya compute proyek tambahan | Paket lebih terpadu dan anggaran stabil |

Neon Free memiliki jendela history terbatas sampai 6 jam/1 GB perubahan. Bukan pengganti backup harian mandiri. Pada semua opsi, kapasitas database juga dipakai indeks, history dan salinan migrasi; bukan seluruh kuota tersedia untuk data bisnis bersih.

## Perkiraan Neon Launch

Perkiraan ilustratif satu DB 1 GB, belum termasuk history, snapshot, pajak, bandwidth tambahan atau hosting web:

- 50 CU-hour: (50 × $0,106) + $0,35 = **$5,65 ≈ Rp96.050/bulan**.
- 100 CU-hour: **$10,95 ≈ Rp186.150/bulan**.
- Compute tetap rata-rata 0,25 CU selama 730 jam: 182,5 CU-hour + storage = **$19,695 ≈ Rp334.815/bulan**.

CU-hour bukan jumlah jam pengguna membuka browser. Ukuran compute × waktu compute aktif menentukan biaya; scale-to-zero dan jumlah endpoint memengaruhi hasil. Angka tersebut bukan penawaran flat atau prediksi tagihan AR Farm Jaya.

## Biaya foto dan backup R2

- Standard storage: $0,015/GB-month di luar jatah gratis.
- Egress langsung R2 gratis; API proxy foto melalui hosting aplikasi tetap dapat menimbulkan biaya hosting/bandwidth aplikasi.
- Contoh total 50 GB-month tersimpan: (50 − 10) × $0,015 = **$0,60 ≈ Rp10.200/bulan untuk storage saja**, bila jatah gratis 10 GB belum dipakai layanan lain. Operasi tambahan dihitung terpisah.
- Kuota berlaku di tingkat akun: file utama, salinan backup dan file lain berbagi jatah; dua bucket tidak menggandakan kuota.
- 10 GB secara matematis kira-kira 100.000 foto 100 KB jika tidak ada isi lain. Dalam penggunaan nyata, sisihkan kapasitas untuk backup, variasi ukuran foto dan overhead penagihan. Gambar aplikasi sekarang dikompres, tetapi ukurannya bervariasi.

Pilih Standard untuk foto aktif; jangan memilih Infrequent Access hanya karena tarif GB lebih kecil karena ada biaya retrieval dan minimum durasi penyimpanan.

## Hosting website harus dihitung terpisah

- Vercel Hobby diperuntukkan personal nonkomersial. Untuk aplikasi operasional usaha seperti ini, **jangan menganggarkan Vercel gratis sebagai solusi produksi komersial**. Vercel Pro mulai $20/bulan per developer seat ≈ Rp340.000, penggunaan lebih bisa ditagih.
- Vercel Pro + Neon Free + R2 dalam kuota: dasar sekitar **$20/bulan**, belum pajak, domain, dan overage. Dengan ilustrasi Neon Launch 50 CU-hour: sekitar **$25,65/bulan ≈ Rp436.050**, ditambah history/backup/overage.
- Jika VPS Oracle milik Anda masih aktif, punya kapasitas, dan biaya tambahannya memang nol, aplikasi Next.js dapat di-host di VPS itu dengan Neon + R2. Ini berpotensi menekan biaya hosting tambahan, tetapi membutuhkan pengelolaan proses, HTTPS, patch OS, monitoring dan akses SSH. Kondisi akun/VPS belum diverifikasi; ini opsi bersyarat, bukan janji gratis.
- Jangan memindahkan database produksi ke disk VPS tanpa backup terpisah hanya untuk menghemat tagihan. Domain tetap membutuhkan perpanjangan.

## Yang sudah dapat dieksekusi tanpa berlangganan baru

Kode penyimpanan per catatan, validasi, konflik, draf, kontrol izin, migrasi, adapter R2, skrip backup terenkripsi, workflow dan tes tersedia di repo. Aktivasi pada produksi memerlukan akses konfigurasi hosting/database. R2 memerlukan bucket privat dan kredensial; backup memerlukan bucket terpisah dan secrets GitHub. Akun layanan/paket berbayar tidak dibuat otomatis.

## Sumber resmi

- https://neon.com/pricing
- https://neon.com/docs/introduction/plans
- https://developers.cloudflare.com/r2/pricing/
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://vercel.com/pricing

Harga diverifikasi pada tanggal dokumen; periksa dashboard sebelum aktivasi/pembelian.

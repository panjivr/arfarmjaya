# Pengaturan toko dan invoice

Buka **Toko → Atur Toko**. Pengaturan dibagi menjadi Identitas, Desain invoice, dan Katalog barang. Kertas di sebelahnya adalah pratinjau berisi data contoh, bukan transaksi tersimpan.

## Identitas

Isi nama toko, tagline, alamat, kontak, logo, metode pembayaran, rekening, nama penandatangan, catatan default, serta ucapan penutup. Logo PNG/JPG/WebP maksimal 400 KB. Katalog setiap toko berdiri sendiri.

## Desain

Pilih susunan klasik (logo di kiri, identitas di kanan, bilah INVOICE) atau modern. Ukuran logo dapat diubah dari 40–180 px dan proporsinya tetap dipertahankan. Warna tiap bagian dapat diatur sendiri; tombol reset hanya mengembalikan warna ke aksen toko.

Pilihan tampil/sembunyi tersedia untuk identitas tambahan, kontak, alamat pembeli, jatuh tempo, nomor baris, satuan, harga satuan, subtotal, ongkir, diskon, pembayaran, terbilang, tanda tangan, catatan, dan penutup. Identitas utama dan total tagihan selalu tampil. Ongkir dan diskon yang bernilai tetap ditampilkan agar perhitungan jelas. QR tetap muncul bila invoice ditandatangani, meskipun blok tanda tangan biasa dimatikan.

## Buat dan cetak

Kolom **Keterangan** per barang bersifat opsional dan awalnya tersembunyi. Aktifkan **Toko → Desain invoice → Kolom keterangan** untuk default toko, atau **Tampilkan kolom keterangan** pada halaman Invoice untuk dokumen tertentu. Isi keterangan pada barang manual atau baris barang dari katalog. Mematikan kolom menyembunyikannya dari pratinjau dan cetakan tanpa menghapus isinya. Pengaturan dan isi ikut disimpan, disinkronkan, dan dicadangkan; tersedia pada seluruh 34 template. Invoice lama tetap memakai tampilan sebelumnya.

Di Invoice, pilih toko, isi pembeli, tanggal, alamat, kontak, dan jatuh tempo bila diperlukan. Pilih barang dari katalog atau tambah manual. Atur ongkir, diskon rupiah, dan catatan khusus invoice. Diskon tidak boleh melebihi subtotal + ongkir. Jumlah barang harus positif. Nomor otomatis mengikuti nomor terbesar yang sudah dipakai dan nomor duplikat ditolak.

Nilai tiap baris dibulatkan ke rupiah, lalu dijumlahkan untuk mendapatkan subtotal. Total = subtotal + ongkir − diskon. Cara ini menjaga angka cetak sesuai penjumlahan rincian.

Invoice baru menyimpan salinan identitas dan desain toko tanpa katalog. Mengubah pengaturan toko tidak mengubah cetakan invoice yang sudah disimpan. Saat mengedit, pilih **Gunakan desain toko terbaru** bila ingin memperbaruinya. Invoice lama tanpa salinan desain memakai toko saat ini sampai disimpan ulang.

Cetak memakai A4 portrait, margin 12 mm, menunggu gambar dan font siap, serta menyembunyikan antarmuka aplikasi. Nomor/nama dokumen tetap dipakai sebagai nama PDF. Daftar panjang dapat berlanjut ke halaman berikutnya dengan kepala tabel berulang.

Tanda tangan elektronik adalah hash internal, bukan sertifikasi PSrE. Field baru dan identitas/desain penjual ikut memengaruhi hash baru; format hash invoice lama tetap didukung. Pengeditan menghitung ulang tanda tangan atau menghapusnya jika opsi dimatikan.

## Penyimpanan dan kompatibilitas

Pengaturan ikut state toko, sinkronisasi server, dan ekspor/impor cadangan. Perubahan tidak menambahkan tabel atau kolom PostgreSQL. Berkas schema kini memakai peran Reporting sebagai default akun baru; semua jalur pembuatan akun aplikasi tetap menetapkan peran secara eksplisit. Tidak ada perubahan schema/data production yang dijalankan dari workspace ini.

Modul yang dihentikan dihapus dari halaman, menu, logika, data contoh, dan peran aktif. Endpoint state dan unduhan cadangan tidak lagi mengirim koleksi historis itu, dan klien baru tidak memuatnya ke state maupun cadangan baru. Pada penyimpanan berikutnya, server mengizinkan hanya penghilangan koleksi historis tersebut tanpa membuka izin perubahan data departemen lain. Data pada database yang belum ditulis ulang, cadangan lama, cache perangkat lama, dan riwayat Git tidak otomatis terhapus; belum ada pembersihan langsung production.

## Skill pemasaran

53 skill dari `coreyhaines31/marketingskills` dipasang lokal di `.agents/skills` dengan metode Clone and Copy yang didokumentasikan upstream. Sumber clone tersedia di `/workspace/marketingskills` (commit `88c79f6`); skill tidak dibundel ke aplikasi atau dikirim ke browser. Konteks produk yang dapat ditinjau ada di `.agents/product-marketing.md`. Panduan yang dibaca untuk pekerjaan ini: product-marketing, copywriting, copy-editing, dan cro. Tidak ada iklan, pelacak, atau komunikasi keluar yang diaktifkan.

## Validasi pada workspace ini

- 50 tes otomatis lulus; lint tanpa error (satu peringatan lama pada tes surat).
- Pemeriksaan TypeScript terarah untuk toko/invoice beserta dependensi klien lulus.
- Chromium: pengaturan warna/kolom/logo, simpan–edit, alamat/jatuh tempo/diskon/catatan, QR, PDF, dan layar 390 px lulus tanpa error JavaScript.
- PDF invoice biasa satu halaman A4; 65 baris beruraian panjang tercetak di empat halaman, kepala tabel berulang, seluruh baris dan penutup ada, tanpa halaman kosong.
- Halaman lama mengembalikan 404; landing page dan CTA masuk diperiksa di desktop dan HP.
- Build penuh gagal karena unduhan Google Fonts ditolak jaringan. Prisma generate juga ditolak pada binaries.prisma.sh; pemeriksaan TypeScript global belum dapat selesai karena tipe Prisma belum dihasilkan. Tidak ada pemeriksaan PostgreSQL atau perubahan data production yang dijalankan.

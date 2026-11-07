# Galeri 32 template invoice

## Memilih default toko

Buka **Toko → Atur Toko → Desain invoice → Pilih template invoice**. Galeri berisi 32 template baru dalam kategori Korporat, Digital, Minimal, Kreatif, Retail, Grosir, Jasa, dan Premium. Cari berdasarkan nama/gaya atau pilih kategori. Klik kartu untuk melihat pratinjau data toko. Pilihan juga tersedia dalam dropdown **Susunan invoice**.

Pilihan dibedakan oleh komposisi kop, metadata pelanggan/dokumen, tabel, posisi total, urutan pembayaran, penutup, tipografi, dan kepadatan. Ada 16 pola kop dan 32 kombinasi struktur unik; perubahan warna saja tidak dihitung sebagai template baru.

Setelah memilih, sesuaikan warna per bagian, ukuran logo, dan detail yang tampil, lalu simpan toko. **Pulihkan warna template** mengembalikan palet awal tanpa mengubah ukuran logo atau pilihan detail. Dua desain sebelumnya, Klasik dan Modern, tetap tersedia.

Pada HP, **Lihat pratinjau invoice** berganti dari editor ke kertas agar pengguna tidak perlu menggulir melewati semua pengaturan. Tombol Perbesar ditempatkan di atas kertas sehingga tidak menutupi kop.

## Memilih khusus satu invoice

Di halaman **Invoice**, pilih toko lalu gunakan dropdown **Template invoice**. Pilihan di sini hanya berlaku untuk invoice yang sedang dibuat/diedit; default toko tetap sama. Seluruh data pembeli, barang, harga, tanggal, ongkir, diskon dan catatan tetap dipertahankan.

Saat disimpan, invoice mempertahankan salinan identitas/desain penjual. Perubahan default toko tidak mengganti desain invoice terbit. Gunakan **Gunakan desain toko terbaru** saat mengedit jika memang ingin menggantinya. Nama template dan kategori hanya terlihat di editor, bukan pada cetakan.

## Katalog

| Kategori | Template |
| --- | --- |
| Korporat | Atlas, Boardroom, Executive, Meridian |
| Digital | Flux, Cloud, Pulse, Orbit |
| Minimal | Mono, Whitespace, Gridline, Plain |
| Kreatif | Studio, Canvas, Portfolio, Folio |
| Retail | Counter, Boutique, Market, Receipt |
| Grosir | Ledger, Supply, Dispatch, Warehouse |
| Jasa | Consultant, Project, Service, Agency |
| Premium | Signature, Maison, Heritage, Gallery |

## Data dan kompatibilitas

ID preset memakai akhiran versi, misalnya `atlas-v1`. Definisi v1 harus dipertahankan; revisi komposisi berikutnya memerlukan ID versi baru. Nama, logo, bank, alamat, pembeli, dan rincian transaksi berasal dari toko/invoice, bukan data contoh galeri.

`invoiceDesign.templateId` bersifat opsional pada JSON toko/salinan penjual. Data lama tanpa ID tetap memakai renderer klasik/modern dan tidak disisipi ID baru ketika dinormalisasi. ID tidak dikenal jatuh kembali ke desain lama tanpa membuat halaman gagal. Pengaturan ikut penyimpanan, sinkronisasi, dan cadangan yang sudah ada. Tidak ada perubahan model database atau migrasi data produksi.

Tanda tangan baru mengikat identitas/desain yang dipilih melalui hash yang sudah ada. Informasi QR dan hash tetap dicetak untuk dokumen bertanda tangan, terlepas dari pilihan menyembunyikan tanda tangan biasa. Nama aplikasi dan watermark penyedia tidak ditambahkan ke dokumen. Header/footer otomatis milik browser masih dikendalikan dialog cetak; nonaktifkan opsi tersebut untuk PDF yang hanya berisi invoice.

## Cetak dan pemeriksaan

Ukuran cetak tetap A4 portrait. Tabel panjang menggunakan kepala tabel berulang, baris tidak dipotong di tengah, dan blok tanda tangan/penutup dijaga bersama. Total tagihan selalu tampil. Ongkir/diskon yang bernilai tidak disembunyikan agar pembaca dapat menelusuri perhitungan.

Tes otomatis memeriksa keragaman struktur, semua field wajib pada 32 renderer, kontrol tampil/sembunyi, kompatibilitas lama, palet independen, desain berbeda per toko, salinan invoice, override per invoice, serta perubahan hash. Pemeriksaan browser memakai data sintetis, bukan database produksi.

Referensi riset dan batas akses sumber: [INVOICE-TEMPLATE-RESEARCH.md](INVOICE-TEMPLATE-RESEARCH.md).

Validasi workspace pada 2026-11-07: 54 tes lulus; TypeScript terarah toko/invoice dan dependensi klien lulus; lint tanpa error dengan satu peringatan lama pada tes surat. Chromium memeriksa semua 32 pilihan, pencarian/filter, simpan/buka ulang, warna kustom, reset palet tanpa mengubah logo, salinan desain lama, override khusus invoice, dan layar 390 px tanpa error JavaScript.

Matriks cetak memakai 128 PDF (32 template × invoice pendek, 65 baris, tanda tangan elektronik, serta logo 180 px dengan nama toko panjang). Semua rincian dan total terjaga, halaman tidak kosong, kepala tabel berulang pada halaman berisi barang, dan tidak ada konten melebar keluar kertas. Seluruh invoice pendek dan pendek bertanda tangan muat satu A4; konten panjang/logo besar boleh berlanjut halaman. Pengujian menggunakan data sintetis dan tidak menulis ke database perusahaan.

import { ModulePage } from "@/components/module-page";

export default function ReportsPage() {
  return (
    <ModulePage
      title="Laporan"
      description="Laporan inventori, pembelian, pemasok, pergerakan stok, distribusi, penjualan retail, kedaluwarsa, slow moving, fast moving, dan valuasi."
      records={["Valuasi Inventori / Juli 2026", "Produk Fast Moving / Minggu 28", "Laporan Kedaluwarsa / 30 hari"]}
      actions={["Ekspor PDF", "Ekspor Excel", "Ekspor CSV", "Jadwalkan laporan", "Kirim email"]}
    />
  );
}

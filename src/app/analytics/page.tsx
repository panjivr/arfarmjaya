import { ModulePage } from "@/components/module-page";

export default function AnalyticsPage() {
  return (
    <ModulePage
      title="Analitik Dasbor"
      description="Analitik pembelian bulanan, nilai inventori, peringkat pemasok, produk fast moving, slow moving, tren distribusi, pendapatan, dan biaya."
      records={["Peringkat Pemasok / PT Agro Nutrisi Prima", "Slow Moving / Kategori kimia", "Pendapatan vs Biaya / Juli 2026"]}
      actions={["Refresh model", "Bandingkan periode", "Segmentasi gudang", "Ekspor chart", "Bagikan insight"]}
    />
  );
}

import { ModulePage } from "@/components/module-page";

export default function PurchasePage() {
  return (
    <ModulePage
      title="Pembelian"
      description="Alur pembelian dari permintaan pembelian, pesanan pembelian, penerimaan barang, retur pembelian, sampai persetujuan."
      stages={["Permintaan Pembelian", "Persetujuan Manajer", "Pesanan Pembelian", "Konfirmasi Pemasok", "Penerimaan Barang", "Retur Pembelian"]}
      records={["PO-2026-0712-001 / PT Agro Nutrisi Prima", "PR-2026-0712-014 / Restok vitamin", "RTN-2026-0711-003 / Kemasan rusak"]}
      actions={["Buat PR", "Setujui PR", "Terbitkan PO", "Terima parsial", "Retur barang"]}
    />
  );
}

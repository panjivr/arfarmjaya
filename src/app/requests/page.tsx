import { ModulePage } from "@/components/module-page";

export default function RequestsPage() {
  return (
    <ModulePage
      title="Permintaan Barang"
      description="Cabang atau dapur dapat meminta barang dengan persetujuan manajer, persetujuan gudang, picking, packing, pengiriman, dan konfirmasi diterima."
      stages={["Permintaan", "Persetujuan Manajer", "Persetujuan Gudang", "Picking", "Packing", "Pengiriman", "Diterima"]}
      records={["REQ-260712-031 / Dapur Pusat", "REQ-260712-032 / Cabang Bekasi", "REQ-260711-117 / Front retail"]}
      actions={["Buat permintaan", "Setujui manajer", "Setujui gudang", "Pick stok", "Konfirmasi diterima"]}
    />
  );
}

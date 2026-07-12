import { ModulePage } from "@/components/module-page";

export default function StockOpnamePage() {
  return (
    <ModulePage
      title="Stok Opname"
      description="Penghitungan fisik dengan stok sistem, stok aktual, selisih, alasan, persetujuan, dan riwayat selisih."
      stages={["Sesi Hitung", "Scan Rak", "Input Stok Aktual", "Alasan Selisih", "Persetujuan", "Adjustment Diposting"]}
      records={["OPN-260712-CS / Gudang Dingin", "OPN-260711-DRY / Gudang Kering", "OPN-260710-CHM / Gudang Kimia"]}
      actions={["Mulai hitung", "Scan rak", "Catat selisih", "Setujui selisih", "Ekspor riwayat"]}
    />
  );
}

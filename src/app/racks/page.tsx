import { ModulePage } from "@/components/module-page";
import { moduleSummaries } from "@/lib/data";

export default function RacksPage() {
  return (
    <ModulePage
      title="Manajemen Rak"
      description="Pengelolaan kode rak dengan label lokasi seperti A-01-01 untuk penyimpanan, picking, dan stok opname."
      records={moduleSummaries.racks}
      actions={["Buat kode rak", "Tentukan gudang", "Cetak label", "Scan QR", "Pantau kapasitas"]}
    />
  );
}

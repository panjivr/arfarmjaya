import { ModulePage } from "@/components/module-page";
import { moduleSummaries } from "@/lib/data";

export default function WarehousesPage() {
  return (
    <ModulePage
      title="Gudang"
      description="Kontrol beberapa gudang untuk gudang utama, gudang dingin, gudang kering, gudang kimia, dan gudang kemasan."
      records={moduleSummaries.warehouses}
      actions={["Buat gudang", "Tugaskan staf", "Petakan zona", "Atur aturan simpan", "Review kapasitas"]}
    />
  );
}

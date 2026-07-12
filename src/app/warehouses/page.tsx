import { ModulePage } from "@/components/module-page";
import { moduleSummaries } from "@/lib/data";

export default function WarehousesPage() {
  return (
    <ModulePage
      title="Warehouses"
      description="Multiple warehouse control for main warehouse, cold storage, dry storage, chemical storage, and packaging storage."
      records={moduleSummaries.warehouses}
      actions={["Create warehouse", "Assign staff", "Map zones", "Set storage rules", "Review capacity"]}
    />
  );
}

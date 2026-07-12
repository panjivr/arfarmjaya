import { ModulePage } from "@/components/module-page";
import { moduleSummaries } from "@/lib/data";

export default function RacksPage() {
  return (
    <ModulePage
      title="Rack Management"
      description="Rack code management with structured location labels such as A-01-01 for fast storage, picking, and stock opname."
      records={moduleSummaries.racks}
      actions={["Generate rack code", "Assign warehouse", "Print label", "Scan QR", "Track capacity"]}
    />
  );
}

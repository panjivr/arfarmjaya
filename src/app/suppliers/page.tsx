import { ModulePage } from "@/components/module-page";
import { moduleSummaries } from "@/lib/data";

export default function SuppliersPage() {
  return (
    <ModulePage
      title="Suppliers"
      description="Supplier profiles with company, contact, phone, email, address, tax number, payment terms, ranking, and purchase performance."
      records={moduleSummaries.suppliers}
      actions={["Add supplier", "Validate tax number", "Set payment terms", "Rank supplier", "Export supplier report"]}
    />
  );
}

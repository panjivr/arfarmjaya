import { ModulePage } from "@/components/module-page";

export default function ReportsPage() {
  return (
    <ModulePage
      title="Reports"
      description="Inventory, purchase, supplier, stock movement, distribution, retail sales, expired, slow moving, fast moving, and valuation reports."
      records={["Inventory Valuation / July 2026", "Fast Moving Products / Week 28", "Expired Report / 30-day horizon"]}
      actions={["Export PDF", "Export Excel", "Export CSV", "Schedule report", "Email report"]}
    />
  );
}

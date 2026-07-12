import { ModulePage } from "@/components/module-page";

export default function AnalyticsPage() {
  return (
    <ModulePage
      title="Dashboard Analytics"
      description="Analytics for monthly purchases, inventory value, supplier ranking, fast moving products, slow moving products, distribution trend, revenue, and expenses."
      records={["Supplier Ranking / PT Agro Nutrisi Prima", "Slow Moving / Chemical category", "Revenue vs Expenses / July 2026"]}
      actions={["Refresh model", "Compare period", "Segment warehouse", "Export chart", "Share insight"]}
    />
  );
}

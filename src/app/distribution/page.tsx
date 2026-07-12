import { ModulePage } from "@/components/module-page";

export default function DistributionPage() {
  return (
    <ModulePage
      title="Distribution"
      description="Warehouse distribution workflow covering picking, packing, loading, shipping, delivered, and completed status."
      stages={["Warehouse", "Picking", "Packing", "Loading", "Shipping", "Delivered", "Completed"]}
      records={["DO-260712-018 / Branch Cibubur", "DO-260712-019 / Kitchen Central", "DO-260711-088 / Retail store"]}
      actions={["Create delivery", "Assign driver", "Print manifest", "Track status", "Confirm delivery"]}
    />
  );
}

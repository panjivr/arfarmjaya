import { ModulePage } from "@/components/module-page";

export default function RequestsPage() {
  return (
    <ModulePage
      title="Request Goods"
      description="Branches and kitchens can request goods with manager approval, warehouse approval, picking, packing, delivery, and received confirmation."
      stages={["Request", "Manager Approval", "Warehouse Approval", "Picking", "Packing", "Delivery", "Received"]}
      records={["REQ-260712-031 / Kitchen Central", "REQ-260712-032 / Branch Bekasi", "REQ-260711-117 / Retail front"]}
      actions={["Create request", "Manager approve", "Warehouse approve", "Pick stock", "Confirm received"]}
    />
  );
}

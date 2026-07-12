import { ModulePage } from "@/components/module-page";

export default function PurchasePage() {
  return (
    <ModulePage
      title="Purchase Module"
      description="End-to-end purchasing from purchase request to purchase order, goods receiving, return purchase, and approval workflow."
      stages={["Purchase Request", "Manager Approval", "Purchase Order", "Supplier Confirmation", "Receiving Goods", "Return Purchase"]}
      records={["PO-2026-0712-001 / PT Agro Nutrisi Prima", "PR-2026-0712-014 / Vitamin restock", "RTN-2026-0711-003 / Damaged packaging"]}
      actions={["Create PR", "Approve PR", "Issue PO", "Receive partial", "Return goods"]}
    />
  );
}

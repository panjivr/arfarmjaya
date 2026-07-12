import { ModulePage } from "@/components/module-page";

export default function ReceivingPage() {
  return (
    <ModulePage
      title="Receiving Goods"
      description="Barcode-based receiving workflow that updates stock after purchase order validation, batch input, and expiration date capture."
      stages={["Purchase Order", "Receive Goods", "Scan Barcode", "Input Batch", "Input Expiration", "Stock Updated"]}
      records={["GRN-260712-008 / Layer Feed", "GRN-260712-009 / Egg Carton", "GRN-260711-021 / Disinfectant quarantine"]}
      actions={["Scan barcode", "Input batch", "Validate expiry", "Create GRN", "Update stock"]}
    />
  );
}

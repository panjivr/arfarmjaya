import { ModulePage } from "@/components/module-page";

export default function PosPage() {
  return (
    <ModulePage
      title="Retail POS"
      description="Simple point of sale for barcode scanner, cash, bank transfer, QRIS payment, receipt, and automatic retail stock deduction."
      stages={["Scan Barcode", "Cart Review", "Payment Method", "QRIS/Cash/Transfer", "Receipt", "Stock Deducted"]}
      records={["POS-260712-220 / QRIS", "POS-260712-221 / Cash", "POS-260712-222 / Transfer"]}
      actions={["Open register", "Scan item", "Apply discount", "Collect payment", "Print receipt"]}
    />
  );
}

import { ModulePage } from "@/components/module-page";

export default function StockOpnamePage() {
  return (
    <ModulePage
      title="Stock Opname"
      description="Physical stock count with system stock, actual stock, difference, reason, approval, and historical variance tracking."
      stages={["Count Session", "Scan Rack", "Input Actual Stock", "Variance Reason", "Approval", "Adjustment Posted"]}
      records={["OPN-260712-CS / Cold Storage", "OPN-260711-DRY / Dry Storage", "OPN-260710-CHM / Chemical Storage"]}
      actions={["Start count", "Scan rack", "Record variance", "Approve difference", "Export history"]}
    />
  );
}

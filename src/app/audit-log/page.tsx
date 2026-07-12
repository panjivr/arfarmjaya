import { ModulePage } from "@/components/module-page";

export default function AuditLogPage() {
  return (
    <ModulePage
      title="Audit Log"
      description="Immutable audit trail that records who changed what, when it happened, old value, new value, and IP address."
      records={["Admin updated minimum stock", "Warehouse Manager approved adjustment", "Cashier voided POS transaction"]}
      actions={["Filter actor", "Compare values", "Export evidence", "Review IP", "Lock retention"]}
    />
  );
}

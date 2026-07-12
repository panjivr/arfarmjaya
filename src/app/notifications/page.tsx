import { ModulePage } from "@/components/module-page";

export default function NotificationsPage() {
  return (
    <ModulePage
      title="Notifications"
      description="Operational alerts for low stock, expired products, purchase approval, distribution status, and goods received events."
      records={["Low stock / Poultry Vitamin", "Expiring / Grade A Eggs Tray", "Purchase approval / PR-260712-014"]}
      actions={["Create rule", "Mark read", "Escalate", "Send email", "Send WhatsApp webhook"]}
    />
  );
}

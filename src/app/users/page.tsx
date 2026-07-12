import { ModulePage } from "@/components/module-page";
import { moduleSummaries } from "@/lib/data";

export default function UsersPage() {
  return (
    <ModulePage
      title="Users & Roles"
      description="Better Auth-ready user management with role based access control for owner, administrator, warehouse, purchasing, cashier, driver, and viewer users."
      records={moduleSummaries.roles}
      actions={["Invite user", "Assign role", "Set permission", "Disable account", "Review access log"]}
    />
  );
}

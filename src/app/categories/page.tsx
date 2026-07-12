import { ModulePage } from "@/components/module-page";
import { moduleSummaries } from "@/lib/data";

export default function CategoriesPage() {
  return (
    <ModulePage
      title="Categories"
      description="CRUD category management for feed, veterinary, retail, packaging, chemical, and future product groupings."
      records={moduleSummaries.categories}
      actions={["Create category", "Edit hierarchy", "Merge duplicate", "Archive category", "Audit changes"]}
    />
  );
}

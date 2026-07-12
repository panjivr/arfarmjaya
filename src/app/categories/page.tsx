import { ModulePage } from "@/components/module-page";
import { moduleSummaries } from "@/lib/data";

export default function CategoriesPage() {
  return (
    <ModulePage
      title="Kategori"
      description="Pengelolaan kategori untuk pakan, veteriner, retail, kemasan, kimia, dan kelompok produk lain."
      records={moduleSummaries.categories}
      actions={["Buat kategori", "Edit hierarki", "Gabungkan duplikat", "Arsip kategori", "Audit perubahan"]}
    />
  );
}

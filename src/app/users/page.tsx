import { ModulePage } from "@/components/module-page";
import { moduleSummaries } from "@/lib/data";

export default function UsersPage() {
  return (
    <ModulePage
      title="Pengguna & Role"
      description="Manajemen pengguna siap Better Auth dengan hak akses berbasis role untuk admin utama, gudang, pembelian, kasir, driver, dan viewer."
      records={moduleSummaries.roles}
      actions={["Undang pengguna", "Tetapkan role", "Atur izin", "Nonaktifkan akun", "Review akses"]}
    />
  );
}

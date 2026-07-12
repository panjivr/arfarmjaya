import { ModulePage } from "@/components/module-page";
import { moduleSummaries } from "@/lib/data";

export default function SuppliersPage() {
  return (
    <ModulePage
      title="Pemasok"
      description="Profil pemasok berisi perusahaan, kontak, telepon, email, alamat, nomor pajak, termin pembayaran, peringkat, dan performa pembelian."
      records={moduleSummaries.suppliers}
      actions={["Tambah pemasok", "Validasi pajak", "Atur termin", "Beri peringkat", "Ekspor laporan"]}
    />
  );
}

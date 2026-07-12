import { ModulePage } from "@/components/module-page";

export default function NotificationsPage() {
  return (
    <ModulePage
      title="Notifikasi"
      description="Peringatan operasional untuk stok rendah, produk kedaluwarsa, persetujuan pembelian, status distribusi, dan barang diterima."
      records={["Stok rendah / Vitamin Unggas", "Hampir kedaluwarsa / Telur Grade A", "Persetujuan pembelian / PR-260712-014"]}
      actions={["Buat aturan", "Tandai dibaca", "Eskalasi", "Kirim email", "Kirim webhook WhatsApp"]}
    />
  );
}

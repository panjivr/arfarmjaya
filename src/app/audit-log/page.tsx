import { ModulePage } from "@/components/module-page";

export default function AuditLogPage() {
  return (
    <ModulePage
      title="Log Audit"
      description="Jejak audit permanen yang mencatat siapa mengubah apa, kapan terjadi, nilai lama, nilai baru, dan alamat IP."
      records={["Admin mengubah stok minimum", "Manajer gudang menyetujui adjustment", "Kasir membatalkan transaksi POS"]}
      actions={["Filter aktor", "Bandingkan nilai", "Ekspor bukti", "Review IP", "Kunci retensi"]}
    />
  );
}

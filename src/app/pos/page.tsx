import { ModulePage } from "@/components/module-page";

export default function PosPage() {
  return (
    <ModulePage
      title="POS Retail"
      description="Kasir sederhana untuk scanner barcode, tunai, transfer, QRIS, struk, dan pengurangan stok otomatis."
      stages={["Scan Barcode", "Review Keranjang", "Metode Bayar", "QRIS/Tunai/Transfer", "Struk", "Stok Berkurang"]}
      records={["POS-260712-220 / QRIS", "POS-260712-221 / Cash", "POS-260712-222 / Transfer"]}
      actions={["Buka kasir", "Scan barang", "Beri diskon", "Terima pembayaran", "Cetak struk"]}
    />
  );
}

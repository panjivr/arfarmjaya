import { ModulePage } from "@/components/module-page";

export default function ReceivingPage() {
  return (
    <ModulePage
      title="Penerimaan Barang"
      description="Alur penerimaan berbasis barcode yang memperbarui stok setelah validasi PO, input batch, dan tanggal kedaluwarsa."
      stages={["Pesanan Pembelian", "Terima Barang", "Scan Barcode", "Input Batch", "Input Kedaluwarsa", "Stok Diperbarui"]}
      records={["GRN-260712-008 / Pakan Layer", "GRN-260712-009 / Karton Telur", "GRN-260711-021 / Disinfektan karantina"]}
      actions={["Scan barcode", "Input batch", "Validasi kedaluwarsa", "Buat GRN", "Update stok"]}
    />
  );
}

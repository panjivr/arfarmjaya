import { AppShell } from "@/components/shell/app-shell";
import { ProductTable } from "@/components/inventory/product-table";

export default function InventoryPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary">Data Master</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Manajemen Inventori</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Data barang dengan SKU, barcode, QR code, harga, stok min/maks, stok saat ini, rak, gudang, pemasok, batch, tanggal kedaluwarsa, dan catatan.
        </p>
      </div>
      <ProductTable />
    </AppShell>
  );
}

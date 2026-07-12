import { AppShell } from "@/components/shell/app-shell";
import { ProductTable } from "@/components/inventory/product-table";

export default function InventoryPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary">Master Data</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Product master with SKU, barcode, QR code, prices, min/max stock, current stock, racks, warehouses, suppliers, batches, expiration dates, and notes.
        </p>
      </div>
      <ProductTable />
    </AppShell>
  );
}

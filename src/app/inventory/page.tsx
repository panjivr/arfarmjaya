"use client";

import { Boxes } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ProductTable } from "@/components/inventory/product-table";

export default function InventoryPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Inventori & Master"
        title="Manajemen Inventori"
        description="Data barang lengkap: SKU, barcode, harga, stok min, stok saat ini, rak, gudang, pemasok, batch, dan kedaluwarsa. Cari, filter, ekspor, dan kelola langsung."
        action={<div className="hidden items-center gap-2 text-sm text-muted lg:flex"><Boxes className="h-4 w-4" /> Sumber data stok real</div>}
      />
      <ProductTable />
    </AppShell>
  );
}

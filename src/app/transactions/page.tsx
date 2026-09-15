"use client";

import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { StockOutForm } from "@/components/inventory/stock-out-form";

export default function TransactionsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Operasional"
        title="Barang Keluar"
        description="Catat barang keluar dari gudang. Stok inventori langsung berkurang dan tercatat di log audit."
      />
      <StockOutForm />
    </AppShell>
  );
}

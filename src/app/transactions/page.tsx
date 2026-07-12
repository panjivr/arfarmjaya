import { AppShell } from "@/components/shell/app-shell";
import { StockOutForm } from "@/components/inventory/stock-out-form";

export default function TransactionsPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary">Operasional Gudang</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Barang Keluar</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Karyawan gudang dapat mencatat barang keluar, misalnya Barang A keluar 50 pcs. Admin Utama tetap dapat melihat dan mengelola seluruh akses.
        </p>
      </div>
      <StockOutForm />
    </AppShell>
  );
}

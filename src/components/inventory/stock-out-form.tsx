"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, MinusCircle, PackageMinus, Save } from "lucide-react";
import { products } from "@/lib/data";
import { useUiStore } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function StockOutForm() {
  const [sku, setSku] = useState(products[0]?.sku ?? "");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("Pengambilan operasional");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const recordStockOut = useUiStore((state) => state.recordStockOut);
  const movements = useUiStore((state) => state.stockMovements);
  const selectedProduct = useMemo(() => products.find((product) => product.sku === sku) ?? products[0], [sku]);
  const sessionStockOut = movements
    .filter((movement) => movement.sku === selectedProduct?.sku)
    .reduce((total, movement) => total + movement.quantity, 0);
  const availableStock = Math.max((selectedProduct?.currentStock ?? 0) - sessionStockOut, 0);

  function submitMovement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedProduct) {
      setError("Barang tidak ditemukan.");
      return;
    }

    if (quantity <= 0) {
      setError("Jumlah keluar harus lebih dari 0.");
      return;
    }

    if (quantity > availableStock) {
      setError(`Stok tidak cukup. Sisa stok tersedia ${availableStock} ${selectedProduct.unit}.`);
      return;
    }

    recordStockOut({
      sku: selectedProduct.sku,
      productName: selectedProduct.name,
      quantity,
      unit: selectedProduct.unit,
      note,
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2400);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white">
              <PackageMinus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Input Barang Keluar</h2>
              <p className="text-sm text-muted">Pilih barang, isi jumlah, lalu simpan transaksi keluar.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submitMovement}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Barang</span>
              <select
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                {products.map((product) => (
                  <option key={product.sku} value={product.sku}>
                    {product.name} - stok {product.currentStock} {product.unit}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Jumlah Keluar</span>
                <input
                  type="number"
                  min={1}
                  max={availableStock}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted">Sisa estimasi</p>
                <p className="mt-1 text-xl font-bold">
                  {Math.max(availableStock - quantity, 0)} {selectedProduct?.unit}
                </p>
                <p className="mt-1 text-xs text-muted">Tersedia: {availableStock} {selectedProduct?.unit}</p>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Catatan</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Contoh: Barang keluar untuk cabang A"
              />
            </label>

            {success && (
              <div className="flex items-center gap-2 rounded-lg border border-leaf/30 bg-leaf/10 px-3 py-2 text-sm font-medium text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Barang keluar berhasil dicatat.
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-danger/20 bg-red-50 px-3 py-2 text-sm font-medium text-danger">
                {error}
              </div>
            )}

            <Button className="w-full" type="submit">
              <Save className="h-4 w-4" />
              Simpan Barang Keluar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Riwayat Barang Keluar</h2>
          <p className="text-sm text-muted">Riwayat ini tersimpan di sesi browser dan siap disambungkan ke database.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {movements.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <MinusCircle className="mx-auto h-8 w-8 text-muted" />
                <p className="mt-3 font-semibold">Belum ada barang keluar</p>
                <p className="mt-1 text-sm text-muted">Transaksi yang dicatat karyawan akan tampil di sini.</p>
              </div>
            ) : (
              movements.map((movement) => (
                <div key={movement.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">{movement.productName}</p>
                      <p className="text-sm text-muted">{movement.sku} / {movement.note}</p>
                    </div>
                    <span className="rounded-full bg-harvest/15 px-3 py-1 text-sm font-bold text-amber-800">
                      -{movement.quantity} {movement.unit}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Dicatat oleh {movement.actor} pada {new Date(movement.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

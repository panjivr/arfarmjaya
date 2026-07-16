"use client";

import { useMemo, useState } from "react";
import { MinusCircle, PackageMinus, Save } from "lucide-react";
import { useUiStore } from "@/lib/store";
import { toast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";

export function StockOutForm() {
  const products = useUiStore((s) => s.products);
  const movements = useUiStore((s) => s.movements);
  const recordMovement = useUiStore((s) => s.recordMovement);

  const [sku, setSku] = useState(products[0]?.sku ?? "");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("Pengambilan operasional");

  const selectedProduct = useMemo(() => products.find((p) => p.sku === sku) ?? products[0], [products, sku]);
  const available = selectedProduct?.currentStock ?? 0;
  const outMovements = movements.filter((m) => m.type === "out");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) {
      toast.error("Barang tidak ditemukan.");
      return;
    }
    const result = recordMovement({ type: "out", sku: selectedProduct.sku, quantity, note });
    if (!result.ok) {
      toast.error(result.message ?? "Gagal mencatat.");
      return;
    }
    toast.success(`${quantity} ${selectedProduct.unit} ${selectedProduct.name} keluar.`);
    setQuantity(1);
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
              <p className="text-sm text-muted">Pilih barang, isi jumlah, lalu simpan. Stok langsung berkurang.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit} noValidate>
            <Field label="Barang">
              <Select value={sku} onChange={(e) => setSku(e.target.value)}>
                {products.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    {p.name} — stok {p.currentStock} {p.unit}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Jumlah Keluar">
                <Input
                  type="number"
                  min={1}
                  max={available}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                />
              </Field>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted">Sisa setelah keluar</p>
                <p className="mt-1 text-xl font-bold">{Math.max(available - quantity, 0)} {selectedProduct?.unit}</p>
                <p className="mt-1 text-xs text-muted">Tersedia: {available} {selectedProduct?.unit}</p>
              </div>
            </div>

            <Field label="Catatan">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Barang keluar untuk cabang A" />
            </Field>

            <Button className="w-full" type="submit" disabled={available <= 0}>
              <Save className="h-4 w-4" />
              {available <= 0 ? "Stok Habis" : "Simpan Barang Keluar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Riwayat Barang Keluar</h2>
          <p className="text-sm text-muted">Riwayat tersimpan lokal dan memperbarui stok inventori.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {outMovements.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <MinusCircle className="mx-auto h-8 w-8 text-muted" />
                <p className="mt-3 font-semibold">Belum ada barang keluar</p>
                <p className="mt-1 text-sm text-muted">Transaksi yang dicatat akan tampil di sini.</p>
              </div>
            ) : (
              outMovements.slice(0, 12).map((m) => (
                <div key={m.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">{m.productName}</p>
                      <p className="text-sm text-muted">{m.sku} / {m.note}</p>
                    </div>
                    <Badge className="bg-harvest/15 text-amber-800">-{m.quantity} {m.unit}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted">Dicatat oleh {m.actor} pada {formatDateTime(m.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Search, ShoppingBag, Trash2, Wallet } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { currency, formatDateTime } from "@/lib/utils";
import type { OrderLine, PaymentMethod } from "@/lib/types";

type Receipt = { number: string; total: number; change: number };

export default function PosPage() {
  const products = useUiStore((s) => s.products);
  const posSales = useUiStore((s) => s.posSales);
  const createSale = useUiStore((s) => s.createSale);

  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("Tunai");
  const [paid, setPaid] = useState(0);
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null);

  const todayKey = new Date().toDateString();
  const todaySales = posSales.filter((s) => new Date(s.createdAt).toDateString() === todayKey);
  const totalSales = posSales.reduce((t, s) => t + s.total, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q))
      : products;
    return list.slice(0, 40);
  }, [products, query]);

  function addToCart(sku: string) {
    const product = products.find((p) => p.sku === sku);
    if (!product) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.sku === sku);
      if (existing) return prev.map((l) => (l.sku === sku ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { sku: product.sku, name: product.name, unit: product.unit, quantity: 1, price: product.retailPrice }];
    });
  }

  function changeQty(sku: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.sku === sku ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  function removeLine(sku: string) {
    setCart((prev) => prev.filter((l) => l.sku !== sku));
  }

  const subtotal = cart.reduce((t, l) => t + l.price * l.quantity, 0);
  const total = Math.max(subtotal - discount, 0);
  const change = Math.max(paid - total, 0);

  function pay() {
    if (cart.length === 0) return toast.error("Keranjang masih kosong.");
    if (paid < total) return toast.error("Nominal bayar kurang dari total.");
    const res = createSale({ lines: cart, discount, payment, paid });
    if (!res.ok) return toast.error(res.message ?? "Gagal memproses penjualan.");
    const latest = useUiStore.getState().posSales[0];
    if (latest) setLastReceipt({ number: latest.number, total: latest.total, change: latest.change });
    toast.success("Pembayaran berhasil, stok berkurang.");
    setCart([]);
    setDiscount(0);
    setPaid(0);
    setPayment("Tunai");
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Operasional"
        title="POS Retail"
        description="Kasir retail: cari barang, tambahkan ke keranjang, terima pembayaran, dan stok otomatis berkurang."
      />

      <section className="mb-4 grid gap-4 sm:grid-cols-2">
        <StatCard label="Transaksi Hari Ini" value={todaySales.length} icon={ShoppingBag} />
        <StatCard label="Total Penjualan" value={currency.format(totalSales)} icon={Wallet} tone="primary" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Cari nama, SKU, atau barcode..."
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid max-h-[520px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {filtered.map((p) => (
                <button
                  key={p.sku}
                  onClick={() => addToCart(p.sku)}
                  disabled={p.currentStock <= 0}
                  className="flex flex-col rounded-lg border border-border bg-background p-3 text-left transition hover:border-primary disabled:opacity-50"
                >
                  <span className="line-clamp-2 text-sm font-semibold">{p.name}</span>
                  <span className="mt-1 text-xs text-muted">{p.sku} · Stok {p.currentStock} {p.unit}</span>
                  <span className="mt-2 text-sm font-bold text-primary">{currency.format(p.retailPrice)}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex items-center justify-between">
            <span className="font-semibold">Keranjang</span>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs font-semibold text-danger">Kosongkan</button>
            )}
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">Keranjang kosong. Pilih barang di sebelah kiri.</p>
            ) : (
              cart.map((l) => (
                <div key={l.sku} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-muted">{currency.format(l.price)} × {l.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="secondary" className="h-8 w-8 px-0" onClick={() => changeQty(l.sku, -1)} aria-label="Kurangi"><Minus className="h-3.5 w-3.5" /></Button>
                    <span className="w-8 text-center text-sm font-semibold">{l.quantity}</span>
                    <Button variant="secondary" className="h-8 w-8 px-0" onClick={() => changeQty(l.sku, 1)} aria-label="Tambah"><Plus className="h-3.5 w-3.5" /></Button>
                    <button onClick={() => removeLine(l.sku)} className="ml-1 text-danger" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
          <div className="space-y-3 border-t border-border p-5">
            <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span className="font-medium">{currency.format(subtotal)}</span></div>
            <Field label="Diskon">
              <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))} />
            </Field>
            <Field label="Metode Bayar">
              <Select value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod)}>
                <option value="Tunai">Tunai</option>
                <option value="Transfer">Transfer</option>
                <option value="QRIS">QRIS</option>
              </Select>
            </Field>
            <Field label="Bayar">
              <Input type="number" min={0} value={paid} onChange={(e) => setPaid(Math.max(0, Number(e.target.value)))} />
            </Field>
            <div className="flex justify-between text-base font-bold"><span>Total</span><span>{currency.format(total)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted">Kembalian</span><span className="font-semibold">{currency.format(change)}</span></div>
            <Button className="w-full" onClick={pay}><Wallet className="h-4 w-4" /> Bayar</Button>
          </div>
        </Card>
      </div>

      {lastReceipt && (
        <Card className="mt-4 border-primary/30">
          <CardContent className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Struk terakhir: <span className="font-mono">{lastReceipt.number}</span></p>
              <p className="text-sm text-muted">Total {currency.format(lastReceipt.total)} · Kembalian {currency.format(lastReceipt.change)}</p>
            </div>
            <Button variant="secondary" className="h-9" onClick={() => setLastReceipt(null)}>Tutup</Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader><span className="font-semibold">Penjualan Terbaru</span></CardHeader>
        <CardContent className="p-0">
          {posSales.length === 0 ? (
            <p className="p-5 text-center text-sm text-muted">Belum ada transaksi.</p>
          ) : (
            <div className="divide-y divide-border">
              {posSales.slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <span className="font-mono font-semibold">{s.number}</span>
                    <span className="ml-2 text-muted">{s.payment} · {formatDateTime(s.createdAt)}</span>
                  </div>
                  <span className="font-semibold">{currency.format(s.total)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

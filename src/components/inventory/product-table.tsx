"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Search, Trash2 } from "lucide-react";
import type { Product } from "@/lib/data";
import { useUiStore } from "@/lib/store";
import { toast } from "@/components/ui/toast";
import { currency, exportCsv, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StockStatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";

const STATUSES: Product["status"][] = ["Tersedia", "Stok Rendah", "Hampir Kedaluwarsa", "Karantina", "Habis"];

export function ProductTable({ compact = false }: { compact?: boolean }) {
  const products = useUiStore((s) => s.products);
  const categories = useUiStore((s) => s.categories);
  const addProduct = useUiStore((s) => s.addProduct);
  const deleteProduct = useUiStore((s) => s.deleteProduct);
  const isAdmin = useUiStore((s) => s.user?.role === "ADMIN_UTAMA");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter((p) => {
      const matchQuery =
        !q ||
        [p.name, p.sku, p.barcode, p.category, p.rack, p.supplier, p.status].some((v) => v.toLowerCase().includes(q));
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchCategory = !categoryFilter || p.category === categoryFilter;
      return matchQuery && matchStatus && matchCategory;
    });
  }, [products, query, statusFilter, categoryFilter]);

  function handleExport() {
    exportCsv(
      `inventori-${new Date().toISOString().slice(0, 10)}`,
      filtered.map((p) => ({
        SKU: p.sku,
        Barcode: p.barcode,
        Nama: p.name,
        Kategori: p.category,
        Satuan: p.unit,
        StokAwal: p.initialStock ?? 0,
        Masuk: p.stockIn ?? 0,
        Keluar: p.stockOut ?? 0,
        StokAkhir: p.currentStock,
        HPP: p.purchasePrice,
        Retail: p.retailPrice,
        Rak: p.rack,
        Gudang: p.warehouse,
        Status: p.status,
        Kedaluwarsa: p.expirationDate,
      })),
    );
    toast.success(`${filtered.length} baris diekspor ke CSV.`);
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Cari nama, SKU, barcode, rak, atau pemasok..."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <Button variant="secondary" onClick={handleExport}><Download className="h-4 w-4" /> Ekspor</Button>
          {isAdmin && <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Barang</Button>}
        </div>
      </div>

      <div className="border-b border-border px-4 py-2 text-xs text-muted">
        Menampilkan {filtered.length} dari {products.length} barang
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 font-semibold">SKU</th>
              <th className="px-4 py-3 font-semibold">Nama Barang</th>
              <th className="px-4 py-3 font-semibold">Kategori</th>
              <th className="px-4 py-3 font-semibold">Rak</th>
              {!compact && <th className="px-4 py-3 text-right font-semibold">Masuk</th>}
              {!compact && <th className="px-4 py-3 text-right font-semibold">Keluar</th>}
              <th className="px-4 py-3 text-right font-semibold">Stok Akhir</th>
              <th className="px-4 py-3 text-right font-semibold">HPP</th>
              {!compact && <th className="px-4 py-3 font-semibold">Kedaluwarsa</th>}
              <th className="px-4 py-3 font-semibold">Status</th>
              {isAdmin && <th className="px-4 py-3 text-right font-semibold">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.sku} className="border-t border-border">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="whitespace-nowrap px-4 py-3">{p.category}</td>
                <td className="whitespace-nowrap px-4 py-3">{p.rack}</td>
                {!compact && <td className="px-4 py-3 text-right text-primary">{p.stockIn ?? 0}</td>}
                {!compact && <td className="px-4 py-3 text-right text-amber-700">{p.stockOut ?? 0}</td>}
                <td className="px-4 py-3 text-right font-semibold">{p.currentStock} {p.unit}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{currency.format(p.purchasePrice)}</td>
                {!compact && <td className="whitespace-nowrap px-4 py-3">{formatDate(p.expirationDate)}</td>}
                <td className="px-4 py-3"><StockStatusBadge status={p.status} /></td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      className="h-8 w-8 px-0 text-danger"
                      aria-label="Hapus"
                      onClick={() => {
                        if (confirm(`Hapus ${p.name}?`)) {
                          deleteProduct(p.sku);
                          toast.success("Barang dihapus.");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-border px-4 py-2 text-[11px] text-muted sm:hidden">Geser tabel ke samping untuk melihat kolom lain.</p>

      <AddProductModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={addProduct} />
    </div>
  );
}

function AddProductModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (p: Product) => void }) {
  const categories = useUiStore((s) => s.categories);
  const warehouses = useUiStore((s) => s.warehouses);
  const suppliers = useUiStore((s) => s.suppliers);
  const racks = useUiStore((s) => s.racks);
  const products = useUiStore((s) => s.products);

  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "pcs",
    purchasePrice: "",
    retailPrice: "",
    minStock: "5",
    currentStock: "0",
    rack: "",
    warehouse: "",
    supplier: "",
    expirationDate: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.category) {
      toast.error("Nama dan kategori wajib diisi.");
      return;
    }
    const nextNum = products.length + 1;
    const sku = `AFJ-BB-${String(nextNum).padStart(3, "0")}`;
    onSubmit({
      sku,
      barcode: `ARF${String(nextNum).padStart(5, "0")}`,
      name: form.name.trim(),
      category: form.category,
      brand: "AR Farm Jaya",
      unit: form.unit,
      purchasePrice: Number(form.purchasePrice) || 0,
      retailPrice: Number(form.retailPrice) || Number(form.purchasePrice) || 0,
      minStock: Number(form.minStock) || 0,
      maxStock: Math.max(Number(form.currentStock) || 0, Number(form.minStock) || 0) * 3 || 10,
      currentStock: Number(form.currentStock) || 0,
      initialStock: Number(form.currentStock) || 0,
      stockIn: 0,
      stockOut: 0,
      rack: form.rack || racks[0]?.code || "BB-01-01",
      warehouse: form.warehouse || warehouses[0]?.name || "Gudang Bahan Baku",
      supplier: form.supplier || suppliers[0]?.name || "Data Stock Gudang ARFARM",
      batch: `STOCK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
      expirationDate: form.expirationDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      status: "Tersedia",
    });
    toast.success("Barang baru ditambahkan.");
    onClose();
    setForm({ name: "", category: "", unit: "pcs", purchasePrice: "", retailPrice: "", minStock: "5", currentStock: "0", rack: "", warehouse: "", supplier: "", expirationDate: "" });
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Barang" description="Barang baru masuk ke inventori dan tercatat di log audit." size="lg">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Nama Barang">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Contoh: Pakan Layer Premium" />
          </Field>
        </div>
        <Field label="Kategori">
          <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Satuan">
          <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} />
        </Field>
        <Field label="HPP (Rp)">
          <Input type="number" min={0} value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} />
        </Field>
        <Field label="Harga Retail (Rp)">
          <Input type="number" min={0} value={form.retailPrice} onChange={(e) => set("retailPrice", e.target.value)} />
        </Field>
        <Field label="Stok Awal">
          <Input type="number" min={0} value={form.currentStock} onChange={(e) => set("currentStock", e.target.value)} />
        </Field>
        <Field label="Stok Minimum">
          <Input type="number" min={0} value={form.minStock} onChange={(e) => set("minStock", e.target.value)} />
        </Field>
        <Field label="Rak">
          <Select value={form.rack} onChange={(e) => set("rack", e.target.value)}>
            <option value="">Pilih rak</option>
            {racks.map((r) => (
              <option key={r.id} value={r.code}>{r.code}</option>
            ))}
          </Select>
        </Field>
        <Field label="Tanggal Kedaluwarsa">
          <Input type="date" value={form.expirationDate} onChange={(e) => set("expirationDate", e.target.value)} />
        </Field>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit"><Plus className="h-4 w-4" /> Simpan Barang</Button>
        </div>
      </form>
    </Modal>
  );
}

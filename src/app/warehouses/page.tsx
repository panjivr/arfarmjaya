"use client";

import { useState } from "react";
import { Download, Pencil, Plus, Trash2, Warehouse as WarehouseIcon } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { currency, exportCsv, numberFmt } from "@/lib/utils";
import type { Warehouse } from "@/lib/types";

export default function WarehousesPage() {
  const warehouses = useUiStore((s) => s.warehouses);
  const products = useUiStore((s) => s.products);
  const addWarehouse = useUiStore((s) => s.addWarehouse);
  const updateWarehouse = useUiStore((s) => s.updateWarehouse);
  const removeWarehouse = useUiStore((s) => s.removeWarehouse);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  const rowsFor = (warehouseName: string) => products.filter((p) => p.warehouse === warehouseName);
  const skuCount = (warehouseName: string) => rowsFor(warehouseName).length;
  const totalStock = (warehouseName: string) => rowsFor(warehouseName).reduce((t, p) => t + p.currentStock, 0);
  const hppValue = (warehouseName: string) =>
    rowsFor(warehouseName).reduce((t, p) => t + p.currentStock * p.purchasePrice, 0);

  function openCreate() {
    setEditing(null);
    setName("");
    setLocation("");
    setNote("");
    setOpen(true);
  }
  function openEdit(w: Warehouse) {
    setEditing(w);
    setName(w.name);
    setLocation(w.location ?? "");
    setNote(w.note ?? "");
    setOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama gudang wajib diisi.");
      return;
    }
    const data = {
      name: name.trim(),
      location: location.trim() || undefined,
      note: note.trim() || undefined,
    };
    if (editing) {
      updateWarehouse(editing.id, data);
      toast.success("Gudang diperbarui.");
    } else {
      addWarehouse(data);
      toast.success("Gudang ditambahkan.");
    }
    setOpen(false);
  }

  const totalValue = warehouses.reduce((t, w) => t + hppValue(w.name), 0);

  const columns: Column<Warehouse>[] = [
    { key: "name", header: "Nama", render: (w) => <span className="font-medium">{w.name}</span> },
    { key: "location", header: "Lokasi", render: (w) => w.location || "-" },
    { key: "count", header: "Jumlah SKU", align: "right", render: (w) => skuCount(w.name) },
    { key: "stock", header: "Total Stok", align: "right", render: (w) => numberFmt.format(totalStock(w.name)) },
    { key: "value", header: "Nilai HPP", align: "right", render: (w) => currency.format(hppValue(w.name)) },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      render: (w) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => openEdit(w)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
          <Button
            variant="ghost"
            className="h-8 w-8 px-0 text-danger"
            aria-label="Hapus"
            onClick={() => {
              if (skuCount(w.name) > 0) {
                toast.error("Gudang masih dipakai barang.");
                return;
              }
              if (confirm(`Hapus gudang ${w.name}?`)) {
                removeWarehouse(w.id);
                toast.success("Gudang dihapus.");
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Inventori & Master"
        title="Gudang"
        description="Kelola lokasi penyimpanan barang beserta sebaran SKU, total stok, dan nilai HPP tiap gudang."
        action={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                exportCsv(
                  "gudang",
                  warehouses.map((w) => ({
                    nama: w.name,
                    lokasi: w.location ?? "",
                    jumlah_sku: skuCount(w.name),
                    total_stok: totalStock(w.name),
                    nilai_hpp: hppValue(w.name),
                  })),
                )
              }
            >
              <Download className="h-4 w-4" /> Ekspor
            </Button>
            <Button onClick={openCreate}><Plus className="h-4 w-4" /> Gudang Baru</Button>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard label="Total Gudang" value={warehouses.length} icon={WarehouseIcon} />
        <StatCard label="Total SKU" value={products.length} icon={WarehouseIcon} tone="primary" />
        <StatCard label="Nilai HPP" value={currency.format(totalValue)} icon={WarehouseIcon} tone="amber" />
      </section>

      <DataTable
        columns={columns}
        rows={warehouses}
        getKey={(w) => w.id}
        searchPlaceholder="Cari gudang..."
        searchFields={(w) => w.name + " " + (w.location ?? "")}
        emptyTitle="Belum ada gudang"
        emptyDescription="Tambahkan gudang untuk mengatur lokasi penyimpanan."
      />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Gudang" : "Gudang Baru"}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nama"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Gudang Utama" /></Field>
          <Field label="Lokasi (opsional)"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Alamat atau area" /></Field>
          <Field label="Catatan (opsional)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

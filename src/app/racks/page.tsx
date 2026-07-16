"use client";

import { useState } from "react";
import { Download, LayoutGrid, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { exportCsv } from "@/lib/utils";
import type { Rack } from "@/lib/types";

export default function RacksPage() {
  const racks = useUiStore((s) => s.racks);
  const warehouses = useUiStore((s) => s.warehouses);
  const products = useUiStore((s) => s.products);
  const addRack = useUiStore((s) => s.addRack);
  const updateRack = useUiStore((s) => s.updateRack);
  const removeRack = useUiStore((s) => s.removeRack);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rack | null>(null);
  const [code, setCode] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [note, setNote] = useState("");

  const skuCount = (rackCode: string) => products.filter((p) => p.rack === rackCode).length;

  function openCreate() {
    setEditing(null);
    setCode("");
    setWarehouse(warehouses[0]?.name ?? "");
    setNote("");
    setOpen(true);
  }
  function openEdit(r: Rack) {
    setEditing(r);
    setCode(r.code);
    setWarehouse(r.warehouse);
    setNote(r.note ?? "");
    setOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Kode rak wajib diisi.");
      return;
    }
    if (!warehouse.trim()) {
      toast.error("Gudang wajib dipilih.");
      return;
    }
    if (editing) {
      updateRack(editing.id, { code: code.trim(), name: code.trim(), warehouse, note: note.trim() || undefined });
      toast.success("Rak diperbarui.");
    } else {
      addRack({ code: code.trim(), warehouse, note: note.trim() || undefined });
      toast.success("Rak ditambahkan.");
    }
    setOpen(false);
  }

  const columns: Column<Rack>[] = [
    { key: "code", header: "Kode Rak", render: (r) => <span className="font-medium">{r.code}</span> },
    { key: "warehouse", header: "Gudang", render: (r) => r.warehouse || "-" },
    { key: "count", header: "Jumlah SKU", align: "right", render: (r) => skuCount(r.code) },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => openEdit(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
          <Button
            variant="ghost"
            className="h-8 w-8 px-0 text-danger"
            aria-label="Hapus"
            onClick={() => {
              if (skuCount(r.code) > 0) {
                toast.error("Rak masih dipakai barang.");
                return;
              }
              if (confirm(`Hapus rak ${r.code}?`)) {
                removeRack(r.id);
                toast.success("Rak dihapus.");
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const usedCount = racks.filter((r) => skuCount(r.code) > 0).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Data Master"
        title="Manajemen Rak"
        description="Kelola kode rak dan pemetaan gudang untuk penyimpanan, picking, dan stok opname."
        action={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                exportCsv(
                  "rak",
                  racks.map((r) => ({
                    kode_rak: r.code,
                    gudang: r.warehouse,
                    jumlah_sku: skuCount(r.code),
                  })),
                )
              }
            >
              <Download className="h-4 w-4" /> Ekspor
            </Button>
            <Button onClick={openCreate}><Plus className="h-4 w-4" /> Rak Baru</Button>
          </>
        }
      />

      <section className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Rak" value={racks.length} icon={LayoutGrid} />
        <StatCard label="Rak Terpakai" value={usedCount} icon={LayoutGrid} tone="primary" />
        <StatCard label="Jumlah Gudang" value={warehouses.length} icon={LayoutGrid} tone="slate" />
      </section>

      <DataTable
        columns={columns}
        rows={racks}
        getKey={(r) => r.id}
        searchPlaceholder="Cari rak..."
        searchFields={(r) => r.code + " " + r.warehouse}
        emptyTitle="Belum ada rak"
        emptyDescription="Tambahkan kode rak untuk mengatur lokasi penyimpanan barang."
      />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Rak" : "Rak Baru"}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Kode Rak"><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: A-01-01" /></Field>
          <Field label="Gudang">
            <Select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
              <option value="" disabled>Pilih gudang</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.name}>{w.name}</option>
              ))}
            </Select>
          </Field>
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

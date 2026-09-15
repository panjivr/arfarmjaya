"use client";

import { useState } from "react";
import { Archive, Download, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { categoryStats } from "@/lib/selectors";
import { currency, exportCsv, formatDate } from "@/lib/utils";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const categories = useUiStore((s) => s.categories);
  const products = useUiStore((s) => s.products);
  const addCategory = useUiStore((s) => s.addCategory);
  const updateCategory = useUiStore((s) => s.updateCategory);
  const removeCategory = useUiStore((s) => s.removeCategory);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const stats = categoryStats(products);
  const statFor = (catName: string) => stats.find((s) => s.name === catName);

  function openCreate() {
    setEditing(null);
    setName("");
    setNote("");
    setOpen(true);
  }
  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setNote(cat.note ?? "");
    setOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }
    if (editing) {
      updateCategory(editing.id, { name: name.trim(), note });
      toast.success("Kategori diperbarui.");
    } else {
      addCategory(name.trim(), note);
      toast.success("Kategori ditambahkan.");
    }
    setOpen(false);
  }

  const columns: Column<Category>[] = [
    { key: "name", header: "Kategori", render: (c) => <span className="font-medium">{c.name}</span> },
    { key: "count", header: "Jumlah SKU", align: "right", render: (c) => statFor(c.name)?.count ?? 0 },
    { key: "stock", header: "Total Stok", align: "right", render: (c) => statFor(c.name)?.stock ?? 0 },
    { key: "value", header: "Nilai (HPP)", align: "right", render: (c) => currency.format(statFor(c.name)?.value ?? 0) },
    { key: "createdAt", header: "Dibuat", render: (c) => formatDate(c.createdAt) },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => openEdit(c)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
          <Button
            variant="ghost"
            className="h-8 w-8 px-0 text-danger"
            aria-label="Hapus"
            onClick={() => {
              if ((statFor(c.name)?.count ?? 0) > 0) {
                toast.error("Kategori masih dipakai barang.");
                return;
              }
              if (confirm(`Hapus kategori ${c.name}?`)) {
                removeCategory(c.id);
                toast.success("Kategori dihapus.");
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
        title="Kategori"
        description="Kelompokkan barang untuk pelaporan valuasi, filter inventori, dan analitik."
        action={
          <>
            <Button variant="secondary" onClick={() => exportCsv("kategori", stats)}><Download className="h-4 w-4" /> Ekspor</Button>
            <Button onClick={openCreate}><Plus className="h-4 w-4" /> Kategori Baru</Button>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard label="Total Kategori" value={categories.length} icon={Archive} />
        <StatCard label="Kategori Terisi" value={stats.length} icon={Archive} tone="primary" />
        <StatCard label="Nilai Terbesar" value={stats[0]?.name ?? "-"} hint={stats[0] ? currency.format(stats[0].value) : undefined} icon={Archive} tone="amber" />
      </section>

      <DataTable
        columns={columns}
        rows={categories}
        getKey={(c) => c.id}
        searchPlaceholder="Cari kategori..."
        searchFields={(c) => c.name + " " + (c.note ?? "")}
        emptyTitle="Belum ada kategori"
        emptyDescription="Tambahkan kategori untuk mengelompokkan barang."
      />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Kategori" : "Kategori Baru"}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nama Kategori"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Bahan Baku" /></Field>
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

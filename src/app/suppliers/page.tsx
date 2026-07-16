"use client";

import { useState } from "react";
import { Building2, Download, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import { exportCsv } from "@/lib/utils";
import type { Supplier } from "@/lib/types";

export default function SuppliersPage() {
  const suppliers = useUiStore((s) => s.suppliers);
  const products = useUiStore((s) => s.products);
  const addSupplier = useUiStore((s) => s.addSupplier);
  const updateSupplier = useUiStore((s) => s.updateSupplier);
  const removeSupplier = useUiStore((s) => s.removeSupplier);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const skuCount = (supplierName: string) => products.filter((p) => p.supplier === supplierName).length;

  function openCreate() {
    setEditing(null);
    setName("");
    setContact("");
    setPhone("");
    setEmail("");
    setAddress("");
    setOpen(true);
  }
  function openEdit(s: Supplier) {
    setEditing(s);
    setName(s.name);
    setContact(s.contact ?? "");
    setPhone(s.phone ?? "");
    setEmail(s.email ?? "");
    setAddress(s.address ?? "");
    setOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama pemasok wajib diisi.");
      return;
    }
    const data = {
      name: name.trim(),
      contact: contact.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    };
    if (editing) {
      updateSupplier(editing.id, data);
      toast.success("Pemasok diperbarui.");
    } else {
      addSupplier(data);
      toast.success("Pemasok ditambahkan.");
    }
    setOpen(false);
  }

  const usedCount = suppliers.filter((s) => skuCount(s.name) > 0).length;

  const columns: Column<Supplier>[] = [
    { key: "name", header: "Nama", render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "contact", header: "Kontak", render: (s) => s.contact || "-" },
    { key: "phone", header: "Telepon", render: (s) => s.phone || "-" },
    { key: "email", header: "Email", render: (s) => s.email || "-" },
    { key: "count", header: "Jumlah SKU", align: "right", render: (s) => skuCount(s.name) },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => openEdit(s)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
          <Button
            variant="ghost"
            className="h-8 w-8 px-0 text-danger"
            aria-label="Hapus"
            onClick={() => {
              if (skuCount(s.name) > 0) {
                toast.error("Pemasok masih dipakai barang.");
                return;
              }
              if (confirm(`Hapus pemasok ${s.name}?`)) {
                removeSupplier(s.id);
                toast.success("Pemasok dihapus.");
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
        eyebrow="Data Master"
        title="Pemasok"
        description="Kelola profil pemasok beserta kontak, telepon, email, dan alamat untuk pembelian dan penerimaan barang."
        action={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                exportCsv(
                  "pemasok",
                  suppliers.map((s) => ({
                    nama: s.name,
                    kontak: s.contact ?? "",
                    telepon: s.phone ?? "",
                    email: s.email ?? "",
                    alamat: s.address ?? "",
                    jumlah_sku: skuCount(s.name),
                  })),
                )
              }
            >
              <Download className="h-4 w-4" /> Ekspor
            </Button>
            <Button onClick={openCreate}><Plus className="h-4 w-4" /> Pemasok Baru</Button>
          </>
        }
      />

      <section className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Pemasok" value={suppliers.length} icon={Building2} />
        <StatCard label="Pemasok Terpakai" value={usedCount} icon={Building2} tone="primary" />
        <StatCard label="Belum Terpakai" value={suppliers.length - usedCount} icon={Building2} tone="slate" />
      </section>

      <DataTable
        columns={columns}
        rows={suppliers}
        getKey={(s) => s.id}
        searchPlaceholder="Cari pemasok..."
        searchFields={(s) => s.name + " " + (s.contact ?? "") + " " + (s.phone ?? "") + " " + (s.email ?? "")}
        emptyTitle="Belum ada pemasok"
        emptyDescription="Tambahkan pemasok untuk mulai mencatat pembelian."
      />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Pemasok" : "Pemasok Baru"}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nama"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: PT Sumber Tani" /></Field>
          <Field label="Kontak (opsional)"><Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Nama narahubung" /></Field>
          <Field label="Telepon (opsional)"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" /></Field>
          <Field label="Email (opsional)"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@perusahaan.com" /></Field>
          <Field label="Alamat (opsional)"><Textarea value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

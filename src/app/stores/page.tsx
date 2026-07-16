"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Building2, ImagePlus, Pencil, Plus, Store as StoreIcon, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import type { Store } from "@/lib/types";

const empty = {
  name: "",
  address: "",
  phone: "",
  email: "",
  logo: "",
  bankInfo: "",
  invoicePrefix: "INV",
  signatureName: "",
  note: "",
  accent: "#007a4b",
};

export default function StoresPage() {
  const stores = useUiStore((s) => s.stores);
  const invoices = useUiStore((s) => s.invoices);
  const addStore = useUiStore((s) => s.addStore);
  const updateStore = useUiStore((s) => s.updateStore);
  const removeStore = useUiStore((s) => s.removeStore);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [form, setForm] = useState(empty);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(store: Store) {
    setEditing(store);
    setForm({
      name: store.name,
      address: store.address,
      phone: store.phone,
      email: store.email ?? "",
      logo: store.logo ?? "",
      bankInfo: store.bankInfo ?? "",
      invoicePrefix: store.invoicePrefix,
      signatureName: store.signatureName ?? "",
      note: store.note ?? "",
      accent: store.accent ?? "#007a4b",
    });
    setOpen(true);
  }

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 400_000) {
      toast.error("Logo terlalu besar (maks 400 KB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("logo", String(reader.result));
    reader.readAsDataURL(file);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Nama toko wajib diisi.");
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      logo: form.logo || undefined,
      bankInfo: form.bankInfo.trim() || undefined,
      invoicePrefix: form.invoicePrefix.trim() || "INV",
      signatureName: form.signatureName.trim() || form.name.trim(),
      note: form.note.trim() || undefined,
      accent: form.accent || "#007a4b",
    };
    if (editing) {
      updateStore(editing.id, payload);
      toast.success("Toko diperbarui.");
    } else {
      addStore(payload);
      toast.success("Toko ditambahkan.");
    }
    setOpen(false);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Retail & Invoice"
        title="Toko"
        description="Kelola beberapa toko/penjual untuk membuat invoice. Setiap toko punya logo, alamat, kontak, dan info pembayaran sendiri."
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Toko Baru</Button>}
      />

      <section className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Toko" value={stores.length} icon={StoreIcon} />
        <StatCard label="Total Invoice" value={invoices.length} icon={Building2} tone="primary" />
        <StatCard label="Toko dengan Logo" value={stores.filter((s) => s.logo).length} icon={ImagePlus} tone="amber" />
      </section>

      {stores.length === 0 ? (
        <EmptyState icon={StoreIcon} title="Belum ada toko" description="Tambahkan toko untuk mulai membuat invoice." action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Toko Baru</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => {
            const count = invoices.filter((i) => i.storeId === store.id).length;
            return (
              <Card key={store.id} className="overflow-hidden">
                <div className="h-2" style={{ background: store.accent ?? "#007a4b" }} />
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
                      {store.logo ? (
                        <Image src={store.logo} alt={store.name} width={56} height={56} className="h-full w-full object-contain" unoptimized />
                      ) : (
                        <StoreIcon className="h-6 w-6 text-muted" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{store.name}</p>
                      <p className="truncate text-sm text-muted">{store.address || "Tanpa alamat"}</p>
                      <p className="truncate text-xs text-muted">{store.phone}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs">
                    <span className="text-muted">Prefix: <span className="font-mono font-semibold text-foreground">{store.invoicePrefix}</span></span>
                    <span className="text-muted">{count} invoice</span>
                  </div>
                  {store.bankInfo && <p className="mt-2 truncate text-xs text-muted">{store.bankInfo}</p>}
                  <div className="mt-3 flex justify-end gap-1">
                    <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => openEdit(store)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 px-0 text-danger"
                      aria-label="Hapus"
                      onClick={() => {
                        if (count > 0) return toast.error("Toko masih punya invoice.");
                        if (confirm(`Hapus toko ${store.name}?`)) {
                          removeStore(store.id);
                          toast.success("Toko dihapus.");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Toko" : "Toko Baru"} description="Data ini muncul di kop invoice." size="lg">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
              {form.logo ? (
                <Image src={form.logo} alt="logo" width={80} height={80} className="h-full w-full object-contain" unoptimized />
              ) : (
                <ImagePlus className="h-7 w-7 text-muted" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={onLogo} className="hidden" />
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}><ImagePlus className="h-4 w-4" /> Unggah Logo</Button>
              {form.logo && <button type="button" onClick={() => set("logo", "")} className="text-left text-xs text-danger">Hapus logo</button>}
              <span className="text-xs text-muted">PNG/JPG, maks 400 KB.</span>
            </div>
          </div>
          <div className="sm:col-span-2"><Field label="Nama Toko"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="ALIP FRESH FOOD" /></Field></div>
          <div className="sm:col-span-2"><Field label="Alamat"><Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Dkh Krajan 2 Ds Plalangan, Kec. Jenangan" /></Field></div>
          <Field label="Telepon / WA"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="085649363893" /></Field>
          <Field label="Email"><Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="toko@email.com" /></Field>
          <Field label="Prefix Invoice"><Input value={form.invoicePrefix} onChange={(e) => set("invoicePrefix", e.target.value)} placeholder="INVAL" /></Field>
          <Field label="Warna Aksen">
            <input type="color" value={form.accent} onChange={(e) => set("accent", e.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-border bg-background px-1" />
          </Field>
          <div className="sm:col-span-2"><Field label="Info Pembayaran" hint="Muncul di bagian catatan invoice."><Input value={form.bankInfo} onChange={(e) => set("bankInfo", e.target.value)} placeholder="BNI 2024501132 a.n. ALIF LOLITA" /></Field></div>
          <div className="sm:col-span-2"><Field label="Nama pada Tanda Tangan"><Input value={form.signatureName} onChange={(e) => set("signatureName", e.target.value)} placeholder="ALIP FRESH FOOD" /></Field></div>
          <div className="sm:col-span-2"><Field label="Catatan Default"><Textarea value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Barang yang sudah dibeli tidak bisa ditukar." /></Field></div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit">Simpan Toko</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

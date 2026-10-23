"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Building2, ImagePlus, Package, Pencil, Plus, ShieldCheck, Store as StoreIcon, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore } from "@/lib/store";
import type { Store, StoreItem } from "@/lib/types";

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

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
  eSignEnabled: false,
  eSignerName: "",
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
  const [catalog, setCatalog] = useState<StoreItem[]>([]);
  const [itemDraft, setItemDraft] = useState({ name: "", unit: "Pcs", price: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addCatalogItem() {
    const name = itemDraft.name.trim();
    const price = Number(itemDraft.price);
    if (!name) return toast.error("Isi nama barang.");
    setCatalog((c) => [...c, { id: uid(), name, unit: itemDraft.unit.trim() || "Pcs", price: Number.isFinite(price) ? price : 0 }]);
    setItemDraft({ name: "", unit: itemDraft.unit, price: "" });
  }
  function updateCatalogItem(id: string, patch: Partial<StoreItem>) {
    setCatalog((c) => c.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function removeCatalogItem(id: string) {
    setCatalog((c) => c.filter((it) => it.id !== id));
  }

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setCatalog([]);
    setItemDraft({ name: "", unit: "Pcs", price: "" });
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
      eSignEnabled: Boolean(store.eSignEnabled),
      eSignerName: store.eSignerName ?? "",
    });
    setCatalog((store.catalog ?? []).map((it) => ({ ...it })));
    setItemDraft({ name: "", unit: "Pcs", price: "" });
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
      eSignEnabled: form.eSignEnabled,
      eSignerName: form.eSignerName.trim() || undefined,
      catalog: catalog
        .map((it) => ({ ...it, name: it.name.trim(), unit: it.unit.trim() || "Pcs", price: Number.isFinite(it.price) ? it.price : 0 }))
        .filter((it) => it.name),
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
        eyebrow="Penjualan"
        title="Toko"
        description="Kelola beberapa toko/penjual untuk membuat invoice. Setiap toko punya logo, alamat, kontak, dan info pembayaran sendiri."
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Toko Baru</Button>}
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
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
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                    <Package className="h-3.5 w-3.5" />
                    <span>{store.catalog?.length ?? 0} barang di katalog</span>
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
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={form.eSignEnabled}
                onChange={(e) => setForm((f) => ({ ...f, eSignEnabled: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
              />
              <span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Aktifkan Tanda Tangan Elektronik
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  Bila aktif, invoice toko ini otomatis diberi opsi tanda tangan elektronik (QR + hash SHA-256). Tetap
                  bisa dimatikan per invoice.
                </span>
              </span>
            </label>
          </div>
          <div className="sm:col-span-2"><Field label="Nama Penanda Tangan Elektronik" hint="Kosongkan untuk memakai Nama pada Tanda Tangan / nama toko."><Input value={form.eSignerName} onChange={(e) => set("eSignerName", e.target.value)} placeholder="Direktur AR FARM JAYA" /></Field></div>
          <div className="sm:col-span-2"><Field label="Catatan Default"><Textarea value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Barang yang sudah dibeli tidak bisa ditukar." /></Field></div>
          <div className="sm:col-span-2">
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="mb-2 flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Katalog Barang (Daftar Harga)</p>
                <span className="ml-auto text-xs text-muted">{catalog.length} barang</span>
              </div>
              <p className="mb-3 text-xs text-muted">
                Simpan barang yang sering dijual beserta harganya. Saat membuat invoice, tinggal pilih dari katalog ini — tak perlu ketik ulang nama &amp; harga.
              </p>

              {/* Tambah cepat */}
              <div className="grid grid-cols-[1fr_72px_96px_auto] gap-2">
                <Input value={itemDraft.name} onChange={(e) => setItemDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Galon Air Mineral 19L"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCatalogItem(); } }} />
                <Input value={itemDraft.unit} onChange={(e) => setItemDraft((d) => ({ ...d, unit: e.target.value }))} placeholder="Pcs" />
                <Input type="number" min={0} value={itemDraft.price} onChange={(e) => setItemDraft((d) => ({ ...d, price: e.target.value }))} placeholder="Harga" />
                <Button type="button" variant="secondary" className="px-3" onClick={addCatalogItem} aria-label="Tambah barang"><Plus className="h-4 w-4" /></Button>
              </div>

              {catalog.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="grid grid-cols-[1fr_72px_96px_auto] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <span>Nama</span><span>Satuan</span><span className="text-right">Harga</span><span />
                  </div>
                  {catalog.map((it) => (
                    <div key={it.id} className="grid grid-cols-[1fr_72px_96px_auto] items-center gap-2">
                      <Input value={it.name} onChange={(e) => updateCatalogItem(it.id, { name: e.target.value })} />
                      <Input value={it.unit} onChange={(e) => updateCatalogItem(it.id, { unit: e.target.value })} />
                      <Input type="number" min={0} value={it.price} onChange={(e) => updateCatalogItem(it.id, { price: Number(e.target.value) || 0 })} className="text-right" />
                      <button type="button" onClick={() => removeCatalogItem(it.id)} className="px-1 text-danger" aria-label="Hapus barang"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit">Simpan Toko</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

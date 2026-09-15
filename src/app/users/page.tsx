"use client";

import { useState } from "react";
import { Download, Pencil, Plus, Power, Trash2, Users } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { useUiStore, roleLabel } from "@/lib/store";
import { exportCsv } from "@/lib/utils";
import type { ManagedUser, Role } from "@/lib/types";

const roleOptions: Role[] = ["admin", "manajer", "gudang", "pembelian", "kasir", "driver", "viewer", "karyawan"];

export default function UsersPage() {
  const users = useUiStore((s) => s.users);
  const addUser = useUiStore((s) => s.addUser);
  const updateUser = useUiStore((s) => s.updateUser);
  const toggleUserActive = useUiStore((s) => s.toggleUserActive);
  const removeUser = useUiStore((s) => s.removeUser);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role>("gudang");

  function openCreate() {
    setEditing(null);
    setName("");
    setUsername("");
    setRole("gudang");
    setOpen(true);
  }
  function openEdit(u: ManagedUser) {
    setEditing(u);
    setName(u.name);
    setUsername(u.username);
    setRole(u.role);
    setOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama pengguna wajib diisi.");
      return;
    }
    if (!username.trim()) {
      toast.error("Username wajib diisi.");
      return;
    }
    if (editing) {
      updateUser(editing.id, { name: name.trim(), username: username.trim(), role });
      toast.success("Pengguna diperbarui.");
    } else {
      addUser({ name: name.trim(), username: username.trim(), role });
      toast.success("Pengguna ditambahkan.");
    }
    setOpen(false);
  }

  const activeCount = users.filter((u) => u.active).length;
  const uniqueRoles = new Set(users.map((u) => u.role)).size;

  const columns: Column<ManagedUser>[] = [
    { key: "name", header: "Nama", render: (u) => <span className="font-medium">{u.name}</span> },
    { key: "username", header: "Username", render: (u) => u.username },
    { key: "role", header: "Role", render: (u) => roleLabel[u.role] },
    {
      key: "status",
      header: "Status",
      render: (u) =>
        u.active ? (
          <Badge className="bg-leaf/10 text-primary">Aktif</Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Nonaktif</Badge>
        ),
    },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      render: (u) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => openEdit(u)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
          <Button
            variant="ghost"
            className={`h-8 w-8 px-0 ${u.active ? "text-primary" : "text-muted"}`}
            aria-label={u.active ? "Nonaktifkan" : "Aktifkan"}
            onClick={() => {
              toggleUserActive(u.id);
              toast.success(u.active ? "Pengguna dinonaktifkan." : "Pengguna diaktifkan.");
            }}
          >
            <Power className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="h-8 w-8 px-0 text-danger"
            aria-label="Hapus"
            onClick={() => {
              if (confirm(`Hapus pengguna ${u.name}?`)) {
                removeUser(u.id);
                toast.success("Pengguna dihapus.");
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
        title="Pengguna & Role"
        description="Kelola akun pengguna beserta hak akses berbasis role untuk operasional gudang."
        action={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                exportCsv(
                  "pengguna",
                  users.map((u) => ({
                    nama: u.name,
                    username: u.username,
                    role: roleLabel[u.role],
                    status: u.active ? "Aktif" : "Nonaktif",
                  })),
                )
              }
            >
              <Download className="h-4 w-4" /> Ekspor
            </Button>
            <Button onClick={openCreate}><Plus className="h-4 w-4" /> Pengguna Baru</Button>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard label="Total Pengguna" value={users.length} icon={Users} />
        <StatCard label="Pengguna Aktif" value={activeCount} icon={Users} tone="primary" />
        <StatCard label="Jumlah Role" value={uniqueRoles} icon={Users} tone="slate" />
      </section>

      <DataTable
        columns={columns}
        rows={users}
        getKey={(u) => u.id}
        searchPlaceholder="Cari pengguna..."
        searchFields={(u) => u.name + " " + u.username + " " + roleLabel[u.role]}
        emptyTitle="Belum ada pengguna"
        emptyDescription="Tambahkan pengguna untuk mengatur akses sistem."
      />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Pengguna" : "Pengguna Baru"}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nama"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Budi Santoso" /></Field>
          <Field label="Username"><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Contoh: budi" /></Field>
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>{roleLabel[r]}</option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

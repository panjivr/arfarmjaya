"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, ShieldCheck, RefreshCw, KeyRound, Power } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { APP_ROLES, ROLE_META, type AppRole } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";

type ApiUser = { id: string; name: string; username: string; role: AppRole; active: boolean; lastLogin: string | null; createdAt: string };

const emptyForm = { name: "", username: "", password: "", role: "STAFF_LELE" as AppRole, active: true };

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [db, setDb] = useState(true);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.users) {
        setUsers(json.users);
        setDb(Boolean(json.db));
      } else {
        toast.error(json?.message ?? "Gagal memuat pengguna.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) return toast.error(json?.message ?? "Gagal membuat akun.");
      toast.success(`Akun ${form.username} dibuat.`);
      setModal(false);
      setForm(emptyForm);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, okMsg: string) {
    const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) return toast.error(json?.message ?? "Gagal memperbarui.");
    toast.success(okMsg);
    load();
  }

  function changeRole(u: ApiUser, role: AppRole) {
    if (role === u.role) return;
    patch(u.id, { role }, `Peran ${u.username} → ${ROLE_META[role].label}.`);
  }
  function toggleActive(u: ApiUser) {
    patch(u.id, { active: !u.active }, `Akun ${u.username} ${u.active ? "dinonaktifkan" : "diaktifkan"}.`);
  }
  function resetPassword(u: ApiUser) {
    const pw = prompt(`Password baru untuk ${u.username} (min 6 karakter):`, "");
    if (pw == null) return;
    if (pw.length < 6) return toast.error("Password minimal 6 karakter.");
    patch(u.id, { password: pw }, `Password ${u.username} direset.`);
  }

  const admins = users.filter((u) => u.role === "ADMIN_UTAMA").length;
  const activeCount = users.filter((u) => u.active).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administrasi"
        title="Role & Akses Pengguna"
        description="Kelola akun dan peran. Password disimpan sebagai hash (tidak plaintext). Akun lama dinonaktifkan, bukan dihapus, agar histori tetap utuh."
        action={<Button onClick={() => { setForm(emptyForm); setModal(true); }} disabled={!db}><UserPlus className="h-4 w-4" /> Tambah Pengguna</Button>}
      />

      {!db && (
        <Card className="mb-4 border-amber-300/60">
          <CardContent className="text-sm text-amber-700 dark:text-amber-300">
            Database belum aktif pada lingkungan ini, jadi manajemen akun bersifat baca-saja (menampilkan akun bawaan). Di server produksi (Render Postgres) fitur tambah/edit akun aktif penuh.
          </CardContent>
        </Card>
      )}

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Total Pengguna" value={users.length} icon={ShieldCheck} />
        <StatCard label="Aktif" value={activeCount} icon={Power} tone="primary" />
        <StatCard label="Admin Utama" value={admins} icon={ShieldCheck} tone="sky" />
      </section>

      <div className="mb-3 flex justify-end">
        <Button variant="secondary" onClick={load}><RefreshCw className="h-4 w-4" /> Muat ulang</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900/60">
            <tr>
              <th className="px-3 py-2 font-semibold">Nama</th>
              <th className="px-3 py-2 font-semibold">Username</th>
              <th className="px-3 py-2 font-semibold">Peran</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Terakhir Login</th>
              <th className="px-3 py-2 font-semibold">Dibuat</th>
              <th className="px-3 py-2 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted">Memuat…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted">Belum ada pengguna.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{u.name}</td>
                  <td className="px-3 py-2 text-muted">{u.username}</td>
                  <td className="px-3 py-2">
                    {db && !u.id.startsWith("builtin:") ? (
                      <Select value={u.role} onChange={(e) => changeRole(u, e.target.value as AppRole)} className="h-9 w-44">
                        {APP_ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                      </Select>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{ROLE_META[u.role].label}</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Badge className={u.active ? "bg-leaf/10 text-primary" : "bg-red-50 text-danger dark:bg-red-950/40"}>{u.active ? "Aktif" : "Nonaktif"}</Badge>
                  </td>
                  <td className="px-3 py-2 text-muted">{u.lastLogin ? formatDateTime(u.lastLogin) : "—"}</td>
                  <td className="px-3 py-2 text-muted">{formatDateTime(u.createdAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      {db && !u.id.startsWith("builtin:") ? (
                        <>
                          <Button variant="ghost" className="h-8 px-2" onClick={() => resetPassword(u)} title="Reset password"><KeyRound className="h-4 w-4" /></Button>
                          <Button variant="ghost" className="h-8 px-2" onClick={() => toggleActive(u)} title={u.active ? "Nonaktifkan" : "Aktifkan"}><Power className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted">bawaan</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Tambah Pengguna" description="Buat akun baru dengan peran dan password sementara.">
        <form onSubmit={createUser} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nama lengkap" /></Field>
          <Field label="Username"><Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="mis. budi" autoComplete="off" /></Field>
          <Field label="Password sementara"><Input type="text" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="min 6 karakter" autoComplete="off" /></Field>
          <Field label="Peran"><Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AppRole }))}>{APP_ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}</Select></Field>
          <div className="sm:col-span-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 accent-[var(--primary)]" /> Aktif</label>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setModal(false)}>Batal</Button>
              <Button type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Buat Akun"}</Button>
            </div>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";

export function PasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword.length < 6) return toast.error("Password baru minimal 6 karakter.");
    if (form.newPassword !== form.confirm) return toast.error("Konfirmasi password tidak cocok.");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: form.oldPassword, newPassword: form.newPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) return toast.error(json?.message ?? "Gagal mengganti password.");
      toast.success("Password berhasil diganti.");
      setForm({ oldPassword: "", newPassword: "", confirm: "" });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ganti Password" description="Perbarui password akun Anda.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Password lama"><Input type="password" value={form.oldPassword} onChange={(e) => setForm((f) => ({ ...f, oldPassword: e.target.value }))} autoComplete="current-password" /></Field>
        <Field label="Password baru" hint="Minimal 6 karakter."><Input type="password" value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} autoComplete="new-password" /></Field>
        <Field label="Konfirmasi password baru"><Input type="password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} autoComplete="new-password" /></Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </form>
    </Modal>
  );
}

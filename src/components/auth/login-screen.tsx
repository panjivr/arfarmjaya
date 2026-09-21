"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUiStore } from "@/lib/store";
import { ROLE_META, roleHome, canAccessPath, type AppRole } from "@/lib/rbac";

export function LoginScreen() {
  const setUser = useUiStore((state) => state.setUser);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || !json.user) {
        setError(json?.message ?? "Gagal masuk. Periksa username dan password.");
        return;
      }
      const role = json.user.role as AppRole;
      setUser({ id: json.user.id, name: json.user.name, username: json.user.username, role, label: ROLE_META[role]?.workspace ?? "" });
      const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      const dest = next && canAccessPath(role, next) ? next : roleHome(role);
      router.push(dest);
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1fr_480px]">
      <section className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(252,190,54,0.35),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(139,194,75,0.35),transparent_28%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white p-2">
              <Image src="/logo.png" alt="Logo AR FARM JAYA" width={52} height={52} className="object-contain" priority />
            </div>
            <div>
              <p className="text-xl font-bold">ARFARM BHINNEKA NUSA JAYA</p>
              <p className="text-sm text-white/75">Sistem Manajemen Operasional</p>
            </div>
          </div>
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="max-w-2xl text-5xl font-bold leading-tight">
              Satu sistem, banyak ruang kerja sesuai peran.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              Admin Utama mengelola seluruh perusahaan dan akun. Staff Lele, Gudang, dan Reporting masing-masing fokus pada ruang kerjanya. Akses dilindungi di sisi server.
            </p>
          </motion.div>
          <div className="grid grid-cols-4 gap-3 text-sm">
            {["Admin", "Lele", "Gudang", "Reporting"].map((item) => (
              <div key={item} className="rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-center backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
          </Link>
          <div className="mb-8 flex items-center gap-4 lg:hidden">
            <Image src="/logo.png" alt="Logo AR FARM JAYA" width={68} height={68} className="object-contain" priority />
            <div>
              <p className="text-lg font-bold">AR FARM JAYA</p>
              <p className="text-sm text-muted">Sistem Manajemen Operasional</p>
            </div>
          </div>
          <Card>
            <CardContent>
              <div className="mb-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-harvest text-white">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Masuk ke Sistem</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Masukkan username dan password akun Anda. Sistem akan membuka ruang kerja sesuai peran.
                </p>
              </div>

              <form className="space-y-4" onSubmit={submitLogin}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Username</span>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    autoFocus
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="mis. admin"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Masukkan password"
                  />
                </label>

                {error && (
                  <div className="rounded-lg border border-danger/20 bg-red-50 px-3 py-2 text-sm font-medium text-danger dark:bg-red-950/30">
                    {error}
                  </div>
                )}

                <Button className="w-full" type="submit" disabled={busy}>
                  {busy ? "Memverifikasi…" : "Masuk ke Sistem"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

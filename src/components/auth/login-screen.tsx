"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck, UserRoundCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Role, useUiStore } from "@/lib/store";

export function LoginScreen() {
  const login = useUiStore((state) => state.login);
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [role, setRole] = useState<Role>("admin");
  const [error, setError] = useState("");

  function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validAdmin = role === "admin" && username === "admin" && password === "admin123";
    const validStaff = role === "karyawan" && username === "karyawan" && password === "gudang123";

    if (!validAdmin && !validStaff) {
      setError("Username, password, atau role tidak sesuai.");
      return;
    }

    login(role);
    router.push(role === "admin" ? "/" : "/transactions");
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
              <p className="text-sm text-white/75">Sistem Manajemen Gudang</p>
            </div>
          </div>
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="max-w-2xl text-5xl font-bold leading-tight">
              Kontrol stok, barang keluar, pembelian, dan distribusi dalam satu sistem.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              Admin Utama memiliki akses penuh. Karyawan gudang hanya dapat mencatat barang keluar sesuai kebutuhan operasional.
            </p>
          </motion.div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {["RBAC", "Audit Log", "FIFO/FEFO"].map((item) => (
              <div key={item} className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-4 lg:hidden">
            <Image src="/logo.png" alt="Logo AR FARM JAYA" width={68} height={68} className="object-contain" priority />
            <div>
              <p className="text-lg font-bold">AR FARM JAYA</p>
              <p className="text-sm text-muted">Sistem Manajemen Gudang</p>
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
                  Pilih mode akses untuk masuk. Integrasi database dan Better Auth sudah disiapkan di struktur proyek.
                </p>
              </div>

              <form className="space-y-4" onSubmit={submitLogin}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Username</span>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="admin atau karyawan"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Masukkan password"
                  />
                </label>
                <div>
                  <span className="mb-2 block text-sm font-semibold">Hak Akses</span>
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRole("admin");
                        setUsername("admin");
                        setPassword("admin123");
                      }}
                      className={`rounded-lg border p-4 text-left transition ${
                        role === "admin" ? "border-primary bg-leaf/10" : "border-border hover:border-primary hover:bg-leaf/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">Admin Utama</p>
                          <p className="text-sm text-muted">Akses penuh ke seluruh menu dan laporan.</p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRole("karyawan");
                        setUsername("karyawan");
                        setPassword("gudang123");
                      }}
                      className={`rounded-lg border p-4 text-left transition ${
                        role === "karyawan" ? "border-primary bg-leaf/10" : "border-border hover:border-primary hover:bg-leaf/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-leaf text-white">
                          <UserRoundCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">Karyawan Gudang</p>
                          <p className="text-sm text-muted">Hanya mencatat barang keluar dari gudang.</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-danger/20 bg-red-50 px-3 py-2 text-sm font-medium text-danger">
                    {error}
                  </div>
                )}

                <div className="rounded-lg bg-slate-50 p-4 text-sm text-muted dark:bg-slate-900">
                  Demo login: `admin/admin123` untuk Admin Utama, `karyawan/gudang123` untuk Karyawan Gudang.
                </div>

                <Button className="w-full" type="submit">
                  Masuk ke Sistem
                </Button>
              </form>

            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

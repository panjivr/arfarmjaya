"use client";

import { useEffect } from "react";
import { useUiStore } from "@/lib/store";
import { ROLE_META, type AppRole } from "@/lib/rbac";

// Menyelaraskan pengguna aktif dengan cookie sesi server (sumber kebenaran).
// Cookie httpOnly diverifikasi server; di sini kita hanya membaca /api/auth/me.
export function AuthProvider() {
  const setUser = useUiStore((s) => s.setUser);
  useEffect(() => {
    let cancelled = false;
    // Jangan panggil endpoint terproteksi di halaman publik (belum ada sesi).
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    if (path === "/login" || path === "/") return;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 401) {
          setUser(null);
          return;
        }
        const json = await res.json().catch(() => null);
        if (json?.user) {
          const role = json.user.role as AppRole;
          setUser({ id: json.user.id, name: json.user.name, username: json.user.username, role, label: ROLE_META[role]?.workspace ?? "" });
        }
      } catch {
        /* offline — biarkan pengguna dari cache lokal */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUser]);
  return null;
}

import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  // `min-w-0` menjaga kartu tetap menyusut di dalam grid/flex, sehingga tabel
  // lebar di dalamnya bergulir sendiri alih-alih melebarkan halaman (penting di HP).
  return <div className={cn("min-w-0 rounded-2xl border border-border bg-card shadow-soft", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-border p-5", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

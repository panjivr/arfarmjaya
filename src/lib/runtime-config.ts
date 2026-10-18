export function productionConfigErrors(env: Record<string, string | undefined>): string[] {
  const errors: string[] = [];
  try {
    const url = new URL(env.DATABASE_URL || "");
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length <= 1) throw new Error("invalid");
  } catch { errors.push("DATABASE_URL harus menunjuk PostgreSQL persisten yang sudah disiapkan."); }
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) errors.push("AUTH_SECRET harus berisi minimal 32 karakter.");
  for (const name of ["ADMIN_PASSWORD", "LELE_PASSWORD", "GUDANG_PASSWORD", "LAPORAN_PASSWORD"]) {
    if (env[name] && env[name]!.length < 12) errors.push(`${name} harus berisi minimal 12 karakter bila dikonfigurasi.`);
  }
  return errors;
}

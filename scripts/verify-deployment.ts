import { APP_BUILD } from "../src/lib/build-info";

async function main() {
  const url = new URL(process.argv[2] || "");
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error("Berikan URL HTTPS aplikasi tanpa kredensial atau query string.");
  const response = await fetch(new URL("/api/health", url), { signal: AbortSignal.timeout(30_000), cache: "no-store" });
  const health = await response.json();
  if (!response.ok || health.status !== "ready" || health.build !== APP_BUILD) throw new Error("Deployment belum siap atau masih memakai build lama.");
  const login = await fetch(new URL("/login", url), { signal: AbortSignal.timeout(30_000), cache: "no-store" });
  const html = await login.text();
  if (!login.ok || !html.includes('type="password"')) throw new Error("Halaman login belum dapat digunakan.");
  console.log(`Deployment siap: ${APP_BUILD}. Konfigurasi, database, dan halaman login terverifikasi.`);
}
void main().catch((error) => { console.error(error instanceof Error ? error.message : "Verifikasi deployment gagal."); process.exitCode = 1; });

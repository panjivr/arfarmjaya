import { loadEnvConfig } from "@next/env";
import { productionConfigErrors } from "../src/lib/runtime-config";

loadEnvConfig(process.cwd(), false);
const errors = productionConfigErrors(process.env);
if (errors.length) {
  for (const message of errors) console.error(message);
  process.exitCode = 1;
} else {
  console.log("Konfigurasi production tersedia. Periksa /api/health setelah server berjalan untuk memverifikasi database.");
}

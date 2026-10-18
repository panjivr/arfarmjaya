import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productionConfigErrors } from "@/lib/runtime-config";
import { APP_BUILD } from "@/lib/build-info";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const configuration = productionConfigErrors(process.env).length === 0;
  let database = false;
  let accounts = false;
  if (prisma) {
    try {
      // Verify both required tables without reading or seeding company data.
      const [tables] = await prisma.$queryRaw<{ hasUsers: boolean }[]>`SELECT EXISTS(SELECT 1 FROM "Workspace" LIMIT 1), EXISTS(SELECT 1 FROM "AppUser" LIMIT 1) AS "hasUsers"`;
      database = true;
      accounts = tables.hasUsers || Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12);
    } catch { /* Readiness only: never expose connection strings or SQL errors. */ }
  }
  const ready = configuration && database && accounts;
  return NextResponse.json({ status: ready ? "ready" : "unavailable", build: APP_BUILD, checks: { configuration, database, accounts } }, {
    status: ready ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}

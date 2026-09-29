import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WORKSPACE_ID = "main";

// GET /api/backup -> unduh seluruh data server sebagai berkas JSON (butuh login).
// Ini "download semua database": isi dokumen Workspace apa adanya, agar bisa
// disimpan/di-import kembali kapan saja.
export async function GET() {
  if (!(await currentSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!prisma) {
    return NextResponse.json({ error: "no_database" }, { status: 503 });
  }
  try {
    const row = await prisma.workspace.findUnique({ where: { id: WORKSPACE_ID } });
    const data = row?.data ?? {};
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `arfarmjaya-server-backup-${stamp}.json`;
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/backup failed", error);
    return NextResponse.json({ error: "read_failed" }, { status: 500 });
  }
}

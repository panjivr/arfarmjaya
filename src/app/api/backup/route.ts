import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WORKSPACE_ID = "main";

// GET /api/backup -> unduh seluruh data server sebagai berkas JSON (butuh login).
// Ini "download semua database": isi dokumen Workspace apa adanya, agar bisa
// disimpan/di-import kembali kapan saja.
export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.role !== "ADMIN_UTAMA") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!prisma) {
    return NextResponse.json({ error: "no_database" }, { status: 503 });
  }
  try {
    const params = new URL(request.url).searchParams;
    if (params.get("versions") === "1") {
      const versions = await prisma.workspace.findMany({ where: { id: { startsWith: "backup:" } }, orderBy: { updatedAt: "desc" }, select: { id: true, updatedAt: true } });
      return NextResponse.json({ versions }, { headers: { "Cache-Control": "no-store" } });
    }
    const version = params.get("version");
    if (version && !/^backup:[a-f0-9-]{36}$/.test(version)) return NextResponse.json({ error: "invalid_version" }, { status: 400 });
    const row = await prisma.workspace.findUnique({ where: { id: version || WORKSPACE_ID } });
    if (!row) return NextResponse.json({ error: "no_backup_data" }, { status: 404 });
    const data = row.data;
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

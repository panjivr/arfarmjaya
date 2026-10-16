import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session-server";
import { readWorkspace } from "@/lib/workspace-server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN_UTAMA") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const { data } = await readWorkspace(session);
    return new NextResponse(JSON.stringify(data, null, 2), { headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="arfarmjaya-server-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    } });
  } catch (error) {
    console.error("Backup failed", error);
    return NextResponse.json({ error: "backup_unavailable" }, { status: 503 });
  }
}

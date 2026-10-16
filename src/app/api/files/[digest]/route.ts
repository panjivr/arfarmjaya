import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session-server";
import { prisma } from "@/lib/prisma";
import { readable } from "@/lib/workspace-protocol";
import { getImage } from "@/lib/object-storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ digest: string }> }) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { digest } = await params;
    if (!/^[a-f0-9]{64}$/.test(digest) || !prisma) return new NextResponse(null, { status: 404 });
    const refs = await prisma.workspaceAsset.findMany({ where: { digest, collection: { in: readable(session.role) } } });
    let authorized = false;
    for (const ref of refs) {
      const row = await prisma.workspaceRecord.findUnique({ where: { collection_recordId: { collection: ref.collection, recordId: ref.recordId } }, select: { deleted: true } });
      if (row && !row.deleted) { authorized = true; break; }
    }
    if (!authorized) return new NextResponse(null, { status: 404 });
    const { bytes, mime } = await getImage(digest);
    return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "attachment_unavailable" }, { status: 503 }); }
}

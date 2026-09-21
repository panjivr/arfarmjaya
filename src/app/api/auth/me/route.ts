import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await currentSession();
  if (!s) return NextResponse.json({ ok: false, user: null }, { status: 401 });
  return NextResponse.json({ ok: true, user: { id: s.uid, name: s.name, username: s.username, role: s.role } });
}

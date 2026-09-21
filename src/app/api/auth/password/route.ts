import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session-server";
import { changePassword } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const s = await currentSession();
  if (!s) return NextResponse.json({ ok: false, message: "Belum masuk." }, { status: 401 });
  let body: { oldPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }
  const res = await changePassword(s.uid, (body.oldPassword ?? "").toString(), (body.newPassword ?? "").toString());
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}

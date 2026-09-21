import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth-server";
import { signSession, sessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }
  const username = (body.username ?? "").toString();
  const password = (body.password ?? "").toString();
  if (!username || !password) return NextResponse.json({ ok: false, message: "Username dan password wajib diisi." }, { status: 400 });

  const result = await authenticate(username, password);
  if (!result.ok || !result.user) return NextResponse.json({ ok: false, message: result.message ?? "Gagal masuk." }, { status: 401 });

  const u = result.user;
  const { token, maxAge } = await signSession({ uid: u.id, username: u.username, name: u.name, role: u.role });
  const res = NextResponse.json({ ok: true, user: { id: u.id, name: u.name, username: u.username, role: u.role } });
  res.cookies.set(sessionCookie(token, maxAge));
  return res;
}

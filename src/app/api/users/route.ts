import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session-server";
import { listUsers, createUser } from "@/lib/auth-server";
import { isAppRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const s = await currentSession();
  if (!s) return { err: NextResponse.json({ ok: false, message: "Belum masuk." }, { status: 401 }) };
  if (s.role !== "ADMIN_UTAMA") return { err: NextResponse.json({ ok: false, message: "Akses ditolak." }, { status: 403 }) };
  return { s };
}

export async function GET() {
  const { err } = await requireAdmin();
  if (err) return err;
  const result = await listUsers();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { err } = await requireAdmin();
  if (err) return err;
  let body: { name?: string; username?: string; password?: string; role?: string; active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }
  if (!isAppRole(body.role)) return NextResponse.json({ ok: false, message: "Peran tidak valid." }, { status: 400 });
  const res = await createUser({ name: (body.name ?? "").toString(), username: (body.username ?? "").toString(), password: (body.password ?? "").toString(), role: body.role, active: body.active });
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}

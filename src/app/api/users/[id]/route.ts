import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session-server";
import { updateUser } from "@/lib/auth-server";
import { isAppRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await currentSession();
  if (!s) return NextResponse.json({ ok: false, message: "Belum masuk." }, { status: 401 });
  if (s.role !== "ADMIN_UTAMA") return NextResponse.json({ ok: false, message: "Akses ditolak." }, { status: 403 });
  const { id } = await params;
  let body: { name?: string; role?: string; active?: boolean; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }
  const patch: { name?: string; role?: import("@/lib/rbac").AppRole; active?: boolean; password?: string } = {};
  if (body.name != null) patch.name = body.name;
  if (body.role != null) {
    if (!isAppRole(body.role)) return NextResponse.json({ ok: false, message: "Peran tidak valid." }, { status: 400 });
    patch.role = body.role;
  }
  if (body.active != null) patch.active = body.active;
  if (body.password) patch.password = body.password;
  const res = await updateUser(id, patch);
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}

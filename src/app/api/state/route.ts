import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WORKSPACE_ID = "main";

// GET /api/state -> shared workspace data (or null if none yet / no DB)
export async function GET() {
  // Tanpa sesi → jangan bocorkan data (kembalikan null), tetap 200 agar health
  // check tetap sehat. Data nyata hanya diberikan untuk pengguna yang login.
  if (!(await currentSession())) return NextResponse.json({ data: null, auth: false });
  if (!prisma) return NextResponse.json({ data: null, db: false });
  try {
    const row = await prisma.workspace.findUnique({ where: { id: WORKSPACE_ID } });
    return NextResponse.json({ data: row?.data ?? null, db: true, updatedAt: row?.updatedAt ?? null });
  } catch (error) {
    console.error("GET /api/state failed", error);
    return NextResponse.json({ data: null, db: false, error: "read_failed" }, { status: 200 });
  }
}

// PUT /api/state -> replace shared workspace data
export async function PUT(request: Request) {
  if (!(await currentSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!prisma) return NextResponse.json({ ok: false, db: false });
  try {
    const body = await request.json();
    const data = body as Prisma.InputJsonValue;
    const row = await prisma.workspace.upsert({
      where: { id: WORKSPACE_ID },
      update: { data },
      create: { id: WORKSPACE_ID, data },
    });
    return NextResponse.json({ ok: true, db: true, updatedAt: row.updatedAt });
  } catch (error) {
    console.error("PUT /api/state failed", error);
    return NextResponse.json({ ok: false, db: false, error: "write_failed" }, { status: 200 });
  }
}

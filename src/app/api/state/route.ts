import { NextResponse } from "next/server";
import { gunzipSync } from "node:zlib";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WORKSPACE_ID = "main";
const CHUNK_PREFIX = "upload:";

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

/** Tulis dokumen Workspace "main" dari buffer (gunzip bila perlu) lalu balas. */
async function writeMain(buf: Buffer, gzip: boolean) {
  const raw = gzip ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
  const data = JSON.parse(raw) as Prisma.InputJsonValue;
  const row = await prisma!.workspace.upsert({
    where: { id: WORKSPACE_ID },
    update: { data },
    create: { id: WORKSPACE_ID, data },
  });
  return row.updatedAt;
}

// PUT /api/state -> replace shared workspace data.
// Mendukung dua mode agar TANPA batas ukuran:
//  - sekali kirim: body = JSON / gzip (untuk data kecil),
//  - bertahap (chunk): header x-upload-id/x-chunk-index/x-chunk-total; tiap
//    potongan kecil (di bawah batas request server), disusun ulang di server.
export async function PUT(request: Request) {
  if (!(await currentSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!prisma) return NextResponse.json({ ok: false, db: false });
  const gzip = request.headers.get("x-encoding") === "gzip";
  const uploadId = request.headers.get("x-upload-id");
  try {
    const buf = Buffer.from(await request.arrayBuffer());

    // Mode sekali kirim (data kecil).
    if (!uploadId) {
      const updatedAt = await writeMain(buf, gzip);
      return NextResponse.json({ ok: true, db: true, updatedAt });
    }

    // Mode bertahap (chunk).
    const index = Number(request.headers.get("x-chunk-index") ?? "0");
    const total = Number(request.headers.get("x-chunk-total") ?? "1");
    const safeId = uploadId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);

    // Bersihkan sisa unggahan lama (>1 jam) saat potongan pertama.
    if (index === 0) {
      const cutoff = new Date(Date.now() - 60 * 60 * 1000);
      await prisma.workspace.deleteMany({ where: { id: { startsWith: CHUNK_PREFIX }, updatedAt: { lt: cutoff } } });
    }

    const chunkId = `${CHUNK_PREFIX}${safeId}:${String(index).padStart(5, "0")}`;
    const payload: Prisma.InputJsonValue = { b64: buf.toString("base64") };
    await prisma.workspace.upsert({ where: { id: chunkId }, update: { data: payload }, create: { id: chunkId, data: payload } });

    if (index + 1 < total) return NextResponse.json({ ok: true, partial: true });

    // Potongan terakhir → susun ulang berurutan, tulis "main", bersihkan.
    const rows = await prisma.workspace.findMany({ where: { id: { startsWith: `${CHUNK_PREFIX}${safeId}:` } } });
    const ordered = rows
      .map((r) => ({ i: Number(r.id.split(":")[2]), b: Buffer.from(((r.data as { b64?: string })?.b64) ?? "", "base64") }))
      .sort((a, b) => a.i - b.i);
    const full = Buffer.concat(ordered.map((o) => o.b));
    const updatedAt = await writeMain(full, gzip);
    await prisma.workspace.deleteMany({ where: { id: { startsWith: `${CHUNK_PREFIX}${safeId}:` } } });
    return NextResponse.json({ ok: true, db: true, updatedAt });
  } catch (error) {
    console.error("PUT /api/state failed", error);
    return NextResponse.json({ ok: false, db: false, error: "write_failed" }, { status: 200 });
  }
}

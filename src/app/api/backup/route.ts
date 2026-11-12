import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseWorkspace } from "@/lib/workspace-data";
import { currentSession } from "@/lib/session-server";
import { uploadParameters, assembleUpload, decodeWorkspace, MAX_WORKSPACE_BYTES, MAX_CHUNK_BYTES } from "@/lib/workspace-upload";
import { WorkspaceError } from "@/lib/workspace-write";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const WORKSPACE_ID = "main";
const RECOVERY_PREFIX = "recovery:";
const RECOVERY_KEEP = 10;

// GET /api/backup -> unduh seluruh data server sebagai berkas JSON (butuh login).
// Ekspor hanya koleksi aktif agar modul yang dihentikan tidak masuk lagi
// melalui pemulihan cadangan. Snapshot historis di database tetap terpisah.
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
    if (params.get("recoveries") === "1") {
      const recoveries = await prisma.workspace.findMany({ where: { id: { startsWith: RECOVERY_PREFIX } }, orderBy: { updatedAt: "desc" }, select: { id: true, updatedAt: true } });
      return NextResponse.json({ recoveries }, { headers: { "Cache-Control": "no-store" } });
    }
    const version = params.get("version");
    if (version && !/^(backup|recovery):[a-f0-9-]{36}$/.test(version)) return NextResponse.json({ error: "invalid_version" }, { status: 400 });
    const row = await prisma.workspace.findUnique({ where: { id: version || WORKSPACE_ID } });
    if (!row) return NextResponse.json({ error: "no_backup_data" }, { status: 404 });
    const data = parseWorkspace(row.data);
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

// POST /api/backup -> simpan snapshot perangkat sebagai salinan pemulihan di
// server (baris "recovery:<uuid>", terpisah dari data utama dan dari versi
// pengaman "backup:"). Dipakai pemulihan konflik otomatis: data perangkat
// yang berbeda dengan server tidak hilang dan tidak perlu diunduh manual —
// salinannya tersimpan di database dan dapat diunduh admin lewat GET.
// Data utama TIDAK pernah diubah oleh endpoint ini. Semua akun yang masuk
// boleh menyimpan salinan pemulihan dari perangkatnya sendiri.
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!prisma) return NextResponse.json({ ok: false, error: "no_database", db: false }, { status: 503 });
  const encoding = request.headers.get("x-encoding");
  if (encoding && encoding !== "gzip") return NextResponse.json({ ok: false, error: "invalid_encoding" }, { status: 400 });
  const gzip = encoding === "gzip";
  const uploadId = request.headers.get("x-upload-id");
  try {
    const reader = request.body?.getReader();
    const buffers: Buffer[] = [];
    let size = 0;
    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > (uploadId ? MAX_CHUNK_BYTES : MAX_WORKSPACE_BYTES)) {
          await reader.cancel();
          throw new WorkspaceError(413, "payload_too_large");
        }
        buffers.push(Buffer.from(value));
      }
    }
    let buf = Buffer.concat(buffers);
    let chunkPrefix: string | undefined;
    if (uploadId !== null) {
      const { index, total, prefix } = uploadParameters(request.headers, session.uid);
      chunkPrefix = prefix;
      if (index === 0) await prisma.workspace.deleteMany({ where: { id: { startsWith: "upload:" }, updatedAt: { lt: new Date(Date.now() - 3_600_000) } } });
      const id = `${chunkPrefix}${String(index).padStart(5, "0")}`;
      const payload = { b64: buf.toString("base64"), total, gzip, expected: "recovery" };
      await prisma.workspace.upsert({ where: { id }, update: { data: payload }, create: { id, data: payload } });
      if (index !== total - 1) return NextResponse.json({ ok: true, partial: true });
      const rows = await prisma.workspace.findMany({ where: { id: { startsWith: chunkPrefix } }, orderBy: { id: "asc" } });
      buf = assembleUpload(rows, chunkPrefix, total, gzip, "recovery");
    }
    const data = decodeWorkspace(buf, gzip);
    const id = `${RECOVERY_PREFIX}${randomUUID()}`;
    const row = await prisma.workspace.create({ data: { id, data: data as Prisma.InputJsonValue } });
    if (chunkPrefix) await prisma.workspace.deleteMany({ where: { id: { startsWith: chunkPrefix } } }).catch(() => {});
    // Simpan hanya salinan pemulihan terbaru; sisanya dibersihkan best-effort.
    const stale = await prisma.workspace.findMany({ where: { id: { startsWith: RECOVERY_PREFIX } }, orderBy: { updatedAt: "desc" }, skip: RECOVERY_KEEP, select: { id: true } });
    if (stale.length) await prisma.workspace.deleteMany({ where: { id: { in: stale.map((r: { id: string }) => r.id) } } }).catch(() => {});
    return NextResponse.json({ ok: true, id, updatedAt: row.updatedAt });
  } catch (error) {
    if (error instanceof WorkspaceError) return NextResponse.json({ ok: false, error: error.code }, { status: error.status });
    console.error("POST /api/backup failed", error);
    return NextResponse.json({ ok: false, error: "write_failed" }, { status: 503 });
  }
}

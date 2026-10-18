import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session-server";
import { uploadParameters, assembleUpload, decodeWorkspace, MAX_WORKSPACE_BYTES, MAX_CHUNK_BYTES } from "@/lib/workspace-upload";
import { WorkspaceError, workspaceRevision } from "@/lib/workspace-write";

import { savePrismaWorkspace } from "@/lib/workspace-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  if (!(await currentSession())) return json({ error: "unauthorized" }, 401);
  if (!prisma) return json({ error: "no_database", db: false }, 503);
  try {
    const row = await prisma.workspace.findUnique({ where: { id: "main" } });
    return json({ data: row?.data ?? null, db: true, updatedAt: row?.updatedAt ?? null, revision: workspaceRevision(row) });
  } catch (error) {
    console.error("GET /api/state failed", error);
    return json({ error: "read_failed" }, 503);
  }
}

export async function PUT(request: Request) {
  const session = await currentSession();
  if (!session) return json({ ok: false, error: "unauthorized" }, 401);
  if (!prisma) return json({ ok: false, error: "no_database", db: false }, 503);
  const expected = request.headers.get("x-base-revision");
  if (!expected || !/^(empty|[a-f0-9]{64})$/.test(expected)) return json({ ok: false, error: "revision_required" }, 428);
  const encoding = request.headers.get("x-encoding");
  if (encoding && encoding !== "gzip") return json({ ok: false, error: "invalid_encoding" }, 400);
  const gzip = encoding === "gzip";
  const uploadId = request.headers.get("x-upload-id");
  try {
    // Bound both compressed input and decompressed output, including chunks.
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
      const payload = { b64: buf.toString("base64"), total, gzip, expected };
      await prisma.workspace.upsert({ where: { id }, update: { data: payload }, create: { id, data: payload } });
      if (index !== total - 1) return json({ ok: true, partial: true });
      const rows = await prisma.workspace.findMany({ where: { id: { startsWith: chunkPrefix } }, orderBy: { id: "asc" } });
      buf = assembleUpload(rows, chunkPrefix, total, gzip, expected);
    }
    const data = decodeWorkspace(buf, gzip);
    const row = await savePrismaWorkspace(prisma, data, expected, session.role);
    // Chunk cleanup is best effort AFTER commit; never report an accepted write
    // as failed simply because temporary upload cleanup failed.
    if (chunkPrefix) await prisma.workspace.deleteMany({ where: { id: { startsWith: chunkPrefix } } }).catch(() => {});
    return json({ ok: true, db: true, updatedAt: row.updatedAt, revision: workspaceRevision(row) });
  } catch (error) {
    if (error instanceof WorkspaceError) return json({ ok: false, error: error.code }, error.status);
    console.error("PUT /api/state failed", error);
    return json({ ok: false, error: "write_failed" }, 503);
  }
}

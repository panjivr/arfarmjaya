import { gunzipSync } from "node:zlib";
import { parseWorkspace } from "./workspace-data";
import { WorkspaceError } from "./workspace-write";

export const MAX_WORKSPACE_BYTES = 64 * 1024 * 1024;
export const MAX_CHUNK_BYTES = 3_500_000;

export function uploadParameters(headers: Headers, owner: string) {
  const uploadId = headers.get("x-upload-id") ?? "";
  const indexText = headers.get("x-chunk-index") ?? "";
  const totalText = headers.get("x-chunk-total") ?? "";
  const index = Number(indexText), total = Number(totalText);
  if (!/^[a-zA-Z0-9_-]{16,64}$/.test(uploadId) || !/^\d+$/.test(indexText) || !/^\d+$/.test(totalText) ||
      !Number.isSafeInteger(index) || !Number.isSafeInteger(total) || total < 1 || total > 20 || index < 0 || index >= total) {
    throw new WorkspaceError(400, "invalid_chunks");
  }
  return { index, total, prefix: `upload:${encodeURIComponent(owner)}:${uploadId}:` };
}

export function assembleUpload(rows: { id: string; data: unknown }[], prefix: string, total: number, gzip: boolean, expected: string) {
  if (rows.length !== total) throw new WorkspaceError(400, "incomplete_upload");
  const chunks = rows.map((row, i) => {
    const part = row.data as Record<string, unknown> | null;
    if (row.id !== `${prefix}${String(i).padStart(5, "0")}` || !part || part.total !== total || part.gzip !== gzip || part.expected !== expected || typeof part.b64 !== "string") {
      throw new WorkspaceError(400, "inconsistent_upload");
    }
    return Buffer.from(part.b64, "base64");
  });
  if (chunks.reduce((n, part) => n + part.length, 0) > MAX_WORKSPACE_BYTES) throw new WorkspaceError(413, "payload_too_large");
  return Buffer.concat(chunks);
}

export function decodeWorkspace(buf: Buffer, gzip: boolean) {
  try {
    if (buf.length > MAX_WORKSPACE_BYTES) throw new Error("too_large");
    const decoded = gzip ? gunzipSync(buf, { maxOutputLength: MAX_WORKSPACE_BYTES }) : buf;
    return parseWorkspace(JSON.parse(decoded.toString("utf8")), true);
  } catch {
    throw new WorkspaceError(400, "invalid_workspace");
  }
}

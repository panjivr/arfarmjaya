import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session-server";
import { batchSchema } from "@/lib/workspace-protocol";
import { applyBatch, readWorkspace, WorkspaceError } from "@/lib/workspace-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
function failure(error: unknown) {
  if (error instanceof WorkspaceError) return NextResponse.json({ ok: false, error: error.code }, { status: error.status, headers });
  console.error("Workspace request failed", error);
  return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503, headers });
}
export async function GET() {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers });
    return NextResponse.json(await readWorkspace(session), { headers });
  } catch (error) { return failure(error); }
}
export async function PATCH(request: Request) {
  try {
    // Same-origin only. A missing Origin is allowed for authenticated API clients.
    const origin = request.headers.get("origin");
    // Next may construct request.url with an internal hostname behind a proxy.
    // Match the public Host and proxy protocol used by the incoming request.
    const host = request.headers.get("host") ?? new URL(request.url).host;
    const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? new URL(request.url).protocol.slice(0, -1);
    if (origin && origin !== `${protocol}://${host}`) return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403, headers });
    const session = await currentSession();
    if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers });
    if (Number(request.headers.get("content-length")) > 3_500_000) return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413, headers });
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 3_500_000) return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413, headers });
    let input;
    try { input = batchSchema.parse(JSON.parse(raw)); } catch { return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400, headers }); }
    return NextResponse.json(await applyBatch(session, input.requestId, input.operations), { headers });
  } catch (error) { return failure(error); }
}
// Never accept full snapshots from old tabs/service workers after migration.
export async function PUT() {
  return NextResponse.json({ ok: false, error: "client_upgrade_required", message: "Muat ulang aplikasi. Penyimpanan versi lama dinonaktifkan untuk melindungi data." }, { status: 409, headers });
}

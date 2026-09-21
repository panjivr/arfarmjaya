import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { canAccessPath, roleHome } from "@/lib/rbac";

// Halaman publik (tanpa login).
const PUBLIC_PAGES = new Set(["/", "/login"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PAGES.has(pathname)) return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  // Belum login → arahkan ke halaman masuk.
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Login tapi peran tak berhak pada rute ini → arahkan ke beranda perannya.
  if (!canAccessPath(session.role, pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = roleHome(session.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Lindungi semua halaman aplikasi; lewati API (self-guard), aset statis, dan
// berkas ber-ekstensi (mengandung titik).
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};

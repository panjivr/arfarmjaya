// ── Sesi login (cookie httpOnly bertanda-tangan) ───────────────────────────
// Stateless: payload + HMAC-SHA256 (Web Crypto) sehingga berjalan di middleware
// (Edge) maupun route handler (Node). Tidak butuh tabel sesi.
import type { AppRole } from "@/lib/rbac";
import { isAppRole } from "@/lib/rbac";

export const SESSION_COOKIE = "arfj_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 hari

export type SessionPayload = {
  uid: string;
  username: string;
  name: string;
  role: AppRole;
  exp: number; // epoch detik
};

function secret(): string {
  return process.env.AUTH_SECRET || "arfarmjaya-dev-secret-change-me";
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64urlEncode(new Uint8Array(sig));
}

export async function signSession(input: Omit<SessionPayload, "exp">): Promise<{ token: string; maxAge: number }> {
  const payload: SessionPayload = { ...input, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC };
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(body);
  return { token: `${body}.${sig}`, maxAge: MAX_AGE_SEC };
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmac(body);
  // perbandingan panjang tetap sederhana; token bukan rahasia timing-kritis tinggi
  if (expected.length !== sig.length || expected !== sig) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as SessionPayload;
    if (!payload || !isAppRole(payload.role)) return null;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string, maxAge: number) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
export function clearedCookie() {
  return { name: SESSION_COOKIE, value: "", httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 };
}

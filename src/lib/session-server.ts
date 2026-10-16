import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isAppRole } from "@/lib/rbac";

// Every protected API rechecks the live account, not just a 30-day cookie.
export async function currentSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  if (!prisma) return process.env.NODE_ENV === "production" ? null : session;
  const user = await prisma.appUser.findUnique({ where: { id: session.uid } });
  if (!user || !user.active || !isAppRole(user.role) || user.sessionVersion !== (session.sessionVersion ?? 0)) return null;
  return { ...session, role: user.role, name: user.name, username: user.username };
}

import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth-server";
import { COLLECTIONS } from "../src/lib/workspace-protocol";
import { useUiStore } from "../src/lib/store";

async function main() {
  assert(prisma && new URL(process.env.DATABASE_URL!).hostname === "127.0.0.1");
  const db = prisma!;
  const state = useUiStore.getState();
  await db.workspace.create({ data: { id: "main", data: JSON.parse(JSON.stringify(Object.fromEntries(COLLECTIONS.map(k => [k, state[k]])))) } });
  const passwordHash = await hashPassword("isolated-test-password");
  await db.appUser.createMany({ data: [
    { id: "http-admin", username: "testadmin", name: "Test admin", role: "ADMIN_UTAMA", passwordHash },
    { id: "http-staff", username: "teststaff", name: "Test staff", role: "STAFF_LELE", passwordHash },
  ] });
  let logs = "";
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3007", "--hostname", "127.0.0.1"], { env: { ...process.env, NODE_ENV: "production" }, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", data => { logs += data; }); child.stderr.on("data", data => { logs += data; });
  const origin = "http://127.0.0.1:3007";
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(origin)).ok) { ready = true; break; } } catch { /* booting */ }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(ready, "App failed to start");
    assert.equal((await fetch(`${origin}/api/state`)).status, 401);
    const login = async (username: string) => {
      const res = await fetch(`${origin}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password: "isolated-test-password" }) });
      assert.equal(res.status, 200);
      return res.headers.get("set-cookie")!.split(";")[0];
    };
    const adminCookie = await login("testadmin"), staffCookie = await login("teststaff");
    const adminHeaders = { Cookie: adminCookie }, staffHeaders = { Cookie: staffCookie };
    const adminData = await (await fetch(`${origin}/api/state`, { headers: adminHeaders })).json();
    assert.equal(adminData.protocol, 2);
    assert.equal(adminData.data.products.length, state.products.length);
    const staffData = await (await fetch(`${origin}/api/state`, { headers: staffHeaders })).json();
    assert(!("products" in staffData.data));
    assert.equal((await fetch(`${origin}/api/backup`, { headers: staffHeaders })).status, 403);
    assert.equal((await fetch(`${origin}/api/backup`, { headers: adminHeaders })).status, 200);
    assert.equal((await fetch(`${origin}/api/state`, { method: "PUT", headers: adminHeaders, body: "{}" })).status, 409);
    const pond = adminData.data.ponds[0], requestId = crypto.randomUUID();
    const patch = { requestId, operations: [{ collection: "ponds", id: pond.id, expectedVersion: 1, data: { ...pond, name: "HTTP save" } }] };
    const save = () => fetch(`${origin}/api/state`, { method: "PATCH", headers: { ...staffHeaders, "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(patch) });
    { const response = await save(); assert.equal(response.status, 200, await response.text()); }
    assert.equal((await save()).status, 200);
    assert.equal(await db.workspaceChange.count({ where: { id: requestId } }), 1);
    const fresh = await (await fetch(`${origin}/api/state`, { headers: adminHeaders })).json();
    assert.equal(fresh.data.ponds.find((p: { id: string }) => p.id === pond.id).name, "HTTP save");
    assert.equal((await fetch(`${origin}/api/state`, { method: "PATCH", headers: { ...staffHeaders, Origin: "https://unrelated.example" }, body: JSON.stringify(patch) })).status, 403);
    await db.appUser.update({ where: { id: "http-staff" }, data: { active: false } });
    assert.equal((await fetch(`${origin}/api/auth/me`, { headers: staffHeaders })).status, 401);
    assert.equal((await fetch(`${origin}/api/state`, { headers: staffHeaders })).status, 401);
    await db.appUser.update({ where: { id: "http-admin" }, data: { sessionVersion: { increment: 1 } } });
    assert.equal((await fetch(`${origin}/api/auth/me`, { headers: adminHeaders })).status, 401);
    console.log("HTTP checks passed: auth, private data, backup permissions, legacy write rejection, save/retry/reload, origin protection and session revocation.");
  } catch (error) { console.error(logs); throw error; }
  finally { child.kill("SIGTERM"); await new Promise(resolve => child.once("exit", resolve)); await db.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

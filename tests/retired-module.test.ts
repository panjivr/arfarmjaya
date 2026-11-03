import { test } from "node:test";
import assert from "node:assert/strict";
import { navigation } from "../src/lib/data";
import { isAppRole, canAccessPath, roleHome } from "../src/lib/rbac";
import { useUiStore } from "../src/lib/store";
import { parseWorkspace } from "../src/lib/workspace-data";

test("removed module has no navigation, active role, state or backup entry", () => {
  assert.equal(navigation.some((n) => n.href.startsWith("/lele")), false);
  assert.equal(isAppRole("STAFF_LELE"), false);
  assert.equal(canAccessPath("STAFF_REPORTING", "/lele"), false);
  assert.equal(roleHome("STAFF_GUDANG"), "/gudang");
  const state = useUiStore.getState();
  const exported = JSON.parse(state.exportBackup());
  for (const key of ["ponds", "fishCycles", "leleSales", "addPond", "transferLele"]) {
    assert.equal(key in state, false);
    assert.equal(key in exported, false);
  }
  const stored = { ...exported, ponds: [{ id: "legacy" }], theme: "dark", user: null, loginNoticeSeen: true };
  const merge = useUiStore.persist.getOptions().merge!;
  const restored = merge(stored, state);
  assert.equal("ponds" in restored, false);
  assert.equal(restored.theme, "dark");
  assert.deepEqual(parseWorkspace(JSON.parse(JSON.stringify(restored))), parseWorkspace(exported));
});

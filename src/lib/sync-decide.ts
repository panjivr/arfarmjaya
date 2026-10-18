export type SyncDecision = "push-local" | "adopt-server" | "conflict";
export type SyncInputs = {
  localStr: string;
  baseline: string;
  hasServerData: boolean;
  serverUpdatedAt: string | null;
  serverStr?: string;
  metaSyncedAt?: string;
  metaSig?: string;
  /** The acknowledged server snapshot could not be persisted on this device. */
  metaCacheFailed?: boolean;
  localSig: string;
};

export function decideSync(i: SyncInputs): SyncDecision {
  const editedDuringLoad = i.localStr !== i.baseline;
  const dirty = editedDuringLoad || Boolean(i.metaSig && i.localSig !== i.metaSig);
  // A previously populated server disappearing may mean the wrong database or
  // an outage/reset. Never silently seed it from a potentially stale device.
  if (!i.hasServerData) return i.metaSyncedAt ? "conflict" : "push-local";
  // A lost response or another tab may already have saved exactly this data.
  // Matching validated snapshots need no manual conflict reconciliation.
  if (i.serverStr === i.localStr) return "adopt-server";
  // An older durable cache is not an offline edit. Never upload it over the
  // newer acknowledged server snapshot after a quota failure and reload.
  if (i.metaCacheFailed && dirty) return "conflict";
  const unchanged = Boolean(i.serverUpdatedAt) && i.serverUpdatedAt === i.metaSyncedAt;
  if (dirty) return unchanged ? "push-local" : "conflict";
  // Record counts are not versions. Deleting records is also a legitimate edit.
  return "adopt-server";
}

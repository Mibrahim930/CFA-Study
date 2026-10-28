"use client";

// The one place that writes "l1:" keys to localStorage. Every store goes through persistSet so that a
// change is (a) announced to the rest of the app and (b) remembered as "dirty" for the account sync.
// Bookkeeping lives under "l1:meta:" and is per device: never synced, never backed up.

import { LOCAL_ONLY_PREFIX, SYNC_PREFIX, syncableKey } from "@/lib/sync-keys";

export const DIRTY_KEY = "l1:meta:dirty";
export const STAMPS_KEY = "l1:meta:stamps";
/** Fired (with `detail.key`) after any local write that should reach the account. */
export const CHANGE_EVENT = "l1-change";

export { LOCAL_ONLY_PREFIX, SYNC_PREFIX, syncableKey };

function readMap(metaKey: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(metaKey);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeMap(metaKey: string, map: Record<string, number>) {
  try {
    if (Object.keys(map).length) localStorage.setItem(metaKey, JSON.stringify(map));
    else localStorage.removeItem(metaKey);
  } catch {
    // storage unavailable: the sync will simply re-send next time
  }
}

/** Keys changed on this device since they were last agreed with the account, with the change time. */
export const readDirty = () => readMap(DIRTY_KEY);
/** The account's change time for each key as last seen by this device. */
export const readStamps = () => readMap(STAMPS_KEY);

export function markDirty(key: string, at = Date.now()) {
  if (!syncableKey(key)) return;
  const dirty = readDirty();
  dirty[key] = Math.max(at, dirty[key] ?? 0);
  writeMap(DIRTY_KEY, dirty);
}

/** The account accepted these keys at these change times. */
export function markClean(stamps: Record<string, number>) {
  const dirty = readDirty();
  const all = readStamps();
  for (const [key, at] of Object.entries(stamps)) {
    if (dirty[key] !== undefined && dirty[key] <= at) delete dirty[key];
    all[key] = at;
  }
  writeMap(DIRTY_KEY, dirty);
  writeMap(STAMPS_KEY, all);
}

export function clearSyncMeta() {
  writeMap(DIRTY_KEY, {});
  writeMap(STAMPS_KEY, {});
}

/** Write (or remove, with null) a key on this device. Returns false when the browser refused the write. */
export function persistSet(key: string, raw: string | null): boolean {
  let ok = true;
  try {
    if (raw === null) localStorage.removeItem(key);
    else localStorage.setItem(key, raw);
  } catch {
    ok = false;
  }
  if (ok) markDirty(key);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
  return ok;
}

/** Everything on this device that belongs to the account (raw values by key). */
export function localEntries(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && syncableKey(k)) out[k] = localStorage.getItem(k) ?? "";
    }
  } catch {
    // storage unavailable
  }
  return out;
}

/** Take a value from the account without marking it dirty. */
export function applyRemote(key: string, value: string | null, updatedAt: number) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    return;
  }
  const dirty = readDirty();
  delete dirty[key];
  writeMap(DIRTY_KEY, dirty);
  const stamps = readStamps();
  stamps[key] = updatedAt;
  writeMap(STAMPS_KEY, stamps);
}

/** Remove every synced key from this device (the account keeps them). */
export function wipeLocal() {
  for (const k of Object.keys(localEntries())) {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }
  clearSyncMeta();
}

/**
 * Every store re-reads storage on its next read and listens to the "storage" event, so a synthetic one
 * makes mounted views pick up values written by the sync (or a restore) in this tab.
 */
export function notifyStores(keys: string[]) {
  for (const key of keys) window.dispatchEvent(new StorageEvent("storage", { key }));
  for (const e of ["l1-store-change", "l1-review-change", "l1-mock-change", "l1-settings-change", "l1-activity-change", "l1-practice-change", "l1-backup-change"]) {
    window.dispatchEvent(new Event(e));
  }
}

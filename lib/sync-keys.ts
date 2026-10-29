// Which localStorage keys belong to an account. Shared by the browser stores and the sync API.

export const SYNC_PREFIX = "l1:";
/** Sync bookkeeping and backup timestamps are per device and never synced or backed up. */
export const LOCAL_ONLY_PREFIX = "l1:meta:";

export interface Entry {
  key: string;
  /** null = the key was removed. */
  value: string | null;
  /** The client's change time, ms since epoch; last write wins. */
  updatedAt: number;
}

export function syncableKey(key: string): boolean {
  return key.startsWith(SYNC_PREFIX) && !key.startsWith(LOCAL_ONLY_PREFIX) && key.length <= 200;
}

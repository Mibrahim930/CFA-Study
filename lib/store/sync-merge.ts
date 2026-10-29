import type { Entry } from "@/lib/sync-keys";

// Pure merge decisions for the account sync, kept out of the browser code so they can be tested.

/**
 * Which pulled entries this device should take. A key the device changed after the account's version
 * keeps the local value (it will be pushed); everything the account has newer than what this device
 * last saw is applied.
 */
export function planPull(entries: Entry[], dirty: Record<string, number>, stamps: Record<string, number>): { apply: Entry[]; keepLocal: string[] } {
  const apply: Entry[] = [];
  const keepLocal: string[] = [];
  for (const e of entries) {
    const seen = stamps[e.key] ?? -1;
    if (e.updatedAt <= seen) continue;
    const localChange = dirty[e.key];
    if (localChange !== undefined && localChange > e.updatedAt) keepLocal.push(e.key);
    else apply.push(e);
  }
  return { apply, keepLocal };
}

/** The entries to push: every dirty key with its current local value (null when it was removed). */
export function planPush(dirty: Record<string, number>, local: Record<string, string>): Entry[] {
  return Object.entries(dirty).map(([key, updatedAt]) => ({ key, value: local[key] ?? null, updatedAt }));
}

/**
 * After a push: keys the account accepted are clean at their change time; for keys it refused, the
 * account's newer value replaces the local one.
 */
export function planPushResult(sent: Entry[], accepted: string[], current: Entry[]): { clean: Record<string, number>; apply: Entry[] } {
  const ok = new Set(accepted);
  const clean: Record<string, number> = {};
  for (const e of sent) if (ok.has(e.key)) clean[e.key] = e.updatedAt;
  const apply = current.filter((e) => !ok.has(e.key));
  return { clean, apply };
}

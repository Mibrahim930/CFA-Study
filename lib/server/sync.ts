import { syncableKey, type Entry } from "@/lib/sync-keys";
import type { Db } from "./db";

/**
 * Progress sync: the browser's "l1:" localStorage entries, one row per key, last write wins by the
 * client's change time (ms since epoch). Removing a key stores a tombstone (NULL value) so the removal
 * reaches other devices too.
 */

export type { Entry };
export const MAX_VALUE_BYTES = 2_000_000;

export function parseEntries(body: unknown): Entry[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { entries?: unknown }).entries)) return null;
  const out: Entry[] = [];
  for (const e of (body as { entries: unknown[] }).entries) {
    const x = e as Partial<Entry>;
    if (typeof x.key !== "string" || !syncableKey(x.key)) return null;
    if (x.value !== null && typeof x.value !== "string") return null;
    if (typeof x.value === "string" && x.value.length > MAX_VALUE_BYTES) return null;
    if (typeof x.updatedAt !== "number" || !Number.isFinite(x.updatedAt) || x.updatedAt < 0) return null;
    out.push({ key: x.key, value: x.value ?? null, updatedAt: Math.floor(x.updatedAt) });
  }
  return out;
}

interface Row {
  key: string;
  value: string | null;
  updated_at: string | number;
}
const toEntry = (r: Row): Entry => ({ key: r.key, value: r.value, updatedAt: Number(r.updated_at) });

export async function pull(db: Db, userId: string): Promise<Entry[]> {
  const rows = await db.query<Row>("SELECT key, value, updated_at FROM user_state WHERE user_id = $1", [userId]);
  return rows.map(toEntry);
}

/**
 * Apply the client's changes. An entry wins when its change time is at or after the stored one.
 * Returns what the server now holds for every key the client sent, so the client can adopt the
 * newer value where it lost.
 */
export async function push(db: Db, userId: string, entries: Entry[]): Promise<{ accepted: string[]; current: Entry[] }> {
  const accepted: string[] = [];
  for (const e of entries) {
    const rows = await db.query<{ key: string }>(
      `INSERT INTO user_state (user_id, key, value, updated_at) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
       WHERE user_state.updated_at <= EXCLUDED.updated_at
       RETURNING key`,
      [userId, e.key, e.value, e.updatedAt],
    );
    if (rows.length) accepted.push(e.key);
  }
  const keys = entries.map((e) => e.key);
  const current = keys.length ? (await db.query<Row>("SELECT key, value, updated_at FROM user_state WHERE user_id = $1 AND key = ANY($2)", [userId, keys])).map(toEntry) : [];
  return { accepted, current };
}

/** Replace the account's progress with this device's: everything not sent becomes a tombstone. */
export async function replaceAll(db: Db, userId: string, entries: Entry[], now: number): Promise<void> {
  await db.query("UPDATE user_state SET value = NULL, updated_at = $2 WHERE user_id = $1 AND value IS NOT NULL AND NOT (key = ANY($3))", [userId, now, entries.map((e) => e.key)]);
  await push(db, userId, entries.map((e) => ({ ...e, updatedAt: Math.max(e.updatedAt, now) })));
}

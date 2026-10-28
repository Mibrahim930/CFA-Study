import { Pool } from "pg";

/**
 * Postgres access for accounts and progress sync. One table per concern:
 *   users       email + scrypt password hash
 *   sessions    hashed bearer tokens (the raw token lives only in the browser cookie)
 *   user_state  the user's "l1:" localStorage entries, one row per key, with the client's
 *               change time for last-write-wins. A NULL value is a tombstone (the key was removed).
 *
 * `DATABASE_URL` turns accounts on (Railway injects it when a Postgres service is linked). Without
 * it the app keeps working per device, exactly as before.
 */

export interface Db {
  query<T extends object = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  close(): Promise<void>;
}

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);
CREATE TABLE IF NOT EXISTS user_state (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text,
  updated_at bigint NOT NULL,
  PRIMARY KEY (user_id, key)
);
`;

export function accountsEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** A database handle for one connection string; the schema is created on first use. */
export function createDb(connectionString: string): Db {
  const pool = new Pool({ connectionString, max: 5, ssl: needsSsl(connectionString) ? { rejectUnauthorized: false } : undefined });
  let ready: Promise<void> | null = null;
  const ensure = () => (ready ??= pool.query(SCHEMA).then(() => undefined));
  return {
    async query<T extends object>(sql: string, params: unknown[] = []) {
      await ensure();
      const r = await pool.query(sql, params);
      return r.rows as T[];
    },
    close: () => pool.end(),
  };
}

/** Hosted Postgres (Railway's public proxy, Supabase, Neon) wants TLS; a local or private-network URL does not. */
function needsSsl(url: string): boolean {
  if (/sslmode=(require|verify)/.test(url)) return true;
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|[^/]*\.railway\.internal)[:/]/.test(url);
}

let shared: Db | null = null;
/** The app's database (from DATABASE_URL), or null when accounts are off. */
export function db(): Db | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return (shared ??= createDb(url));
}

import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";
import type { Db } from "./db";

/**
 * Accounts: email + password, hashed with scrypt (Node's own, no native module), and bearer sessions
 * whose random token is stored hashed. No email is ever sent, so there is no password reset by email:
 * a signed-in user can change their password, and a forgotten one needs a manual reset (docs/DEPLOY.md).
 */

const scrypt = (password: string, salt: Buffer, keylen: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))));
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
export const SESSION_DAYS = 90;
export const MIN_PASSWORD = 8;

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export type AuthError = "invalid_email" | "weak_password" | "email_taken" | "bad_credentials" | "not_signed_in";
export type AuthResult<T> = { ok: true; value: T } | { ok: false; error: AuthError };

export const AUTH_MESSAGES: Record<AuthError, string> = {
  invalid_email: "That doesn't look like an email address.",
  weak_password: `Use at least ${MIN_PASSWORD} characters.`,
  email_taken: "There is already an account with that email. Sign in instead.",
  bad_credentials: "Wrong email or password.",
  not_signed_in: "You're not signed in.",
};

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, N, r, p, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await scrypt(password.normalize("NFKC"), Buffer.from(salt, "base64"), expected.length, { N: Number(N), r: Number(r), p: Number(p) });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}
const toUser = (r: UserRow): User => ({ id: r.id, email: r.email, createdAt: r.created_at.toISOString() });

async function startSession(db: Db, userId: string): Promise<string> {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [hashToken(token), userId, expires]);
  return token;
}

export async function signUp(db: Db, emailRaw: string, password: string): Promise<AuthResult<{ user: User; token: string }>> {
  const email = normalizeEmail(emailRaw);
  if (!validEmail(email)) return { ok: false, error: "invalid_email" };
  if (password.length < MIN_PASSWORD) return { ok: false, error: "weak_password" };
  const taken = await db.query<{ id: string }>("SELECT id FROM users WHERE email = $1", [email]);
  if (taken.length) return { ok: false, error: "email_taken" };
  const rows = await db.query<UserRow>("INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *", [email, await hashPassword(password)]);
  const user = toUser(rows[0]);
  return { ok: true, value: { user, token: await startSession(db, user.id) } };
}

export async function signIn(db: Db, emailRaw: string, password: string): Promise<AuthResult<{ user: User; token: string }>> {
  const rows = await db.query<UserRow>("SELECT * FROM users WHERE email = $1", [normalizeEmail(emailRaw)]);
  // Verify against a dummy hash when the email is unknown so timing does not reveal which emails exist.
  const row = rows[0];
  const good = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !good) return { ok: false, error: "bad_credentials" };
  const user = toUser(row);
  return { ok: true, value: { user, token: await startSession(db, user.id) } };
}
const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

export async function userFromToken(db: Db, token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const rows = await db.query<UserRow>(
    "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > now()",
    [hashToken(token)],
  );
  return rows.length ? toUser(rows[0]) : null;
}

export async function signOut(db: Db, token: string | undefined): Promise<void> {
  if (token) await db.query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
}

/** Change the password; every other session of the user is ended. */
export async function changePassword(db: Db, userId: string, current: string, next: string, keepToken: string): Promise<AuthResult<null>> {
  if (next.length < MIN_PASSWORD) return { ok: false, error: "weak_password" };
  const rows = await db.query<UserRow>("SELECT * FROM users WHERE id = $1", [userId]);
  if (!rows.length || !(await verifyPassword(current, rows[0].password_hash))) return { ok: false, error: "bad_credentials" };
  await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [await hashPassword(next), userId]);
  await db.query("DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2", [userId, hashToken(keepToken)]);
  return { ok: true, value: null };
}

/** Does the account hold any synced progress? (Decides the first-sign-in merge question.) */
export async function hasState(db: Db, userId: string): Promise<boolean> {
  const rows = await db.query<{ n: string }>("SELECT count(*)::text AS n FROM user_state WHERE user_id = $1 AND value IS NOT NULL", [userId]);
  return Number(rows[0]?.n ?? 0) > 0;
}

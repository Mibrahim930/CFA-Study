import { cookies } from "next/headers";
import { AUTH_MESSAGES, changePassword, hasState, SESSION_DAYS, signIn, signOut, signUp, userFromToken, type AuthError, type User } from "./auth";
import { db } from "./db";
import { parseEntries, pull, push, replaceAll } from "./sync";

/**
 * Route-handler bodies for /api/auth/* and /api/sync. Each is a plain function over a Request so the
 * route files stay one line each. The session is an httpOnly cookie holding the raw bearer token.
 */

export const COOKIE = "l1_session";

const json = (body: unknown, status = 200) => Response.json(body, { status });
const fail = (error: AuthError | "accounts_off" | "bad_request", status: number) =>
  json({ error, message: error === "accounts_off" ? "Accounts are not set up on this server." : error === "bad_request" ? "That request was not understood." : AUTH_MESSAGES[error] }, status);

async function setSessionCookie(token: string | null) {
  const store = await cookies();
  if (token) store.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DAYS * 86_400 });
  else store.delete(COOKIE);
}

async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE)?.value;
}

const publicUser = (u: User) => ({ email: u.email, createdAt: u.createdAt });

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = (await request.json()) as unknown;
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** GET /api/auth/me */
export async function me(): Promise<Response> {
  const d = db();
  if (!d) return json({ enabled: false, user: null });
  const user = await userFromToken(d, await sessionToken());
  return json({ enabled: true, user: user && publicUser(user) });
}

async function credentials(request: Request, mode: "signup" | "login"): Promise<Response> {
  const d = db();
  if (!d) return fail("accounts_off", 503);
  const body = await readJson(request);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const r = mode === "signup" ? await signUp(d, email, password) : await signIn(d, email, password);
  if (!r.ok) return fail(r.error, r.error === "bad_credentials" ? 401 : 400);
  await setSessionCookie(r.value.token);
  return json({ user: publicUser(r.value.user), hasData: mode === "signup" ? false : await hasState(d, r.value.user.id) });
}

/** POST /api/auth/signup {email, password} */
export const postSignup = (request: Request) => credentials(request, "signup");
/** POST /api/auth/login {email, password} */
export const postLogin = (request: Request) => credentials(request, "login");

/** POST /api/auth/logout */
export async function postLogout(): Promise<Response> {
  const d = db();
  if (d) await signOut(d, await sessionToken());
  await setSessionCookie(null);
  return json({ ok: true });
}

/** POST /api/auth/password {current, next} */
export async function postPassword(request: Request): Promise<Response> {
  const d = db();
  if (!d) return fail("accounts_off", 503);
  const token = await sessionToken();
  const user = await userFromToken(d, token);
  if (!user || !token) return fail("not_signed_in", 401);
  const body = await readJson(request);
  const r = await changePassword(d, user.id, String(body?.current ?? ""), String(body?.next ?? ""), token);
  return r.ok ? json({ ok: true }) : fail(r.error, r.error === "bad_credentials" ? 401 : 400);
}

/** GET /api/sync: every entry the account holds (tombstones included). */
export async function getSync(): Promise<Response> {
  const d = db();
  if (!d) return fail("accounts_off", 503);
  const user = await userFromToken(d, await sessionToken());
  if (!user) return fail("not_signed_in", 401);
  return json({ entries: await pull(d, user.id), serverTime: Date.now() });
}

/** PUT /api/sync {entries, replace?}: push changes (last write wins), or replace the account's progress wholesale. */
export async function putSync(request: Request): Promise<Response> {
  const d = db();
  if (!d) return fail("accounts_off", 503);
  const user = await userFromToken(d, await sessionToken());
  if (!user) return fail("not_signed_in", 401);
  const body = await readJson(request);
  const entries = parseEntries(body);
  if (!entries) return fail("bad_request", 400);
  if (body?.replace === true) {
    await replaceAll(d, user.id, entries, Date.now());
    return json({ accepted: entries.map((e) => e.key), current: [], serverTime: Date.now() });
  }
  const r = await push(d, user.id, entries);
  return json({ ...r, serverTime: Date.now() });
}

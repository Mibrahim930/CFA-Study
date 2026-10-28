import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { changePassword, hashPassword, hashToken, hasState, newToken, normalizeEmail, signIn, signOut, signUp, userFromToken, validEmail, verifyPassword } from "./auth";
import { createDb, type Db } from "./db";
import { syncableKey } from "@/lib/sync-keys";
import { parseEntries, pull, push, replaceAll } from "./sync";

describe("passwords and tokens", () => {
  it("hashes with a fresh salt and verifies", async () => {
    const a = await hashPassword("correct horse");
    const b = await hashPassword("correct horse");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$16384$8$1$")).toBe(true);
    expect(await verifyPassword("correct horse", a)).toBe(true);
    expect(await verifyPassword("correct horse!", a)).toBe(false);
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
  it("tokens are long, URL-safe and stored hashed", () => {
    const t = newToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashToken(t)).toHaveLength(64);
    expect(hashToken(t)).toBe(hashToken(t));
  });
  it("emails are normalised and checked", () => {
    expect(normalizeEmail("  Someone@Example.COM ")).toBe("someone@example.com");
    expect(validEmail("a@b.co")).toBe(true);
    expect(validEmail("nope")).toBe(false);
  });
});

describe("sync entry validation", () => {
  it("accepts l1: keys and rejects per-device meta keys and bad shapes", () => {
    expect(syncableKey("l1:review")).toBe(true);
    expect(syncableKey("l1:meta:dirty")).toBe(false);
    expect(syncableKey("other")).toBe(false);
    expect(parseEntries({ entries: [{ key: "l1:review", value: "{}", updatedAt: 5.7 }] })).toEqual([{ key: "l1:review", value: "{}", updatedAt: 5 }]);
    expect(parseEntries({ entries: [{ key: "l1:mock:session", value: null, updatedAt: 1 }] })).toEqual([{ key: "l1:mock:session", value: null, updatedAt: 1 }]);
    expect(parseEntries({ entries: [{ key: "l1:meta:dirty", value: "{}", updatedAt: 1 }] })).toBeNull();
    expect(parseEntries({ entries: [{ key: "l1:x", value: 3, updatedAt: 1 }] })).toBeNull();
    expect(parseEntries({ entries: "no" })).toBeNull();
  });
});

// Integration tests need a real Postgres: TEST_DATABASE_URL=postgres://postgres@127.0.0.1:5433/l1test npm test
const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)("accounts and sync against Postgres", () => {
  let db: Db;
  const email = `t${Date.now()}@example.com`;
  beforeAll(async () => {
    db = createDb(url!);
    await db.query("DELETE FROM users WHERE email LIKE 't%@example.com'");
  });
  afterAll(async () => db.close());

  it("sign up, sign in, session lookup, sign out", async () => {
    expect(await signUp(db, "bad", "longenough")).toEqual({ ok: false, error: "invalid_email" });
    expect(await signUp(db, email, "short")).toEqual({ ok: false, error: "weak_password" });
    const up = await signUp(db, email, "longenough");
    expect(up.ok).toBe(true);
    if (!up.ok) return;
    expect(await signUp(db, email.toUpperCase(), "longenough")).toEqual({ ok: false, error: "email_taken" });
    expect((await userFromToken(db, up.value.token))?.email).toBe(email);
    expect(await userFromToken(db, "nope")).toBeNull();
    expect(await signIn(db, email, "wrong")).toEqual({ ok: false, error: "bad_credentials" });
    expect(await signIn(db, "nobody@example.com", "longenough")).toEqual({ ok: false, error: "bad_credentials" });
    const inn = await signIn(db, ` ${email.toUpperCase()} `, "longenough");
    expect(inn.ok && inn.value.user.id).toBe(up.value.user.id);
    await signOut(db, up.value.token);
    expect(await userFromToken(db, up.value.token)).toBeNull();
    if (inn.ok) expect(await userFromToken(db, inn.value.token)).not.toBeNull();
  });

  it("changing the password ends the other sessions", async () => {
    const a = await signIn(db, email, "longenough");
    const b = await signIn(db, email, "longenough");
    if (!a.ok || !b.ok) throw new Error("sign in failed");
    expect(await changePassword(db, a.value.user.id, "wrong", "evenlonger", a.value.token)).toEqual({ ok: false, error: "bad_credentials" });
    expect(await changePassword(db, a.value.user.id, "longenough", "evenlonger", a.value.token)).toEqual({ ok: true, value: null });
    expect(await userFromToken(db, a.value.token)).not.toBeNull();
    expect(await userFromToken(db, b.value.token)).toBeNull();
    expect((await signIn(db, email, "evenlonger")).ok).toBe(true);
  });

  it("push is last-write-wins per key and pull returns tombstones", async () => {
    const u = await signIn(db, email, "evenlonger");
    if (!u.ok) throw new Error("sign in failed");
    const id = u.value.user.id;
    expect(await hasState(db, id)).toBe(false);
    let r = await push(db, id, [
      { key: "l1:review", value: "v1", updatedAt: 100 },
      { key: "l1:settings", value: "s1", updatedAt: 100 },
    ]);
    expect(r.accepted.sort()).toEqual(["l1:review", "l1:settings"]);
    expect(await hasState(db, id)).toBe(true);
    // An older change loses and the caller gets the server's newer value back.
    r = await push(db, id, [{ key: "l1:review", value: "stale", updatedAt: 50 }]);
    expect(r.accepted).toEqual([]);
    expect(r.current).toEqual([{ key: "l1:review", value: "v1", updatedAt: 100 }]);
    // A newer change wins; a removal is kept as a tombstone.
    r = await push(db, id, [
      { key: "l1:review", value: "v2", updatedAt: 200 },
      { key: "l1:settings", value: null, updatedAt: 200 },
    ]);
    expect(r.accepted.sort()).toEqual(["l1:review", "l1:settings"]);
    const all = (await pull(db, id)).sort((a, b) => a.key.localeCompare(b.key));
    expect(all).toEqual([
      { key: "l1:review", value: "v2", updatedAt: 200 },
      { key: "l1:settings", value: null, updatedAt: 200 },
    ]);
  });

  it("replaceAll tombstones everything the device does not have", async () => {
    const u = await signIn(db, email, "evenlonger");
    if (!u.ok) throw new Error("sign in failed");
    await replaceAll(db, u.value.user.id, [{ key: "l1:activity", value: "a", updatedAt: 10 }], 300);
    const all = (await pull(db, u.value.user.id)).sort((a, b) => a.key.localeCompare(b.key));
    expect(all).toEqual([
      { key: "l1:activity", value: "a", updatedAt: 300 },
      { key: "l1:review", value: null, updatedAt: 300 },
      { key: "l1:settings", value: null, updatedAt: 200 },
    ]);
  });
});

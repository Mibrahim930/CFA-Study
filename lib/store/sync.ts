"use client";

import { useSyncExternalStore } from "react";
import type { Entry } from "@/lib/sync-keys";
import { applyRemote, CHANGE_EVENT, localEntries, markClean, markDirty, notifyStores, readDirty, readStamps, wipeLocal } from "./persist";
import { planPull, planPush, planPushResult } from "./sync-merge";

/**
 * Account sync, browser side. Local-first: every store still writes localStorage first; this module
 * pushes dirty keys to /api/sync a moment later and pulls the account's newer keys when the app opens
 * or comes back to the foreground. Last write wins per key.
 */

export interface SyncUser {
  email: string;
  createdAt: string;
}

export interface SyncStatus {
  /** null until /api/auth/me has answered. */
  enabled: boolean | null;
  user: SyncUser | null;
  state: "idle" | "syncing" | "error";
  lastSyncAt: number | null;
  error: string | null;
  /** The account and this device both hold progress: the person must choose which to keep. */
  choice: boolean;
}

const INITIAL: SyncStatus = { enabled: null, user: null, state: "idle", lastSyncAt: null, error: null, choice: false };
let status: SyncStatus = INITIAL;
const listeners = new Set<() => void>();

function set(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch };
  for (const l of listeners) l();
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => status,
    () => INITIAL,
  );
}

class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public httpStatus: number,
  ) {
    super(message);
  }
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { credentials: "same-origin", headers: { "content-type": "application/json", ...(init.headers ?? {}) }, ...init });
  const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string } & T;
  if (!res.ok) throw new ApiError(body.message ?? `Request failed (${res.status})`, body.error ?? "http", res.status);
  return body;
}

const describe = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

// One sync at a time; a request to sync while one runs is folded into a follow-up run.
let running: Promise<void> | null = null;
let again = false;

async function runSync(mode: "pull" | "push" | "both") {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      set({ state: "syncing", error: null });
      if (mode !== "push") await pullOnce();
      if (mode !== "pull") await pushOnce();
      set({ state: "idle", lastSyncAt: Date.now() });
    } catch (e) {
      if (e instanceof ApiError && e.httpStatus === 401) set({ user: null, state: "idle", error: "Your sign-in expired. Sign in again to keep syncing." });
      else set({ state: "error", error: describe(e) });
    } finally {
      running = null;
      if (again) {
        again = false;
        void runSync("both");
      }
    }
  })();
  return running;
}

async function pullOnce() {
  const { entries } = await api<{ entries: Entry[] }>("/api/sync");
  const plan = planPull(entries, readDirty(), readStamps());
  for (const e of plan.apply) applyRemote(e.key, e.value, e.updatedAt);
  if (plan.apply.length) notifyStores(plan.apply.map((e) => e.key));
}

async function pushOnce() {
  const sent = planPush(readDirty(), localEntries());
  if (!sent.length) return;
  const r = await api<{ accepted: string[]; current: Entry[] }>("/api/sync", { method: "PUT", body: JSON.stringify({ entries: sent }) });
  const plan = planPushResult(sent, r.accepted, r.current);
  markClean(plan.clean);
  for (const e of plan.apply) applyRemote(e.key, e.value, e.updatedAt);
  if (plan.apply.length) notifyStores(plan.apply.map((e) => e.key));
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePush() {
  if (!status.user || status.choice) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void runSync("push");
  }, 1500);
}

let started = false;
/** Called once from SyncProvider. Finds out whether accounts exist and who is signed in, then syncs. */
export async function start() {
  if (started) return;
  started = true;
  window.addEventListener(CHANGE_EVENT, schedulePush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && status.user && !status.choice) void runSync("both");
  });
  window.addEventListener("online", () => status.user && void runSync("both"));
  try {
    const me = await api<{ enabled: boolean; user: SyncUser | null }>("/api/auth/me");
    set({ enabled: me.enabled, user: me.user });
    if (me.user) await runSync("both");
  } catch (e) {
    set({ enabled: false, error: describe(e) });
  }
}

function markAllDirty(at = Date.now()) {
  for (const key of Object.keys(localEntries())) markDirty(key, at);
}

export async function signUp(email: string, password: string): Promise<string | null> {
  try {
    const r = await api<{ user: SyncUser }>("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) });
    // A new account: whatever this device has becomes the account's progress.
    markAllDirty();
    set({ user: r.user, choice: false, error: null });
    await runSync("push");
    return null;
  } catch (e) {
    return describe(e);
  }
}

/** Returns an error message, or null. Afterwards `status.choice` says whether the person must pick a side. */
export async function signIn(email: string, password: string): Promise<string | null> {
  try {
    const r = await api<{ user: SyncUser; hasData: boolean }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    const localHasData = Object.keys(localEntries()).length > 0;
    if (r.hasData && localHasData) {
      set({ user: r.user, choice: true, error: null });
      return null;
    }
    set({ user: r.user, choice: false, error: null });
    if (localHasData) markAllDirty();
    else wipeLocal();
    await runSync("both");
    return null;
  } catch (e) {
    return describe(e);
  }
}

/** First sign-in on a device that already has progress: keep the account's copy. */
export async function keepAccount() {
  wipeLocal();
  notifyStores([]);
  set({ choice: false });
  await runSync("pull");
}

/** First sign-in on a device that already has progress: keep this device's copy and overwrite the account. */
export async function keepDevice() {
  try {
    set({ state: "syncing", error: null });
    const now = Date.now();
    const entries = Object.entries(localEntries()).map(([key, value]) => ({ key, value, updatedAt: now }));
    await api("/api/sync", { method: "PUT", body: JSON.stringify({ entries, replace: true }) });
    markClean(Object.fromEntries(entries.map((e) => [e.key, now])));
    set({ choice: false, state: "idle", lastSyncAt: Date.now() });
  } catch (e) {
    set({ state: "error", error: describe(e) });
  }
}

/**
 * Sign out. The device's copy is cleared so the next person to sign in here starts clean; the account
 * keeps everything. Refuses (with a message) when unsent changes could not reach the account.
 */
export async function signOut(): Promise<string | null> {
  if (status.user && !status.choice) {
    await runSync("push");
    if (Object.keys(readDirty()).length) return "Some changes haven't reached your account yet (are you offline?). Try again in a moment, or download a backup first.";
  }
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch (e) {
    return describe(e);
  }
  wipeLocal();
  notifyStores([]);
  set({ user: null, choice: false, error: null, lastSyncAt: null });
  return null;
}

export async function changePassword(current: string, next: string): Promise<string | null> {
  try {
    await api("/api/auth/password", { method: "POST", body: JSON.stringify({ current, next }) });
    return null;
  } catch (e) {
    return describe(e);
  }
}

/** Sync now (a button). */
export const syncNow = () => runSync("both");

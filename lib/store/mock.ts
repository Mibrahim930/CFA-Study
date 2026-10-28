"use client";

import { useSyncExternalStore } from "react";
import { touchActivity } from "./activity";

// The mock exam in progress (or its last result), saved so a reload or leaving the page doesn't lose it.
// Local-first like lib/store/local.ts; the "l1:" prefix means backups include it.

export interface MockSession {
  /** Deck ids of the questions, in exam order. */
  ids: string[];
  /** Unix seconds; the clock keeps running while the page is closed, as in the real exam. */
  startedAt: number;
  i: number;
  answers: Record<string, number>;
  flags: Record<string, boolean>;
  /** Submitted or timed out; missed questions have been added to the review deck. */
  finished: boolean;
  /** Unix seconds when it was submitted or timed out. */
  finishedAt?: number;
}

const KEY = "l1:mock:session";
const CHANGE = "l1-mock-change";

let cacheRaw: string | null | undefined;
let cacheValue: MockSession | null = null;

function read(): MockSession | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cacheValue;
  }
  if (raw === cacheRaw) return cacheValue;
  cacheRaw = raw;
  try {
    cacheValue = raw ? (JSON.parse(raw) as MockSession) : null;
  } catch {
    cacheValue = null;
  }
  return cacheValue;
}

export function saveMock(next: MockSession | null) {
  const raw = next ? JSON.stringify(next) : null;
  try {
    if (raw) localStorage.setItem(KEY, raw);
    else localStorage.removeItem(KEY);
  } catch {
    // storage unavailable: keep it in memory for this tab
  }
  cacheRaw = raw;
  cacheValue = next;
  window.dispatchEvent(new Event(CHANGE));
}

export function updateMock(fn: (s: MockSession) => MockSession) {
  touchActivity();
  const s = read();
  if (s) saveMock(fn(s));
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE, cb);
  };
}

/** The saved session; undefined while prerendering, null when there is none. */
export function useMockSession(): MockSession | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}

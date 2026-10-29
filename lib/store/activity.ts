"use client";

import { useSyncExternalStore } from "react";
import { persistSet } from "./persist";

// Which days had any study activity (a card rated, a question answered, a module touched), as local
// YYYY-MM-DD keys. Honest consistency ("4 of 7 days this week"), never a streak. Local-first; "l1:"
// prefix so backups include it.

const KEY = "l1:activity";
const CHANGE = "l1-activity-change";

let cacheRaw: string | null | undefined;
let cacheValue: Record<string, true> = {};

function read(): Record<string, true> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cacheValue;
  }
  if (raw === cacheRaw) return cacheValue;
  cacheRaw = raw;
  try {
    cacheValue = raw ? (JSON.parse(raw) as Record<string, true>) : {};
  } catch {
    cacheValue = {};
  }
  return cacheValue;
}

export function dayKey(t: number | Date): string {
  const d = typeof t === "number" ? new Date(t) : t;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Record that something was studied today. Cheap and idempotent; call it from any store write. */
export function touchActivity() {
  if (typeof window === "undefined") return;
  const cur = read();
  const key = dayKey(Date.now());
  if (cur[key]) return;
  const next = { ...cur, [key]: true as const };
  const raw = JSON.stringify(next);
  persistSet(KEY, raw); // storage unavailable: keep in memory for this tab
  cacheRaw = raw;
  cacheValue = next;
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE, cb);
  };
}

const EMPTY: Record<string, true> = {};
export function useActivity(): Record<string, true> {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** The last seven days ending today: which were studied. */
export function lastSevenDays(activity: Record<string, true>, now: number | null): { key: string; studied: boolean; today: boolean }[] {
  if (now === null) return [];
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const key = dayKey(now - i * 86_400_000);
    out.push({ key, studied: !!activity[key], today: i === 0 });
  }
  return out;
}

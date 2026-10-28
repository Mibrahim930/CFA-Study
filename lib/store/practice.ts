"use client";

import { useSyncExternalStore } from "react";
import { touchActivity } from "./activity";
import { persistSet } from "./persist";

// Practice scores per learning outcome: what the mastery labels are derived from. A score is recorded
// each time the practice set for a lesson is finished. Local-first like lib/store/local.ts; the "l1:"
// prefix means backups include it.

export interface LosPractice {
  attempts: number;
  /** The most recent finished set. */
  last: { right: number; total: number; at: number };
  /** Best score so far, as a fraction (0–1). */
  best: number;
}

const KEY = "l1:practice";
const CHANGE = "l1-practice-change";

let cacheRaw: string | null | undefined;
let cacheValue: Record<string, LosPractice> = {};

export function readPractice(): Record<string, LosPractice> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cacheValue;
  }
  if (raw === cacheRaw) return cacheValue;
  cacheRaw = raw;
  try {
    cacheValue = raw ? (JSON.parse(raw) as Record<string, LosPractice>) : {};
  } catch {
    cacheValue = {};
  }
  return cacheValue;
}

/** Record a finished practice set for one learning outcome. */
export function recordPractice(losId: string, right: number, total: number) {
  if (total <= 0) return;
  const cur = readPractice();
  const prev = cur[losId];
  const score = right / total;
  const next: Record<string, LosPractice> = {
    ...cur,
    [losId]: { attempts: (prev?.attempts ?? 0) + 1, last: { right, total, at: Date.now() }, best: Math.max(prev?.best ?? 0, score) },
  };
  const raw = JSON.stringify(next);
  persistSet(KEY, raw); // storage unavailable: keep in memory for this tab
  cacheRaw = raw;
  cacheValue = next;
  window.dispatchEvent(new Event(CHANGE));
  touchActivity();
}

export function subscribePractice(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE, cb);
  };
}

const EMPTY: Record<string, LosPractice> = {};
export function usePractice(): Record<string, LosPractice> {
  return useSyncExternalStore(subscribePractice, readPractice, () => EMPTY);
}

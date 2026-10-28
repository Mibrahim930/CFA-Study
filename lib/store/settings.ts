"use client";

import { useSyncExternalStore } from "react";

// Study settings: the exam date (for the countdown) and the weekly hours goal. Local-first like
// lib/store/local.ts; the "l1:" prefix means backups include it.

export interface Settings {
  /** ISO date (YYYY-MM-DD) of the scheduled exam, if set. */
  examDate?: string;
  /** Hours per week the person is aiming for. */
  weeklyHours: number;
}

const KEY = "l1:settings";
const CHANGE = "l1-settings-change";
const DEFAULTS: Settings = { weeklyHours: 12 };

let cacheRaw: string | null | undefined;
let cacheValue: Settings = DEFAULTS;

function read(): Settings {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cacheValue;
  }
  if (raw === cacheRaw) return cacheValue;
  cacheRaw = raw;
  try {
    cacheValue = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS;
  } catch {
    cacheValue = DEFAULTS;
  }
  return cacheValue;
}

export function saveSettings(patch: Partial<Settings>) {
  const next = { ...read(), ...patch };
  const raw = JSON.stringify(next);
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    // storage unavailable: keep in memory for this tab
  }
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

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, read, () => DEFAULTS);
}

/** Whole days until the exam (negative once it has passed); null when no date is set or while prerendering. */
export function daysToExam(examDate: string | undefined, now: number | null): number | null {
  if (!examDate || now === null) return null;
  const [y, m, d] = examDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  const exam = new Date(y, m - 1, d).getTime();
  const today = new Date(now);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((exam - start) / 86_400_000);
}

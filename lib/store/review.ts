"use client";

import { useSyncExternalStore } from "react";
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";

// Spaced-repetition state (FSRS via ts-fsrs), local-first like lib/store/local.ts.
// Items: lesson flashcards ("<losId>:f2") and missed practice questions ("<losId>:q3").

export type ReviewKind = "flashcard" | "missed";

interface Stored {
  kind: ReviewKind;
  addedAt: number;
  card: Card;
}

const KEY = "l1:review";
const CHANGE = "l1-review-change";
const scheduler = fsrs({ enable_fuzz: true });

let cacheRaw: string | null | undefined;
let cacheValue: Record<string, Stored> = {};

function revive(raw: Record<string, Stored>): Record<string, Stored> {
  for (const s of Object.values(raw)) {
    s.card = { ...s.card, due: new Date(s.card.due), last_review: s.card.last_review ? new Date(s.card.last_review) : undefined };
  }
  return raw;
}

function read(): Record<string, Stored> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cacheValue;
  }
  if (raw === cacheRaw) return cacheValue;
  cacheRaw = raw;
  try {
    cacheValue = raw ? revive(JSON.parse(raw) as Record<string, Stored>) : {};
  } catch {
    cacheValue = {};
  }
  return cacheValue;
}

function write(next: Record<string, Stored>) {
  const raw = JSON.stringify(next);
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    // storage unavailable: keep in memory for this tab
  }
  cacheRaw = raw;
  cacheValue = revive(JSON.parse(raw) as Record<string, Stored>);
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

const EMPTY: Record<string, Stored> = {};
export function useReviewState(): Record<string, Stored> {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Enrol items that aren't tracked yet (e.g. a lesson's flashcards once it's opened). */
export function enrol(ids: string[], kind: ReviewKind) {
  const cur = read();
  const missing = ids.filter((id) => !cur[id]);
  if (!missing.length) return;
  const now = new Date();
  const next = { ...cur };
  for (const id of missing) next[id] = { kind, addedAt: now.getTime(), card: createEmptyCard(now) };
  write(next);
}

/** A wrong answer: track the question as a card that's due now (or reset it if already tracked). */
export function markMissed(id: string) {
  const cur = read();
  const now = new Date();
  const prev = cur[id];
  const card = prev ? scheduler.next(prev.card, now, Rating.Again).card : createEmptyCard(now);
  write({ ...cur, [id]: { kind: prev?.kind ?? "missed", addedAt: prev?.addedAt ?? now.getTime(), card } });
}

export function rate(id: string, grade: Grade) {
  const cur = read();
  const item = cur[id];
  if (!item) return;
  write({ ...cur, [id]: { ...item, card: scheduler.next(item.card, new Date(), grade).card } });
}

/** Human-readable next interval for each grade, e.g. { 1: "10 min", 3: "3 days" }. */
export function previewIntervals(card: Card, now: Date): Record<Grade, string> {
  const p = scheduler.repeat(card, now);
  const fmt = (d: Date) => {
    const mins = Math.max(1, Math.round((d.getTime() - now.getTime()) / 60000));
    if (mins < 60) return `${mins} min`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} h`;
    const days = Math.round(hrs / 24);
    return days < 31 ? `${days} day${days === 1 ? "" : "s"}` : `${Math.round(days / 30)} mo`;
  };
  return {
    [Rating.Again]: fmt(p[Rating.Again].card.due),
    [Rating.Hard]: fmt(p[Rating.Hard].card.due),
    [Rating.Good]: fmt(p[Rating.Good].card.due),
    [Rating.Easy]: fmt(p[Rating.Easy].card.due),
  } as Record<Grade, string>;
}

/**
 * The current minute, read only in the browser (null while prerendering: Next must not bake a time into
 * the static shell). Updates every 30 s so cards become due without a reload.
 */
export function useNow(): number | null {
  return useSyncExternalStore(
    (cb) => {
      const t = setInterval(cb, 30_000);
      return () => clearInterval(t);
    },
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => null,
  );
}

export function dueIds(state: Record<string, Stored>, now: number | null): string[] {
  if (now === null) return [];
  return Object.entries(state)
    .filter(([, s]) => s.card.due.getTime() <= now)
    .sort((a, b) => a[1].card.due.getTime() - b[1].card.due.getTime())
    .map(([id]) => id);
}

export { Rating };

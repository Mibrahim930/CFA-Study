"use client";

import { useCallback, useSyncExternalStore } from "react";
import { moduleMastery, type Mastery } from "@/lib/progress";
import { touchActivity } from "./activity";

// Local-first persistence for M1. The shape mirrors the planned Supabase tables
// (plan/progress/notes) so this module can be swapped for a synced store later.

export interface Note {
  id: string;
  text: string;
  videoId?: string;
  /** Seconds into the video when the note was taken. */
  t?: number;
  createdAt: number;
}

export interface ModuleState {
  done: boolean;
  losDone: string[];
  videos: string[];
  notes: Note[];
  lastVideo?: { id: string; t: number };
}

const PREFIX = "l1:module:";
const CHANGE = "l1-store-change";
const EMPTY: ModuleState = { done: false, losDone: [], videos: [], notes: [] };

const cache = new Map<string, { raw: string | null; value: ModuleState }>();

function read(slug: string): ModuleState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PREFIX + slug);
  } catch {
    return EMPTY;
  }
  const hit = cache.get(slug);
  if (hit && hit.raw === raw) return hit.value;
  let value = EMPTY;
  if (raw) {
    try {
      value = { ...EMPTY, ...(JSON.parse(raw) as Partial<ModuleState>) };
    } catch {
      value = EMPTY;
    }
  }
  cache.set(slug, { raw, value });
  return value;
}

function write(slug: string, value: ModuleState) {
  try {
    localStorage.setItem(PREFIX + slug, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode / quota) — keep working in memory
    cache.set(slug, { raw: JSON.stringify(value), value });
  }
  window.dispatchEvent(new Event(CHANGE));
  touchActivity();
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE, callback);
  };
}

export function useModuleState(slug: string) {
  const state = useSyncExternalStore(
    subscribe,
    () => read(slug),
    () => EMPTY,
  );
  const update = useCallback(
    (fn: (s: ModuleState) => ModuleState) => write(slug, fn(read(slug))),
    [slug],
  );
  return [state, update] as const;
}

/** Completed-module flags for a set of slugs (dashboard progress). */
export function useDoneMap(slugs: string[]): Record<string, boolean> {
  // A string snapshot keeps useSyncExternalStore's equality check stable.
  const snapshot = useSyncExternalStore(
    subscribe,
    () => slugs.map((s) => (read(s).done ? "1" : "0")).join(""),
    () => "",
  );
  return Object.fromEntries(slugs.map((s, i) => [s, snapshot[i] === "1"]));
}

/** Mastery step per module (0 not started, 1 learning, 3 solid) for a set of slugs; a string snapshot keeps the store stable. */
export function useMasteryMap(slugs: string[]): Record<string, Mastery> {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => slugs.map((s) => String(moduleMastery(read(s)))).join(""),
    () => "",
  );
  return Object.fromEntries(slugs.map((s, i) => [s, (Number(snapshot[i] ?? "0") as Mastery) || 0]));
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

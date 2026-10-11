"use client";

import { useSyncExternalStore } from "react";

// Records when a time-limited free trial was started so it can be saved for the right study week.
// Local-only like lib/store/local.ts; stored as an ISO date under "l1:trial:<id>".

const PREFIX = "l1:trial:";
const CHANGE = "l1-trial-change";
const DAY = 86_400_000;

function read(id: string): string | null {
  try {
    return localStorage.getItem(PREFIX + id);
  } catch {
    return null;
  }
}

function write(id: string, value: string | null) {
  try {
    if (value) localStorage.setItem(PREFIX + id, value);
    else localStorage.removeItem(PREFIX + id);
  } catch {
    // storage unavailable: the tracker simply won't persist
  }
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE, callback);
  };
}

/** Local calendar date as YYYY-MM-DD (toISOString would give the UTC date). */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const noop = () => () => {};

export function TrialTracker({ id, days }: { id: string; days: number }) {
  const started = useSyncExternalStore(
    subscribe,
    () => read(id),
    () => null,
  );
  // Read the date outside render so the component stays pure; a string snapshot is stable within a day.
  const now = useSyncExternalStore(noop, today, () => null);

  if (!now) return null;
  if (!started) {
    return (
      <button
        type="button"
        onClick={() => write(id, today())}
        className="rounded-md border border-line px-2.5 py-1 text-xs hover:border-accent"
      >
        I started this {days}-day trial today
      </button>
    );
  }

  const start = new Date(`${started}T00:00:00`);
  const end = new Date(start.getTime() + days * DAY);
  const left = Math.round((end.getTime() - new Date(`${now}T00:00:00`).getTime()) / DAY);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className={left > 0 ? "text-success" : "text-muted"}>
        {left > 0 ? `${left} day${left === 1 ? "" : "s"} left · ends ${fmt(end)}` : `Ended ${fmt(end)}`}
      </span>
      <span className="text-muted">(started {fmt(start)})</span>
      <button type="button" onClick={() => write(id, null)} className="text-muted underline hover:text-foreground">
        reset
      </button>
    </div>
  );
}

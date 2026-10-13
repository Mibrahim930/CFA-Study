"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DeckItem } from "@/lib/content/deck";
import { dueIds, previewIntervals, rate, Rating, useNow, useReviewState } from "@/lib/store/review";
import { InlineRich, RichText } from "./rich-text";

const GRADES = [
  { grade: Rating.Again, key: "1", label: "Again", className: "border-danger/40 bg-danger/8 text-danger" },
  { grade: Rating.Hard, key: "2", label: "Hard", className: "border-warn/40 bg-warn/8 text-warn" },
  { grade: Rating.Good, key: "3", label: "Good", className: "border-success/40 bg-success/8 text-success" },
  { grade: Rating.Easy, key: "4", label: "Easy", className: "border-info/40 bg-info/8 text-info" },
] as const;

type Tally = Record<"again" | "hard" | "good" | "easy", number>;

export function ReviewSession({ deck }: { deck: Record<string, DeckItem> }) {
  const state = useReviewState();
  const now = useNow();
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState<Tally>({ again: 0, hard: 0, good: 0, easy: 0 });
  // Only items whose content still exists (e.g. not quarantined after a re-verify).
  const due = dueIds(state, now).filter((id) => deck[id]);
  const id = due[0];
  const done = tally.again + tally.hard + tally.good + tally.easy;
  const tracked = Object.keys(state).filter((k) => deck[k]).length;

  const grade = (g: (typeof GRADES)[number]) => {
    if (!id) return;
    rate(id, g.grade);
    setFlipped(false);
    setTally((t) => ({ ...t, [g.label.toLowerCase()]: t[g.label.toLowerCase() as keyof Tally] + 1 }));
  };

  // Keyboard: Space/Enter flips; 1–4 grade once the answer is showing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!id || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key === " " || e.key === "Enter") && !flipped) {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped) {
        const g = GRADES.find((x) => x.key === e.key);
        if (g) {
          e.preventDefault();
          grade(g);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (now === null) return <p className="text-center text-muted">Loading your cards…</p>;

  if (!id) {
    const remembered = tally.good + tally.easy;
    return (
      <div className="mx-auto max-w-xl space-y-5 rounded-2xl border border-line bg-surface p-8 text-center">
        {done > 0 ? (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-success">Session complete</p>
            <h2 className="text-3xl font-extrabold tabular-nums">{done} cards reviewed</h2>
            <div className="grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
              {GRADES.map((g) => (
                <div key={g.label} className={`rounded-xl border p-3 ${g.className}`}>
                  <p className="text-xs font-bold">{g.label}</p>
                  <p className="text-2xl font-extrabold tabular-nums">{tally[g.label.toLowerCase() as keyof Tally]}</p>
                </div>
              ))}
            </div>
            <p className="text-muted">
              You remembered {Math.round((remembered / done) * 100)}% easily.
              {tally.again > 0 && ` ${tally.again} card${tally.again === 1 ? "" : "s"} will come back soon for another go.`}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-extrabold">Nothing due right now</h2>
            <p className="text-muted">
              {tracked === 0
                ? "Cards appear here once you add a topic's beginner flashcards, open a lesson, or miss a practice question."
                : `You're tracking ${tracked} card${tracked === 1 ? "" : "s"}. Each comes back just before you'd forget it.`}
            </p>
          </>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center rounded-xl bg-accent px-5 font-bold text-accent-fg">
            Back to Today
          </Link>
          {tracked === 0 && (
            <Link href="/syllabus" className="inline-flex min-h-11 items-center rounded-xl border border-control-line px-5 font-semibold hover:border-accent">
              Pick a topic
            </Link>
          )}
        </div>
      </div>
    );
  }

  const item = deck[id];
  const kind = state[id].kind;
  const intervals = previewIntervals(state[id].card, new Date(now));
  // Session size = cards rated so far + cards still due ("Again" cards may come back within the session).
  const total = done + due.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-28 sm:pb-0">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted">
          <span className="tabular-nums">
            {done} of {total} · {due.length} left
          </span>
          <Link href={item.href ?? `/learn/${item.moduleSlug}`} className="hover:text-accent">
            {item.moduleTitle} →
          </Link>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Session progress">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-72 w-full flex-col justify-center gap-4 rounded-2xl border border-line bg-surface p-8 text-left hover:border-accent"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-muted">
          {flipped ? "Answer" : kind === "missed" ? "A question you missed" : "Question"}
        </span>
        {flipped ? (
          <RichText text={item.back} className="text-lg" />
        ) : (
          <>
            <span className="text-xl font-bold leading-snug">
              <InlineRich text={item.front} />
            </span>
            {item.options && (
              <ul className="space-y-1 text-base text-muted">
                {item.options.map((o) => (
                  <li key={o}>
                    <InlineRich text={o} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <span className="text-sm text-muted">
          {flipped ? "How well did you remember it?" : "Tap to reveal the answer"}
          <span className="hidden sm:inline"> · {flipped ? "keys 1–4" : "Space"}</span>
        </span>
      </button>

      {flipped && (
        // On phones the grade buttons stay in thumb reach at the bottom of the screen.
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
          <div className="mx-auto grid max-w-2xl grid-cols-4 gap-2">
            {GRADES.map((g) => (
              <button key={g.label} type="button" onClick={() => grade(g)} className={`min-h-14 rounded-xl border font-bold ${g.className}`}>
                {g.label}
                <span className="block text-xs font-medium opacity-80">
                  {intervals[g.grade]}
                  <span className="hidden sm:inline"> · {g.key}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

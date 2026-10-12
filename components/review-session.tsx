"use client";

import Link from "next/link";
import { useState } from "react";
import type { DeckItem } from "@/lib/content/deck";
import { dueIds, previewIntervals, rate, Rating, useNow, useReviewState } from "@/lib/store/review";
import { InlineRich, RichText } from "./rich-text";

const GRADES = [
  { grade: Rating.Again, label: "Again", className: "border-danger/40 bg-danger/8 text-danger" },
  { grade: Rating.Hard, label: "Hard", className: "border-warn/40 bg-warn/8 text-warn" },
  { grade: Rating.Good, label: "Good", className: "border-success/40 bg-success/8 text-success" },
  { grade: Rating.Easy, label: "Easy", className: "border-info/40 bg-info/8 text-info" },
] as const;

export function ReviewSession({ deck }: { deck: Record<string, DeckItem> }) {
  const state = useReviewState();
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  // Only items whose content still exists (e.g. not quarantined after a re-verify).
  const now = useNow();
  const due = dueIds(state, now).filter((id) => deck[id]);
  const id = due[0];
  const tracked = Object.keys(state).filter((k) => deck[k]).length;

  if (now === null) return <p className="text-center text-muted">Loading your cards…</p>;
  if (!id) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-line bg-surface p-8 text-center">
        <h2 className="text-xl font-extrabold">{done > 0 ? `Done: ${done} card${done === 1 ? "" : "s"} reviewed` : "Nothing due right now"}</h2>
        <p className="text-muted">
          {tracked === 0
            ? "Cards appear here once you open a lesson (its flashcards) or miss a practice question."
            : `You're tracking ${tracked} card${tracked === 1 ? "" : "s"}. Spaced repetition will bring each back just before you'd forget it.`}
        </p>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-xl bg-accent px-5 font-bold text-accent-fg">
          Back to Today
        </Link>
      </div>
    );
  }

  const item = deck[id];
  const kind = state[id].kind;
  const intervals = previewIntervals(state[id].card, new Date(now ?? 0));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {due.length} due · {done} done
        </span>
        <Link href={item.href ?? `/learn/${item.moduleSlug}`} className="hover:text-accent">
          {item.moduleTitle} →
        </Link>
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
        <span className="text-sm text-muted">{flipped ? "How well did you remember it?" : "Tap to reveal the answer"}</span>
      </button>

      {flipped && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRADES.map((g) => (
            <button
              key={g.label}
              type="button"
              onClick={() => {
                rate(id, g.grade);
                setFlipped(false);
                setDone((n) => n + 1);
              }}
              className={`min-h-14 rounded-xl border font-bold ${g.className}`}
            >
              {g.label}
              <span className="block text-xs font-medium opacity-80">{intervals[g.grade]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

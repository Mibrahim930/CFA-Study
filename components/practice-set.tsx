"use client";

import { useEffect, useState } from "react";
import type { Badge, ViewLesson } from "@/lib/content/generated";
import { enrol, markMissed } from "@/lib/store/review";
import { InlineRich } from "./rich-text";

const BADGE_TEXT: Record<Badge, string> = { grounded_verified: "Grounded + verified", verified: "Math verified", model_only: "AI-only" };
const LETTERS = "ABC";
const CONFIDENCE = ["Sure", "Think so", "Guess"] as const;
type Confidence = (typeof CONFIDENCE)[number];

/** One question at a time: pick an answer, say how sure you are, see why, then a short summary. */
export function PracticeSet({ losId, mcqs, flashcards }: Pick<ViewLesson, "losId" | "mcqs" | "flashcards">) {
  const [i, setI] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ id: string; correct: boolean; confidence: Confidence | null }[]>([]);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  // Opening a lesson puts its flashcards into the spaced-repetition deck.
  useEffect(() => enrol(flashcards.map((f) => `${losId}:${f.id}`), "flashcard"), [losId, flashcards]);

  const finished = mcqs.length > 0 && results.length === mcqs.length;
  const m = mcqs[i];

  const submit = () => {
    if (choice === null || !m) return;
    const correct = choice === m.answerIndex;
    if (!correct) markMissed(`${losId}:${m.id}`);
    setResults((r) => [...r, { id: m.id, correct, confidence }]);
    setSubmitted(true);
  };
  const next = () => {
    setI((n) => n + 1);
    setChoice(null);
    setConfidence(null);
    setSubmitted(false);
  };
  const restart = () => {
    setI(0);
    setChoice(null);
    setConfidence(null);
    setSubmitted(false);
    setResults([]);
  };

  const right = results.filter((r) => r.correct).length;
  const confidentWrong = results.filter((r) => !r.correct && r.confidence === "Sure").length;
  const luckyGuesses = results.filter((r) => r.correct && r.confidence === "Guess").length;

  return (
    <div className="space-y-8">
      {mcqs.length > 0 && (
        <section aria-label="Practice questions" className="space-y-4">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-lg font-bold">Practice</h3>
            <span className="text-sm text-muted tabular-nums">
              {finished ? `${right}/${mcqs.length} correct` : `Question ${i + 1} of ${mcqs.length}`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(results.length / mcqs.length) * 100}%` }} />
          </div>

          {finished ? (
            <div className="space-y-4 rounded-xl bg-surface-2 p-5">
              <p className="text-2xl font-extrabold tabular-nums">
                {right} of {mcqs.length} correct
              </p>
              <ul className="space-y-1.5 text-[0.9375rem]">
                {confidentWrong > 0 && (
                  <li>
                    <strong className="text-danger">{confidentWrong} confident mistake{confidentWrong === 1 ? "" : "s"}</strong>: you were sure but wrong. These are the most
                    useful to review.
                  </li>
                )}
                {luckyGuesses > 0 && (
                  <li>
                    <strong className="text-warn">{luckyGuesses} lucky guess{luckyGuesses === 1 ? "" : "es"}</strong>: right, but worth re-reading the explanation.
                  </li>
                )}
                {mcqs.length - right > 0 && <li>{mcqs.length - right} missed question{mcqs.length - right === 1 ? " was" : "s were"} added to your review deck.</li>}
              </ul>
              <button type="button" onClick={restart} className="min-h-11 rounded-xl border border-control-line bg-surface px-5 font-semibold hover:border-accent">
                Try again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[1.03125rem] leading-7">
                  <InlineRich text={m.stem} />
                </p>
                <span className="shrink-0 pt-1 text-xs text-muted">
                  {m.difficulty} · {BADGE_TEXT[m.badge]}
                </span>
              </div>
              <div
                className="space-y-2.5"
                role="radiogroup"
                aria-label="Answer options"
                // Arrow keys move between options, as in a native radio group.
                onKeyDown={(e) => {
                  const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
                  if (!step || submitted) return;
                  e.preventDefault();
                  const n = m.options.length;
                  const to = ((choice ?? (step > 0 ? -1 : 0)) + step + n) % n;
                  setChoice(to);
                  e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[to]?.focus();
                }}
              >
                {m.options.map((o, k) => {
                  const isKey = k === m.answerIndex;
                  const state = !submitted
                    ? choice === k
                      ? "border-2 border-accent bg-accent-soft"
                      : "border border-control-line hover:border-accent"
                    : isKey
                      ? "border-2 border-success bg-success/10"
                      : k === choice
                        ? "border-2 border-danger bg-danger/10"
                        : "border border-line opacity-60";
                  return (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={choice === k}
                      tabIndex={choice === k || (choice === null && k === 0) ? 0 : -1}
                      disabled={submitted}
                      onClick={() => setChoice(k)}
                      className={`flex min-h-13 w-full items-start gap-3 rounded-xl px-4 py-3 text-left ${state}`}
                    >
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold">{LETTERS[k]}</span>
                      <span className="flex-1">
                        <InlineRich text={o.text} />
                        {submitted && (isKey || k === choice) && (
                          <span className="mt-1.5 block text-sm text-muted">
                            <strong className={isKey ? "text-success" : "text-danger"}>{isKey ? "Correct. " : "Not quite. "}</strong>
                            <InlineRich text={o.explanation} />
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!submitted ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="How sure are you?">
                    <span className="font-semibold text-muted">How sure?</span>
                    {CONFIDENCE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={confidence === c}
                        onClick={() => setConfidence(c)}
                        className={`min-h-11 rounded-lg px-3.5 font-semibold ${confidence === c ? "bg-accent text-accent-fg" : "bg-surface-2 hover:bg-surface-3"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <button type="button" disabled={choice === null} onClick={submit} className="min-h-11 rounded-xl bg-accent px-6 font-bold text-accent-fg disabled:opacity-40">
                    Check answer
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button type="button" onClick={next} className="min-h-11 rounded-xl bg-accent px-6 font-bold text-accent-fg">
                    {i + 1 < mcqs.length ? "Next question →" : "See summary"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {flashcards.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-bold">Flashcards</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {flashcards.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setFlipped((f) => ({ ...f, [c.id]: !f[c.id] }))}
                  className="flex h-full min-h-24 w-full flex-col justify-between gap-2 rounded-xl border border-line bg-surface-2 p-4 text-left text-sm hover:border-accent"
                >
                  <span>
                    <InlineRich text={flipped[c.id] ? c.back : c.front} />
                  </span>
                  <span className="text-xs text-muted">{flipped[c.id] ? "answer · tap to flip back" : "tap to reveal"}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

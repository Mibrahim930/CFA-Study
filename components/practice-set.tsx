"use client";

import { useEffect, useState } from "react";
import type { Badge, ViewLesson } from "@/lib/content/generated";
import { recordPractice, usePractice } from "@/lib/store/practice";
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
  const history = usePractice()[losId];
  // Opening a lesson puts its flashcards into the spaced-repetition deck.
  useEffect(() => enrol(flashcards.map((f) => `${losId}:${f.id}`), "flashcard"), [losId, flashcards]);

  const finished = mcqs.length > 0 && results.length === mcqs.length;
  const m = mcqs[i];

  const submit = () => {
    if (choice === null || !m) return;
    const correct = choice === m.answerIndex;
    if (!correct) markMissed(`${losId}:${m.id}`);
    const nextResults = [...results, { id: m.id, correct, confidence }];
    // The finished set is what the mastery labels are built from.
    if (nextResults.length === mcqs.length) recordPractice(losId, nextResults.filter((r) => r.correct).length, mcqs.length);
    setResults(nextResults);
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
            <h3 className="caps text-muted">Practice</h3>
            <span className="display text-[1.75rem] tabular-nums">
              {finished ? right : i + 1}
              <span className="text-sm font-bold tracking-normal text-muted">/{mcqs.length}{finished ? " correct" : ""}</span>
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-[2px] bg-surface-3" aria-hidden="true">
            <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${(results.length / mcqs.length) * 100}%` }} />
          </div>

          {finished ? (
            <div className="space-y-4 rounded-control bg-surface-2 p-5">
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
                {history && (
                  <li className="text-muted">
                    Attempt {history.attempts} · best {Math.round(history.best * 100)}%. A module is solid once it is marked complete and its latest scores average 80% or
                    more.
                  </li>
                )}
              </ul>
              <button type="button" onClick={restart} className="min-h-11 rounded-control border border-control-line bg-surface px-5 font-semibold hover:border-accent">
                Try again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-serif text-[1.25rem] leading-[1.4]">
                  <InlineRich text={m.stem} />
                </p>
                <span className={`caps shrink-0 pt-1.5 ${m.badge === "model_only" ? "text-warn" : m.badge === "verified" ? "text-info" : "text-success"}`}>
                  {m.difficulty} · {BADGE_TEXT[m.badge]}
                </span>
              </div>
              <div
                className="rule-t"
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
                      ? "bg-accent-soft"
                      : "hover:bg-surface-2"
                    : isKey
                      ? "bg-success/10"
                      : k === choice
                        ? "bg-danger/10"
                        : "opacity-60";
                  const letter = !submitted ? (choice === k ? "text-accent" : "") : isKey ? "text-success" : k === choice ? "text-danger" : "text-muted";
                  return (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={choice === k}
                      tabIndex={choice === k || (choice === null && k === 0) ? 0 : -1}
                      disabled={submitted}
                      onClick={() => setChoice(k)}
                      className={`grid min-h-15 w-full grid-cols-[44px_1fr] items-center gap-3 border-b border-line px-2 py-3 text-left ${state}`}
                    >
                      <span className={`display text-[1.75rem] ${letter}`} aria-hidden="true">{LETTERS[k]}</span>
                      <span className="sr-only">Option {LETTERS[k]}: </span>
                      <span className="flex-1 text-[1.0625rem] font-medium">
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
                    <span className="caps text-muted">How sure?</span>
                    {CONFIDENCE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={confidence === c}
                        onClick={() => setConfidence(c)}
                        className={`min-h-11 rounded-full border-[1.5px] px-4 font-extrabold ${confidence === c ? "border-accent bg-accent text-accent-fg" : "border-rule bg-transparent hover:bg-surface-2"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <button type="button" disabled={choice === null} onClick={submit} className="min-h-11 rounded-control bg-accent px-6 font-bold text-accent-fg disabled:opacity-40">
                    Check answer
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button type="button" onClick={next} className="min-h-11 rounded-control bg-accent px-6 font-bold text-accent-fg">
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
          <h3 className="caps text-muted">Flashcards</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {flashcards.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setFlipped((f) => ({ ...f, [c.id]: !f[c.id] }))}
                  className="flex h-full min-h-24 w-full flex-col justify-between gap-2 rounded-control border border-line bg-surface-2 p-4 text-left text-sm hover:border-accent"
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

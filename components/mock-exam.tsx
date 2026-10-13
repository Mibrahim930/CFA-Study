"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { DeckItem } from "@/lib/content/deck";
import { markMissed } from "@/lib/store/review";
import { InlineRich, RichText } from "./rich-text";

// Exam pace: 90 questions in 135 minutes = 1.5 minutes per question.
const SECONDS_PER_QUESTION = 90;
const SIZES = [10, 30, 90];

type Q = DeckItem & { id: string; options: string[]; answer: number };

/** Seconds clock, browser-only (null while prerendering). */
function useClock(): number | null {
  return useSyncExternalStore(
    (cb) => {
      const t = setInterval(cb, 1000);
      return () => clearInterval(t);
    },
    () => Math.floor(Date.now() / 1000),
    () => null,
  );
}

const fmt = (s: number) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function MockExam({ deck, topicNames }: { deck: Record<string, DeckItem>; topicNames: Record<string, string> }) {
  const pool: Q[] = Object.entries(deck)
    .filter(([, d]) => d.options && d.answer !== undefined)
    .map(([id, d]) => ({ ...d, id, options: d.options!, answer: d.answer! }));
  const [qs, setQs] = useState<Q[] | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);
  // Submitting ends the exam and can't be undone, so it takes a second, explicit tap.
  const [confirming, setConfirming] = useState(false);
  const now = useClock();

  const start = (n: number) => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
    setQs(shuffled);
    setStartedAt(Math.floor(Date.now() / 1000));
    setI(0);
    setAnswers({});
    setFlags({});
    setFinished(false);
    setConfirming(false);
  };

  if (!qs) {
    const topics = new Set(pool.map((q) => q.topicId));
    return (
      <div className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-line bg-surface p-8">
        <h2 className="text-xl font-extrabold">Start a timed practice exam</h2>
        <p className="text-muted">
          {pool.length} verified questions available from {topics.size} topic{topics.size === 1 ? "" : "s"}. Pace is the real exam&apos;s: 1.5 minutes
          per question. Once more topics are generated, full mocks follow the official topic weights.
        </p>
        <div className="flex flex-wrap gap-3">
          {SIZES.map((n) => (
            <button
              key={n}
              type="button"
              disabled={pool.length === 0}
              onClick={() => start(Math.min(n, pool.length))}
              className="min-h-11 rounded-xl border border-control-line px-5 font-bold hover:border-accent disabled:opacity-50"
            >
              {Math.min(n, pool.length)} questions · {Math.round((Math.min(n, pool.length) * SECONDS_PER_QUESTION) / 60)} min
            </button>
          ))}
        </div>
      </div>
    );
  }

  const limit = qs.length * SECONDS_PER_QUESTION;
  const elapsed = now === null ? 0 : now - startedAt;
  const left = Math.max(0, limit - elapsed);
  const over = finished || left === 0;

  if (over) {
    const byTopic: Record<string, { right: number; total: number }> = {};
    for (const q of qs) {
      const t = (byTopic[q.topicId] ??= { right: 0, total: 0 });
      t.total++;
      if (answers[q.id] === q.answer) t.right++;
    }
    const right = qs.filter((q) => answers[q.id] === q.answer).length;
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2 rounded-2xl bg-accent p-7 text-accent-fg">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Result</p>
          <p className="text-4xl font-extrabold tabular-nums">
            {right}/{qs.length} · {Math.round((right / qs.length) * 100)}%
          </p>
          <p className="opacity-90">Time used {fmt(Math.min(elapsed, limit))} of {fmt(limit)}. Missed questions were added to your review deck.</p>
        </div>
        <ul className="space-y-2">
          {Object.entries(byTopic).map(([t, s]) => (
            <li key={t} className="flex justify-between rounded-xl border border-line bg-surface px-4 py-3">
              <span>{topicNames[t] ?? t}</span>
              <span className="font-bold tabular-nums">
                {s.right}/{s.total}
              </span>
            </li>
          ))}
        </ul>
        <ol className="space-y-3">
          {qs.map((q, n) => {
            const ok = answers[q.id] === q.answer;
            return (
              <li key={q.id} className={`space-y-2 rounded-xl border p-4 ${ok ? "border-success/40" : "border-danger/40"}`}>
                <p className="text-sm">
                  <span className="mr-1 font-bold">{n + 1}.</span>
                  <InlineRich text={q.front} />
                </p>
                <p className="text-sm text-muted">
                  Your answer: {answers[q.id] === undefined ? "none" : "ABC"[answers[q.id]]} · {ok ? "correct" : "incorrect"}
                </p>
                {!ok && <RichText text={q.back} className="text-sm" />}
              </li>
            );
          })}
        </ol>
        <div className="flex gap-3">
          <button type="button" onClick={() => setQs(null)} className="min-h-11 rounded-xl bg-accent px-5 font-bold text-accent-fg">
            New exam
          </button>
          <Link href="/review" className="inline-flex min-h-11 items-center rounded-xl border border-control-line px-5 font-semibold hover:border-accent">
            Review missed
          </Link>
        </div>
      </div>
    );
  }

  const q = qs[i];
  const submit = () => {
    for (const x of qs) if (answers[x.id] !== x.answer) markMissed(x.id);
    setFinished(true);
  };
  const unanswered = qs.filter((x) => answers[x.id] === undefined).length;
  const flagged = qs.filter((x) => flags[x.id]).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="font-bold">
          Question {i + 1} of {qs.length}
        </span>
        <div className="flex items-center gap-3">
          <span aria-label="Time left" className={`rounded-lg px-3 py-1.5 font-mono text-lg ${left < 300 ? "bg-warn/12 text-warn" : "bg-surface-2"}`}>
            {fmt(left)}
          </span>
          <button
            type="button"
            aria-pressed={!!flags[q.id]}
            onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}
            className={`min-h-11 rounded-lg border px-3 text-sm font-semibold ${flags[q.id] ? "border-warn bg-warn/10 text-warn" : "border-control-line"}`}
          >
            {flags[q.id] ? "Flagged" : "Flag for review"}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap">
        <div className="min-w-0 flex-[999_1_520px] space-y-5 p-6 sm:p-8">
          <p className="text-lg leading-relaxed">
            <InlineRich text={q.front} />
          </p>
          <div className="space-y-2.5">
            {q.options.map((o, k) => (
              <button
                key={k}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: k }))}
                className={`block min-h-13 w-full rounded-xl px-4 py-3 text-left ${answers[q.id] === k ? "border-2 border-accent bg-accent-soft" : "border border-control-line hover:border-accent"}`}
              >
                <InlineRich text={o} />
              </button>
            ))}
          </div>
          {confirming ? (
            <div role="alertdialog" aria-labelledby="submit-title" aria-describedby="submit-detail" className="space-y-3 rounded-xl border-2 border-accent bg-accent-soft p-4">
              <p id="submit-title" className="font-bold">
                Submit the exam?
              </p>
              <p id="submit-detail" className="text-sm">
                {unanswered > 0 ? `${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered` : "Every question has an answer"}
                {flagged > 0 && ` and ${flagged} ${flagged === 1 ? "is" : "are"} flagged for review`}. You can&apos;t change answers after you submit.
              </p>
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" autoFocus onClick={() => setConfirming(false)} className="min-h-11 rounded-xl border border-control-line bg-surface px-4 font-semibold hover:border-accent">
                  Keep working
                </button>
                <button type="button" onClick={submit} className="min-h-11 rounded-xl bg-accent px-5 font-bold text-accent-fg">
                  Submit exam
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="min-h-11 rounded-xl border border-control-line px-4 font-semibold disabled:opacity-40">
                ← Previous
              </button>
              {i < qs.length - 1 ? (
                <button type="button" onClick={() => setI(i + 1)} className="min-h-11 rounded-xl bg-accent px-5 font-bold text-accent-fg">
                  Next →
                </button>
              ) : (
                <button type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-xl bg-accent px-5 font-bold text-accent-fg">
                  Submit exam…
                </button>
              )}
            </div>
          )}
        </div>
        <aside className="min-w-0 flex-[1_1_220px] space-y-3 border-t border-line bg-surface-2/50 p-5 sm:border-l sm:border-t-0">
          <p className="text-sm font-bold">Questions</p>
          <div className="grid grid-cols-6 gap-1.5">
            {qs.map((x, n) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setI(n)}
                aria-label={`Question ${n + 1}${flags[x.id] ? ", flagged" : ""}${answers[x.id] !== undefined ? ", answered" : ""}`}
                className={`h-11 rounded-md text-xs font-semibold sm:h-9 ${n === i ? "outline-2 outline-foreground" : ""} ${flags[x.id] ? "bg-warn text-warn-fg" : answers[x.id] !== undefined ? "bg-accent text-accent-fg" : "border border-control-line"}`}
              >
                {n + 1}
                {flags[x.id] && <span aria-hidden="true">⚑</span>}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setConfirming(true)} className="min-h-11 w-full text-sm font-semibold text-accent hover:underline">
            Submit now…
          </button>
        </aside>
      </div>
    </div>
  );
}

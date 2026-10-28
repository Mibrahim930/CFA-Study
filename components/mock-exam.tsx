"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { DeckItem } from "@/lib/content/deck";
import { saveMock, updateMock, useMockSession, type MockSession } from "@/lib/store/mock";
import { markMissed } from "@/lib/store/review";
import { InlineRich, RichText } from "./rich-text";

// Exam pace: 90 questions in 135 minutes = 1.5 minutes per question.
const SECONDS_PER_QUESTION = 90;
const SIZES = [10, 30, 90];

type Q = DeckItem & { id: string; options: string[]; answer: number };
type Filter = "all" | "incorrect" | "flagged" | "unanswered";

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

/** Current time in unix seconds (event handlers only; render reads useClock). */
const nowSeconds = () => Math.floor(Date.now() / 1000);

/** Ends the exam once: missed and unanswered questions go to the review deck. */
function finish(s: MockSession, byId: Record<string, Q>, at: number) {
  for (const id of s.ids) if (byId[id] && s.answers[id] !== byId[id].answer) markMissed(id);
  saveMock({ ...s, finished: true, finishedAt: at });
}

export function MockExam({ deck, topicNames }: { deck: Record<string, DeckItem>; topicNames: Record<string, string> }) {
  const pool: Q[] = Object.entries(deck)
    .filter(([, d]) => d.options && d.answer !== undefined)
    .map(([id, d]) => ({ ...d, id, options: d.options!, answer: d.answer! }));
  const byId = Object.fromEntries(pool.map((q) => [q.id, q]));
  const session = useMockSession();
  const now = useClock();
  // Submitting ends the exam and can't be undone, so it takes a second, explicit tap.
  const [confirming, setConfirming] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  // Questions removed from the app since the exam started are skipped.
  const qs = session ? session.ids.map((id) => byId[id]).filter(Boolean) : [];
  const limit = qs.length * SECONDS_PER_QUESTION;
  const elapsed = session && now !== null ? (session.finishedAt ?? now) - session.startedAt : 0;
  const left = Math.max(0, limit - elapsed);
  const timedOut = !!session && !session.finished && now !== null && left === 0;

  // The clock ran out (possibly while the page was closed): finish the exam as the real one would.
  useEffect(() => {
    if (timedOut && session && now !== null) finish(session, byId, session.startedAt + limit);
  });

  const start = (questions: Q[]) => {
    setConfirming(false);
    setFilter("all");
    saveMock({ ids: questions.map((q) => q.id), startedAt: nowSeconds(), i: 0, answers: {}, flags: {}, finished: false });
  };
  const startRandom = (n: number) => start([...pool].sort(() => Math.random() - 0.5).slice(0, n));

  if (session === undefined) return <p className="text-center text-muted">Loading…</p>;

  if (!session || qs.length === 0) {
    const topics = new Set(pool.map((q) => q.topicId));
    return (
      <div className="mx-auto max-w-2xl space-y-5 rounded-tile border border-line bg-surface p-8">
        <h2 className="text-xl font-extrabold">Start a timed practice exam</h2>
        <p className="text-muted">
          {pool.length} verified questions available from {topics.size} topic{topics.size === 1 ? "" : "s"}. Pace is the real exam&apos;s: 1.5 minutes
          per question. Your exam is saved as you go, and the clock keeps running if you leave, as it would on exam day.
        </p>
        <div className="flex flex-wrap gap-3">
          {SIZES.map((n) => (
            <button
              key={n}
              type="button"
              disabled={pool.length === 0}
              onClick={() => startRandom(Math.min(n, pool.length))}
              className="min-h-11 rounded-control border border-control-line px-5 font-bold hover:border-accent disabled:opacity-50"
            >
              {Math.min(n, pool.length)} questions · {Math.round((Math.min(n, pool.length) * SECONDS_PER_QUESTION) / 60)} min
            </button>
          ))}
        </div>
      </div>
    );
  }

  const { answers, flags } = session;

  if (session.finished || timedOut) {
    const byTopic: Record<string, { right: number; total: number }> = {};
    for (const q of qs) {
      const t = (byTopic[q.topicId] ??= { right: 0, total: 0 });
      t.total++;
      if (answers[q.id] === q.answer) t.right++;
    }
    const right = qs.filter((q) => answers[q.id] === q.answer).length;
    const missed = qs.filter((q) => answers[q.id] !== q.answer);
    const matches: Record<Filter, (q: Q) => boolean> = {
      all: () => true,
      incorrect: (q) => answers[q.id] !== undefined && answers[q.id] !== q.answer,
      flagged: (q) => !!flags[q.id],
      unanswered: (q) => answers[q.id] === undefined,
    };
    const labels: Record<Filter, string> = { all: "All", incorrect: "Incorrect", flagged: "Flagged", unanswered: "Unanswered" };
    const shown = qs.map((q, n) => ({ q, n })).filter(({ q }) => matches[filter](q));
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-rule pb-4">
          <div>
            <p className="display text-[5.25rem]" style={{ fontStretch: "90%" }}>
              {Math.round((right / qs.length) * 100)}
              <span className="text-[2.25rem] font-bold tracking-normal">%</span>
            </p>
            <p className="caps mt-0.5 text-muted">
              {right} of {qs.length} correct
            </p>
          </div>
          <p className="max-w-xs text-[0.8125rem] text-muted sm:text-right">
            Time used <strong className="text-foreground">{fmt(Math.min(elapsed, limit))}</strong> of {fmt(limit)}
            {elapsed >= limit ? " (time ran out)" : ""}. Missed questions were added to your review deck.
          </p>
        </div>
        <ul aria-label="Score by topic">
          {Object.entries(byTopic)
            .sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total)
            .map(([t, s]) => {
              const share = s.right / s.total;
              const tone = share >= 0.7 ? "bg-success" : share >= 0.5 ? "bg-warn" : "bg-danger";
              return (
                <li key={t} className="grid min-h-11 grid-cols-[minmax(0,1fr)_72px_48px] items-center gap-3 border-b border-line text-[0.9375rem] last:border-b-0">
                  <span className="truncate font-bold">{topicNames[t] ?? t}</span>
                  <span className="flex h-2.5 overflow-hidden rounded-[3px] bg-surface-3" role="img" aria-label={`${s.right} of ${s.total}`}>
                    <span className={tone} style={{ width: `${share * 100}%` }} />
                  </span>
                  <span className="text-right font-extrabold tabular-nums">
                    {s.right}/{s.total}
                  </span>
                </li>
              );
            })}
        </ul>

        <div className="flex flex-wrap gap-3">
          {missed.length > 0 && (
            <button type="button" onClick={() => start(missed)} className="min-h-11 rounded-control bg-accent px-5 font-bold text-accent-fg">
              Retry the {missed.length} you missed
            </button>
          )}
          <button type="button" onClick={() => saveMock(null)} className="min-h-11 rounded-control border border-control-line px-5 font-semibold hover:border-accent">
            New exam
          </button>
          <Link href="/review" className="inline-flex min-h-11 items-center rounded-control border border-control-line px-5 font-semibold hover:border-accent">
            Review missed as flashcards
          </Link>
        </div>

        <section aria-labelledby="answers-heading" className="space-y-3">
          <h2 id="answers-heading" className="caps text-muted">
            Your answers
          </h2>
          <div role="group" aria-label="Show questions" className="flex flex-wrap gap-2 text-sm">
            {(Object.keys(labels) as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`caps min-h-9 rounded-full border-[1.5px] px-3.5 ${filter === f ? "border-rule bg-rule text-background" : "border-rule bg-transparent hover:bg-surface-2"}`}
              >
                {labels[f]} <span className="tabular-nums opacity-80">{qs.filter(matches[f]).length}</span>
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="rounded-control bg-surface-2 p-4 text-muted">No {labels[filter].toLowerCase()} questions in this exam.</p>
          ) : (
            <ol className="space-y-3">
              {shown.map(({ q, n }) => {
                const ok = answers[q.id] === q.answer;
                return (
                  <li key={q.id} className={`space-y-2 rounded-control border p-4 ${ok ? "border-success/40" : "border-danger/40"}`}>
                    <p className="text-sm">
                      <span className="mr-1 font-bold">{n + 1}.</span>
                      <InlineRich text={q.front} />
                    </p>
                    <p className="text-sm text-muted">
                      Your answer: {answers[q.id] === undefined ? "none" : "ABC"[answers[q.id]]} · {ok ? "correct" : "incorrect"}
                      {flags[q.id] ? " · flagged" : ""}
                    </p>
                    {!ok && <RichText text={q.back} className="text-sm" />}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    );
  }

  const i = Math.min(session.i, qs.length - 1);
  const q = qs[i];
  const go = (n: number) => updateMock((s) => ({ ...s, i: n }));
  const unanswered = qs.filter((x) => answers[x.id] === undefined).length;
  const flagged = qs.filter((x) => flags[x.id]).length;

  return (
    <div className="overflow-hidden rounded-tile border border-line bg-surface">
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
            onClick={() => updateMock((s) => ({ ...s, flags: { ...s.flags, [q.id]: !s.flags[q.id] } }))}
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
                onClick={() => updateMock((s) => ({ ...s, answers: { ...s.answers, [q.id]: k } }))}
                className={`block min-h-13 w-full rounded-control px-4 py-3 text-left ${answers[q.id] === k ? "border-2 border-accent bg-accent-soft" : "border border-control-line hover:border-accent"}`}
              >
                <InlineRich text={o} />
              </button>
            ))}
          </div>
          {confirming ? (
            <div role="alertdialog" aria-labelledby="submit-title" aria-describedby="submit-detail" className="space-y-3 rounded-control border-2 border-accent bg-accent-soft p-4">
              <p id="submit-title" className="font-bold">
                Submit the exam?
              </p>
              <p id="submit-detail" className="text-sm">
                {unanswered > 0 ? `${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered` : "Every question has an answer"}
                {flagged > 0 && ` and ${flagged} ${flagged === 1 ? "is" : "are"} flagged for review`}. You can&apos;t change answers after you submit.
              </p>
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" autoFocus onClick={() => setConfirming(false)} className="min-h-11 rounded-control border border-control-line bg-surface px-4 font-semibold hover:border-accent">
                  Keep working
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false);
                    finish(session, byId, nowSeconds());
                  }}
                  className="min-h-11 rounded-control bg-accent px-5 font-bold text-accent-fg"
                >
                  Submit exam
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <button type="button" disabled={i === 0} onClick={() => go(i - 1)} className="min-h-11 rounded-control border border-control-line px-4 font-semibold disabled:opacity-40">
                ← Previous
              </button>
              {i < qs.length - 1 ? (
                <button type="button" onClick={() => go(i + 1)} className="min-h-11 rounded-control bg-accent px-5 font-bold text-accent-fg">
                  Next →
                </button>
              ) : (
                <button type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-control bg-accent px-5 font-bold text-accent-fg">
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
                onClick={() => go(n)}
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

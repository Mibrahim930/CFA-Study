"use client";

import { useState } from "react";
import type { Primer } from "@/lib/content/primers";
import { enrol, useReviewState } from "@/lib/store/review";
import { BadgeChip } from "./lesson-view";
import { InlineRich, RichText } from "./rich-text";

const cardId = (topicId: string, id: string) => `primer:${topicId}:${id}`;

export function TopicPrimer({ primer, topicName }: { primer: Primer; topicName: string }) {
  const review = useReviewState();
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [showAllTerms, setShowAllTerms] = useState(false);
  const ids = primer.cards.map((c) => cardId(primer.topicId, c.id));
  const enrolled = ids.filter((id) => review[id]).length;
  const terms = showAllTerms ? primer.terms : primer.terms.slice(0, 8);

  return (
    <section aria-labelledby="primer-heading" className="space-y-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Start here · no finance background needed</p>
        <h2 id="primer-heading" className="text-2xl font-extrabold tracking-tight">
          A beginner&apos;s guide to {topicName}
        </h2>
      </div>

      <RichText text={primer.overview} className="max-w-[70ch] text-[16.5px] leading-7" />
      <p className="max-w-[70ch] rounded-xl bg-accent-soft p-4 text-[15px]">
        <strong>Why it matters: </strong>
        <InlineRich text={primer.whyItMatters} />
      </p>

      <div className="space-y-2">
        <h3 className="text-lg font-bold">Before you start</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
          {primer.prerequisites.map((p) => (
            <li key={p}>
              <InlineRich text={p} />
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold">Key terms</h3>
        <dl className="grid gap-3 md:grid-cols-2">
          {terms.map((t) => (
            <div key={t.id} className="space-y-1.5 rounded-xl border border-line p-4">
              <dt className="flex items-start justify-between gap-2 font-bold">
                <span>{t.term}</span>
                <BadgeChip badge={t.badge} />
              </dt>
              <dd className="text-[15px] leading-6">
                <InlineRich text={t.definition} />
              </dd>
              <dd className="rounded-lg bg-surface-2 p-2.5 text-sm text-muted">
                <span className="font-semibold text-foreground">Example: </span>
                <InlineRich text={t.example} />
              </dd>
            </div>
          ))}
        </dl>
        {primer.terms.length > 8 && (
          <button type="button" onClick={() => setShowAllTerms((v) => !v)} className="text-sm font-semibold text-accent hover:underline">
            {showAllTerms ? "Show fewer terms" : `Show all ${primer.terms.length} terms`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold">Beginner flashcards</h3>
          <button
            type="button"
            disabled={enrolled === ids.length}
            onClick={() => enrol(ids, "flashcard")}
            className="min-h-10 rounded-xl bg-accent px-4 text-sm font-bold text-accent-fg disabled:bg-success/12 disabled:text-success"
          >
            {enrolled === ids.length ? `✓ All ${ids.length} in your review deck` : `Add all ${ids.length} to my review deck`}
          </button>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {primer.cards.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setFlipped((f) => ({ ...f, [c.id]: !f[c.id] }))}
                className="flex h-full min-h-28 w-full flex-col justify-between gap-2 rounded-xl border border-line bg-surface-2 p-4 text-left text-[15px] hover:border-accent"
              >
                <span>
                  <InlineRich text={flipped[c.id] ? c.back : c.front} />
                </span>
                <span className="text-xs text-muted">{flipped[c.id] ? "answer · tap to flip back" : "tap to reveal"}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold">How to study this topic</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
          {primer.studyTips.map((t) => (
            <li key={t}>
              <InlineRich text={t} />
            </li>
          ))}
        </ul>
      </div>

      {primer.sources.length > 0 && (
        <details className="text-sm text-muted">
          <summary className="cursor-pointer font-semibold">Sources ({primer.sources.length})</summary>
          <ul className="mt-2 space-y-1">
            {primer.sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {s.title}, {s.locator} ↗
                </a>{" "}
                · {s.license}
              </li>
            ))}
          </ul>
          <p className="mt-2">Written in plain language by {primer.model}, then checked against these sources by a second reviewer.</p>
        </details>
      )}
    </section>
  );
}

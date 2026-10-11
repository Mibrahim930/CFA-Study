"use client";

import { useState } from "react";
import type { Badge, ViewLesson } from "@/lib/content/generated";
import { InlineRich } from "./rich-text";

const BADGE_TEXT: Record<Badge, string> = { grounded_verified: "Grounded + verified", verified: "Math verified", model_only: "AI-only" };
const LETTERS = "ABC";

export function PracticeSet({ mcqs, flashcards }: Pick<ViewLesson, "mcqs" | "flashcards">) {
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const answered = mcqs.filter((m) => picked[m.id] !== undefined);
  const correct = answered.filter((m) => picked[m.id] === m.answerIndex).length;

  return (
    <div className="space-y-6">
      {mcqs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-medium">Practice questions</h3>
            <span className="text-sm text-muted tabular-nums">
              {correct}/{answered.length} correct · {mcqs.length} total
            </span>
          </div>
          <ol className="space-y-4">
            {mcqs.map((m, qi) => {
              const choice = picked[m.id];
              const done = choice !== undefined;
              return (
                <li key={m.id} className="space-y-2 rounded-md border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm">
                      <span className="mr-1 text-muted tabular-nums">{qi + 1}.</span>
                      <InlineRich text={m.stem} />
                    </p>
                    <span className="shrink-0 text-xs text-muted">
                      {m.difficulty} · {BADGE_TEXT[m.badge]}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {m.options.map((o, i) => {
                      const isKey = i === m.answerIndex;
                      const state = !done ? "border-line hover:border-accent" : isKey ? "border-success bg-success/10" : i === choice ? "border-danger bg-danger/10" : "border-line opacity-70";
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={done}
                          onClick={() => setPicked((p) => ({ ...p, [m.id]: i }))}
                          className={`block w-full rounded-md border px-3 py-2 text-left text-sm ${state}`}
                        >
                          <span className="mr-2 font-medium">{LETTERS[i]}.</span>
                          <InlineRich text={o.text} />
                          {done && (isKey || i === choice) && (
                            <span className="mt-1 block text-xs text-muted">
                              <InlineRich text={o.explanation} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {done && (
                    <button
                      type="button"
                      onClick={() =>
                        setPicked((p) => {
                          const next = { ...p };
                          delete next[m.id];
                          return next;
                        })
                      }
                      className="text-xs text-muted underline hover:text-foreground"
                    >
                      try again
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {flashcards.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-medium">Flashcards</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {flashcards.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setFlipped((f) => ({ ...f, [c.id]: !f[c.id] }))}
                  className="flex h-full min-h-24 w-full flex-col justify-between gap-2 rounded-md border border-line bg-surface-2 p-3 text-left text-sm hover:border-accent"
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

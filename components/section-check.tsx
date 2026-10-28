"use client";

import { useState } from "react";
import { markMissed } from "@/lib/store/review";
import { InlineRich } from "./rich-text";

/**
 * A one-card "check yourself" after a lesson section. Reveal the answer, then say whether you had it:
 * "Not yet" makes the card due now in the review deck (lesson flashcards are already enrolled when the
 * lesson opens), so a shaky section comes back the same day.
 */
export function SectionCheck({ reviewId, front, back }: { reviewId: string; front: string; back: string }) {
  const [state, setState] = useState<"hidden" | "shown" | "got" | "missed">("hidden");
  const revealed = state !== "hidden";
  return (
    <aside aria-label="Check yourself" className="space-y-3 rounded-control border-l-4 border-accent bg-accent-soft/60 px-4 py-3.5 text-[0.9375rem] leading-6">
      <p className="caps text-accent">Check yourself</p>
      <p className="font-semibold">
        <InlineRich text={front} />
      </p>
      {revealed && (
        <p className="border-t border-line pt-3">
          <InlineRich text={back} />
        </p>
      )}
      {state === "hidden" && (
        <button type="button" onClick={() => setState("shown")} className="min-h-11 rounded-control border border-control-line bg-surface px-4 text-sm font-bold hover:border-accent">
          Show answer
        </button>
      )}
      {state === "shown" && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Did you have it?">
          <button type="button" onClick={() => setState("got")} className="min-h-11 rounded-control bg-accent px-4 text-sm font-bold text-accent-fg hover:brightness-110">
            Got it
          </button>
          <button
            type="button"
            onClick={() => {
              markMissed(reviewId);
              setState("missed");
            }}
            className="min-h-11 rounded-control border border-control-line bg-surface px-4 text-sm font-bold hover:border-accent"
          >
            Not yet
          </button>
        </div>
      )}
      {state === "got" && <p className="text-sm font-semibold text-success">Good. Carry on.</p>}
      {state === "missed" && <p className="text-sm font-semibold text-warn">Added to today&apos;s review cards.</p>}
    </aside>
  );
}

"use client";

import { useMasteryMap } from "@/lib/store/local";

/** Modules solid (dark) and in progress (light) over the topic's modules, in the ledger's mastery colours. */
export function ProgressBar({ slugs }: { slugs: string[] }) {
  const mastery = useMasteryMap(slugs);
  const solid = slugs.filter((s) => mastery[s] === 3).length;
  const learning = slugs.filter((s) => mastery[s] > 0 && mastery[s] !== 3).length;
  const n = slugs.length || 1;
  return (
    <div className="flex items-center gap-2.5 text-xs text-muted">
      <div className="flex h-2.5 flex-1 overflow-hidden rounded-[3px] bg-mastery-0" role="img" aria-label={`${solid} of ${slugs.length} modules solid, ${learning} in progress`}>
        <div className="h-full bg-mastery-3 transition-[width] duration-300" style={{ width: `${(solid / n) * 100}%` }} />
        <div className="h-full bg-mastery-1 transition-[width] duration-300" style={{ width: `${(learning / n) * 100}%` }} />
      </div>
      <span className="w-10 text-right font-bold tabular-nums">
        {solid}/{slugs.length}
      </span>
    </div>
  );
}

export function DoneMark({ slug }: { slug: string }) {
  const done = useMasteryMap([slug])[slug] === 3;
  return done ? (
    <span className="text-success" aria-label="complete">
      ✓
    </span>
  ) : null;
}

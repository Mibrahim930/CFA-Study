"use client";

import { useDoneMap } from "@/lib/store/local";

export function ProgressBar({ slugs }: { slugs: string[] }) {
  const done = useDoneMap(slugs);
  const n = slugs.filter((s) => done[s]).length;
  const pct = slugs.length ? Math.round((n / slugs.length) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums">
        {n}/{slugs.length}
      </span>
    </div>
  );
}

export function DoneMark({ slug }: { slug: string }) {
  const done = useDoneMap([slug])[slug];
  return done ? (
    <span className="text-success" aria-label="complete">
      ✓
    </span>
  ) : null;
}

import type { TopicProgress } from "@/lib/progress";

/**
 * The signature: one strip whose segments are the official exam weights, filling as each topic becomes yours.
 * Darkest fill = modules solid; mid = practised; lightest = learning; the track = not started.
 */
export function LedgerBar({ progress, height = 14, className = "" }: { progress: TopicProgress[]; height?: number; className?: string }) {
  const label = progress
    .map((t) => `${t.name} ${Math.round(t.points)}% of the exam: ${t.solid} of ${t.moduleSlugs.length} modules solid, ${t.practised} practised`)
    .join("; ");
  return (
    <div role="img" aria-label={`Exam weight secured by topic. ${label}`} className={`flex gap-[3px] ${className}`} style={{ height }}>
      {progress.map((t) => (
        <span key={t.id} className="flex overflow-hidden rounded-[4px] bg-mastery-0" style={{ flex: t.points }} title={`${t.name} · ${t.weight.min}–${t.weight.max}%`}>
          <span className="h-full bg-mastery-3 transition-[width] duration-300" style={{ width: `${t.solidShare * 100}%` }} />
          <span className="h-full bg-mastery-2 transition-[width] duration-300" style={{ width: `${t.practisedShare * 100}%` }} />
          <span className="h-full bg-mastery-1 transition-[width] duration-300" style={{ width: `${t.learningShare * 100}%` }} />
        </span>
      ))}
    </div>
  );
}

export function LedgerLegend({ className = "" }: { className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block h-2 w-3 rounded-[2px] bg-mastery-3" />
        Solid
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block h-2 w-3 rounded-[2px] bg-mastery-2" />
        Practised
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block h-2 w-3 rounded-[2px] bg-mastery-1" />
        Learning
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block h-2 w-3 rounded-[2px] bg-mastery-0" />
        Not started
      </span>
    </p>
  );
}

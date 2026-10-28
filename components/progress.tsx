"use client";

import { MASTERY_LABEL, type Mastery } from "@/lib/progress";
import { useMasteryMap, type ModuleRef } from "@/lib/store/local";

/** Modules solid (dark), practised (mid) and learning (light) over the topic's modules, in the ledger's mastery colours. */
export function ProgressBar({ modules }: { modules: ModuleRef[] }) {
  const mastery = useMasteryMap(modules);
  const count = (step: Mastery) => modules.filter((m) => mastery[m.slug] === step).length;
  const solid = count(3);
  const practised = count(2);
  const learning = count(1);
  const n = modules.length || 1;
  return (
    <div className="flex items-center gap-2.5 text-xs text-muted">
      <div
        className="flex h-2.5 flex-1 overflow-hidden rounded-[3px] bg-mastery-0"
        role="img"
        aria-label={`${solid} of ${modules.length} modules solid, ${practised} practised, ${learning} learning`}
      >
        <div className="h-full bg-mastery-3 transition-[width] duration-300" style={{ width: `${(solid / n) * 100}%` }} />
        <div className="h-full bg-mastery-2 transition-[width] duration-300" style={{ width: `${(practised / n) * 100}%` }} />
        <div className="h-full bg-mastery-1 transition-[width] duration-300" style={{ width: `${(learning / n) * 100}%` }} />
      </div>
      <span className="w-10 text-right font-bold tabular-nums">
        {solid}/{modules.length}
      </span>
    </div>
  );
}

const DOT: Record<Mastery, string> = { 0: "bg-mastery-0", 1: "bg-mastery-1", 2: "bg-mastery-2", 3: "bg-mastery-3" };

/** The module's mastery step as a labelled chip: Not started · Learning · Practised · Solid. */
export function MasteryChip({ module }: { module: ModuleRef }) {
  const step = useMasteryMap([module])[module.slug] ?? 0;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${step === 3 ? "bg-accent-soft text-accent" : step ? "bg-surface-2" : "bg-surface-2 text-muted"}`}>
      <span aria-hidden="true" className={`inline-block size-2 rounded-full ${DOT[step]}`} />
      {MASTERY_LABEL[step]}
    </span>
  );
}

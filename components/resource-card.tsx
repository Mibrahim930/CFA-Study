import { KIND_LABEL, type Resource } from "@/lib/resources";
import { TrialTracker } from "./trial-tracker";

export function ResourceCard({ r }: { r: Resource }) {
  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium">
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
            {r.name} ↗
          </a>
        </h3>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">{KIND_LABEL[r.kind]}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted">
        {r.provider} · {r.cost}
      </p>
      <p className="mt-2 text-sm">
        <span className="text-muted">When: </span>
        {r.when}
      </p>
      <p className="mt-1 text-sm text-muted">{r.notes}</p>
      {r.extra && (
        <a href={r.extra.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-accent hover:underline">
          {r.extra.label} ↗
        </a>
      )}
      {r.trialDays && (
        <div className="mt-3">
          <TrialTracker id={r.id} days={r.trialDays} />
        </div>
      )}
    </li>
  );
}

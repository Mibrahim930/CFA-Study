import type { Metadata } from "next";
import Link from "next/link";
import { ProgressBar } from "@/components/progress";
import { topicsInStudyOrder, totals } from "@/lib/syllabus";

export const metadata: Metadata = { title: "Syllabus" };

export default function SyllabusPage() {
  const topics = topicsInStudyOrder();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Level I syllabus · 2027</h1>
        <p className="mt-1 text-sm text-muted">
          {totals.modules} modules · {totals.los} learning outcomes · topics in recommended study order
        </p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {topics.map((t, i) => (
          <li key={t.id}>
            <Link
              href={`/topics/${t.id}`}
              className="block rounded-lg border border-line bg-surface p-4 transition hover:border-accent"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-medium">
                  <span className="mr-2 text-muted tabular-nums">{i + 1}.</span>
                  {t.name}
                </h2>
                <span className="shrink-0 text-xs text-muted">
                  {t.weight.min}–{t.weight.max}%
                </span>
              </div>
              <p className="mt-1 mb-3 text-xs text-muted">
                {t.modules.length} modules · exam session {t.session}
              </p>
              <ProgressBar slugs={t.modules.map((m) => m.slug)} />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

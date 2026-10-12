import type { Metadata } from "next";
import Link from "next/link";
import { ProgressBar } from "@/components/progress";
import { topicsInStudyOrder, totals } from "@/lib/syllabus";

export const metadata: Metadata = { title: "Syllabus" };

export default function SyllabusPage() {
  const topics = topicsInStudyOrder();
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Level I syllabus · 2027</h1>
        <p className="text-sm text-muted">
          {totals.modules} modules · {totals.los} learning outcomes · topics in recommended study order
        </p>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2">
        {topics.map((t, i) => (
          <li key={t.id}>
            <Link
              href={`/topics/${t.id}`}
              className="block h-full rounded-2xl border border-line bg-surface p-5 transition hover:border-accent"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-bold">
                  <span className="mr-2 tabular-nums text-muted">{i + 1}.</span>
                  {t.name}
                </h2>
                <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
                  {t.weight.min}–{t.weight.max}%
                </span>
              </div>
              <p className="mt-1 mb-4 text-sm text-muted">
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

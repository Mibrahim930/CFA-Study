import type { Metadata } from "next";
import Link from "next/link";
import { ProgressBar } from "@/components/progress";
import { topicsInStudyOrder, totals } from "@/lib/syllabus";

export const metadata: Metadata = { title: "Syllabus" };

export default function SyllabusPage() {
  const topics = topicsInStudyOrder();
  return (
    <div className="space-y-6">
      <div className="rule-b space-y-1 pb-3">
        <h1 className="display text-[2rem] sm:text-[2.5rem]">Level I syllabus · 2027</h1>
        <p className="text-sm text-muted">
          {totals.modules} modules · {totals.los} learning outcomes · topics in recommended study order, sized by official exam weight
        </p>
      </div>
      <ol>
        {topics.map((t, i) => (
          <li key={t.id} className="border-b border-line last:border-b-0">
            <Link href={`/topics/${t.id}`} className="grid min-h-16 grid-cols-[44px_minmax(0,1fr)] items-center gap-3 py-3 hover:bg-surface-2 sm:grid-cols-[52px_minmax(0,1fr)_200px] sm:gap-5">
              <span className="display text-[1.75rem] text-muted tabular-nums sm:text-[2rem]" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block font-extrabold">
                  <span className="sr-only">{i + 1}. </span>
                  {t.name}
                </span>
                <span className="block text-[0.8125rem] text-muted">
                  <strong className="font-bold text-foreground">
                    {t.weight.min}–{t.weight.max}%
                  </strong>{" "}
                  of the exam · {t.modules.length} modules · session {t.session}
                </span>
              </span>
              <span className="col-start-2 sm:col-start-3">
                <ProgressBar modules={t.modules.map((m) => ({ slug: m.slug, losIds: m.los.map((l) => l.id) }))} />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

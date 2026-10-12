import katex from "katex";
import type { Badge, ViewLesson } from "@/lib/content/generated";
import { PracticeSet } from "./practice-set";
import { InlineRich, RichText } from "./rich-text";

const BADGES: Record<Badge, { label: string; title: string; className: string }> = {
  grounded_verified: { label: "Grounded + verified", title: "Backed by a cited source and passed every check", className: "bg-success/12 text-success" },
  verified: { label: "Math verified", title: "Numbers recomputed by the app's finance engine; not backed by a cited source", className: "bg-info/12 text-info" },
  model_only: { label: "AI-only", title: "Passed the checks but no source in the library backs it; double-check against the curriculum", className: "bg-warn/12 text-warn" },
};

export function BadgeChip({ badge }: { badge: Badge }) {
  const b = BADGES[badge];
  return (
    <span title={b.title} className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold ${b.className}`}>
      {b.label}
    </span>
  );
}

const card = "rounded-2xl border border-line bg-surface p-6 sm:p-8";

export function LessonView({ lesson }: { lesson: ViewLesson }) {
  return (
    <article id={lesson.losId} className="scroll-mt-24 space-y-5">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">{lesson.title}</h2>
          <BadgeChip badge={lesson.badge} />
        </div>
        <p className="text-sm text-muted">LOS: {lesson.losText}</p>
        <p className="max-w-[68ch] text-[17px] leading-7">{lesson.summary}</p>
      </header>

      <div className={`${card} space-y-7 text-[16.5px] leading-7`}>
        {lesson.sections.map((s) => (
          <section key={s.heading} className="max-w-[70ch] space-y-3">
            <h3 className="text-lg font-bold">{s.heading}</h3>
            <RichText text={s.body} />
          </section>
        ))}

        {lesson.formulas.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">Formulas</h3>
            <ul className="grid gap-3">
              {lesson.formulas.map((f) => (
                <li key={f.name} className="rounded-xl bg-surface-2 p-4">
                  <p className="text-sm font-semibold">{f.name}</p>
                  <div className="overflow-x-auto py-1" dangerouslySetInnerHTML={{ __html: katex.renderToString(f.latex, { displayMode: true, throwOnError: false }) }} />
                  <p className="text-sm text-muted">
                    <InlineRich text={f.where} />
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-3 rounded-xl border border-line p-5">
          <h3 className="font-bold">Worked example</h3>
          <RichText text={lesson.workedExample.problem} className="text-muted" />
          <ol className="list-decimal space-y-1.5 pl-5">
            {lesson.workedExample.steps.map((step, i) => (
              <li key={i}>
                <InlineRich text={step.replace(/^\s*(step\s*)?\d+[.):]\s*/i, "")} />
              </li>
            ))}
          </ol>
          <p className="font-bold">
            Answer: <InlineRich text={lesson.workedExample.answer} />
          </p>
        </section>

        {lesson.examTraps.length > 0 && (
          <section className="space-y-2 rounded-xl bg-warn/8 p-5">
            <h3 className="font-bold">Exam traps</h3>
            <ul className="list-disc space-y-1.5 pl-5">
              {lesson.examTraps.map((t) => (
                <li key={t}>
                  <InlineRich text={t} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className={card}>
        <PracticeSet losId={lesson.losId} mcqs={lesson.mcqs} flashcards={lesson.flashcards} />
      </div>

      {lesson.sources.length > 0 && (
        <footer className="space-y-1.5 px-1 text-sm text-muted">
          <p className="font-semibold text-foreground">Sources</p>
          <ul className="space-y-1">
            {lesson.sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {s.title}, {s.locator} ↗
                </a>{" "}
                · {s.license}
              </li>
            ))}
          </ul>
          <p>Written by {lesson.generatedBy} in original wording; numbers recomputed by the app&apos;s finance engine.</p>
        </footer>
      )}
    </article>
  );
}

import katex from "katex";
import type { Badge, ViewLesson } from "@/lib/content/generated";
import { PracticeSet } from "./practice-set";
import { InlineRich, RichText } from "./rich-text";

const BADGES: Record<Badge, { label: string; title: string; className: string }> = {
  grounded_verified: { label: "Grounded + verified", title: "Backed by a cited source and passed every check", className: "bg-success/15 text-success" },
  verified: { label: "Math verified", title: "Numbers recomputed by the app's finance engine; not backed by a cited source", className: "bg-accent/15 text-accent" },
  model_only: { label: "AI-only", title: "Passed the checks but no source in the library backs it; double-check against the curriculum", className: "bg-surface-3 text-muted" },
};

export function BadgeChip({ badge }: { badge: Badge }) {
  const b = BADGES[badge];
  return (
    <span title={b.title} className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${b.className}`}>
      {b.label}
    </span>
  );
}

export function LessonView({ lesson }: { lesson: ViewLesson }) {
  return (
    <article className="space-y-6 rounded-lg border border-line bg-surface p-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{lesson.title}</h2>
          <BadgeChip badge={lesson.badge} />
        </div>
        <p className="text-xs text-muted">LOS: {lesson.losText}</p>
        <p className="text-base">{lesson.summary}</p>
      </header>

      {lesson.sections.map((s) => (
        <section key={s.heading} className="space-y-2">
          <h3 className="font-medium">{s.heading}</h3>
          <RichText text={s.body} />
        </section>
      ))}

      {lesson.formulas.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-medium">Formulas</h3>
          <ul className="space-y-3">
            {lesson.formulas.map((f) => (
              <li key={f.name} className="rounded-md bg-surface-2 p-3">
                <p className="text-sm font-medium">{f.name}</p>
                <div className="overflow-x-auto py-1" dangerouslySetInnerHTML={{ __html: katex.renderToString(f.latex, { displayMode: true, throwOnError: false }) }} />
                <p className="text-sm text-muted">
                  <InlineRich text={f.where} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2 rounded-md border border-line p-4">
        <h3 className="font-medium">Worked example</h3>
        <RichText text={lesson.workedExample.problem} />
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {lesson.workedExample.steps.map((step, i) => (
            <li key={i}>
              <InlineRich text={step.replace(/^\s*(step\s*)?\d+[.):]\s*/i, "")} />
            </li>
          ))}
        </ol>
        <p className="text-sm font-medium">
          Answer: <InlineRich text={lesson.workedExample.answer} />
        </p>
      </section>

      {lesson.examTraps.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-medium">Exam traps</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {lesson.examTraps.map((t) => (
              <li key={t}>
                <InlineRich text={t} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <PracticeSet mcqs={lesson.mcqs} flashcards={lesson.flashcards} />

      {lesson.sources.length > 0 && (
        <footer className="space-y-1 border-t border-line pt-3 text-xs text-muted">
          <p className="font-medium">Sources</p>
          <ul className="space-y-0.5">
            {lesson.sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                  {s.title}, {s.locator} ↗
                </a>{" "}
                · {s.license}
              </li>
            ))}
          </ul>
          <p>Written by {lesson.generatedBy} in original wording and checked by the content pipeline.</p>
        </footer>
      )}
    </article>
  );
}

"use client";

import Link from "next/link";
import { useDoneMap } from "@/lib/store/local";
import { dueIds, useNow, useReviewState } from "@/lib/store/review";

export interface TodayModule {
  slug: string;
  title: string;
  order: number;
  topicId: string;
  topicName: string;
  topicModules: number;
  hasLessons: boolean;
}

export function TodayView({ modules, topics }: { modules: TodayModule[]; topics: { id: string; name: string }[] }) {
  const done = useDoneMap(modules.map((m) => m.slug));
  const review = useReviewState();
  const due = dueIds(review, useNow());
  const missedDue = due.filter((id) => review[id].kind === "missed").length;
  const next = modules.find((m) => !done[m.slug] && m.hasLessons) ?? modules.find((m) => !done[m.slug]);
  const finished = modules.filter((m) => done[m.slug]).length;

  const readiness = topics.map((t) => {
    const ms = modules.filter((m) => m.topicId === t.id);
    const n = ms.filter((m) => done[m.slug]).length;
    return { ...t, pct: ms.length ? Math.round((n / ms.length) * 100) : 0, started: n > 0 };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted">
            {finished} of {modules.length} modules done
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{!next ? "Syllabus complete" : finished === 0 ? "Start your first module" : "Pick up where you left off"}</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section className="min-w-0 flex-[999_1_560px] space-y-5">
          {next && (
            <div className="space-y-3 rounded-2xl bg-accent p-7 text-accent-fg">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Next up</p>
              <h2 className="text-2xl font-extrabold tracking-tight">{next.title}</h2>
              <p className="opacity-90">
                {next.topicName} · module {next.order} of {next.topicModules}
                {next.hasLessons ? " · lesson, practice questions and lectures" : " · lectures and checklist (lessons coming soon)"}
              </p>
              <Link href={`/learn/${next.slug}`} className="inline-flex min-h-11 items-center rounded-xl bg-accent-fg px-5 font-extrabold text-accent">
                {finished === 0 ? "Start studying" : "Continue"}
              </Link>
            </div>
          )}

          {finished === 0 && Object.keys(review).length === 0 && next && (
            <div className="space-y-3 rounded-2xl border border-line bg-surface p-5">
              <h3 className="font-bold">New here? Three steps to get going</h3>
              <ol className="grid gap-3 sm:grid-cols-3">
                <StartStep n={1} title="Read the beginner guide" detail={`Plain-English intro to ${next.topicName}`} href={`/topics/${next.topicId}`} />
                <StartStep n={2} title="Watch and study module 1" detail="Lecture first, then the lesson and practice" href={`/learn/${next.slug}`} />
                <StartStep n={3} title="Review your flashcards" detail="A few minutes a day keeps it in memory" href="/review" />
              </ol>
            </div>
          )}

          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-lg font-bold">Today&apos;s plan</h3>
            <span className="text-sm font-semibold text-muted tabular-nums">about {Math.max(5, Math.round(due.length * 0.4 + (next ? 25 : 0) + missedDue * 2))} min</span>
          </div>
          <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            <PlanRow n={1} title={`Review ${due.length} card${due.length === 1 ? "" : "s"}`} detail={due.length ? "Spaced repetition: the ones you're about to forget" : "Nothing due; new cards arrive as you study"} minutes={Math.round(due.length * 0.4)} href="/review" done={due.length === 0} />
            {next && <PlanRow n={2} title={`Study: ${next.title}`} detail={`${next.topicName} · module ${next.order} · watch, read, practise`} minutes={25} href={`/learn/${next.slug}`} />}
            <PlanRow n={next ? 3 : 2} title={missedDue ? `Redo ${missedDue} missed question${missedDue === 1 ? "" : "s"}` : "No missed questions waiting"} detail="Wrong answers come back as review cards" minutes={missedDue * 2} href="/review" done={missedDue === 0} />
          </ol>
        </section>

        <aside className="min-w-0 flex-[1_1_300px] space-y-5">
          <div className="space-y-3 rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-bold">Cards due</h3>
              <span className={`text-3xl font-extrabold ${due.length ? "text-warn" : "text-muted"}`}>{due.length}</span>
            </div>
            <Link href="/review" className="flex min-h-11 items-center justify-center rounded-xl border border-control-line font-semibold hover:border-accent">
              Review now
            </Link>
          </div>
          <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
            <h3 className="font-bold">Progress by topic</h3>
            <ul className="space-y-3 text-sm">
              {readiness.map((t) => (
                <li key={t.id} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/topics/${t.id}`} className="min-w-0 hover:text-accent">
                      {t.name}
                    </Link>
                    <span className={`shrink-0 whitespace-nowrap tabular-nums ${t.started ? "font-bold" : "text-xs text-muted"}`}>{t.started ? `${t.pct}%` : "Not started"}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2">
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${t.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StartStep({ n, title, detail, href }: { n: number; title: string; detail: string; href: string }) {
  return (
    <li>
      <Link href={href} className="flex h-full flex-col gap-1 rounded-xl bg-surface-2 p-4 hover:bg-accent-soft">
        <span className="text-xs font-bold text-accent">Step {n}</span>
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-muted">{detail}</span>
      </Link>
    </li>
  );
}

function PlanRow({ n, title, detail, href, minutes = 0, done = false }: { n: number; title: string; detail: string; href: string; minutes?: number; done?: boolean }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${done ? "bg-success/12 text-success" : "bg-accent-soft text-accent"}`} aria-hidden="true">
          {done ? "✓" : n}
        </span>
        <span className="flex-1">
          <span className="block font-semibold">{title}</span>
          <span className="block text-sm text-muted">{detail}</span>
        </span>
        {!done && minutes > 0 && <span className="shrink-0 text-sm font-semibold tabular-nums text-muted">{minutes} min</span>}
      </Link>
    </li>
  );
}

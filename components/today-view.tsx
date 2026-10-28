"use client";

import Link from "next/link";
import { examSecured, MASTERY_LABEL, topicProgress, type TopicWeight } from "@/lib/progress";
import { lastSevenDays, useActivity } from "@/lib/store/activity";
import { daysSinceBackup } from "@/lib/store/backup";
import { useMasteryMap } from "@/lib/store/local";
import { useMockSession } from "@/lib/store/mock";
import { dueIds, useNow, useReviewState } from "@/lib/store/review";
import { daysToExam, useSettings } from "@/lib/store/settings";
import { useLastBackup } from "./backup-panel";
import { LedgerBar, LedgerLegend } from "./ledger-bar";

export interface TodayModule {
  slug: string;
  title: string;
  order: number;
  topicId: string;
  topicName: string;
  topicModules: number;
  hasLessons: boolean;
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TodayView({ modules, topics, mockAnswers }: { modules: TodayModule[]; topics: TopicWeight[]; mockAnswers: Record<string, number> }) {
  const mastery = useMasteryMap(modules.map((m) => m.slug));
  const review = useReviewState();
  const now = useNow();
  const due = dueIds(review, now);
  const missedDue = due.filter((id) => review[id].kind === "missed").length;
  const next = modules.find((m) => mastery[m.slug] !== 3 && m.hasLessons) ?? modules.find((m) => mastery[m.slug] !== 3);
  const finished = modules.filter((m) => mastery[m.slug] === 3).length;
  const settings = useSettings();
  const days = daysToExam(settings.examDate, now);
  const week = lastSevenDays(useActivity(), now);
  const studiedDays = week.filter((d) => d.studied).length;
  const mock = useMockSession();
  const lastMock = mock?.finished ? scoreMock(mock.ids, mock.answers, mockAnswers) : null;
  const lastBackup = useLastBackup();
  const backupDays = now === null || lastBackup === undefined ? undefined : daysSinceBackup(lastBackup, now);
  const backupDue = backupDays !== undefined && (finished > 0 || Object.keys(review).length > 0) && (backupDays === null || backupDays >= 7);

  const progress = topicProgress(topics, mastery);
  const secured = examSecured(progress);
  const weakest = [...progress].filter((t) => t.mastery < 3).sort((a, b) => b.points * (1 - a.solidShare) - a.points * (1 - b.solidShare))[0];
  const minutes = Math.max(5, Math.round(due.length * 0.4 + (next ? 25 : 0) + missedDue * 2));
  const fresh = finished === 0 && Object.keys(review).length === 0;

  return (
    <div className="space-y-5">
      {/* Masthead */}
      <header className="rule-b flex items-center justify-between gap-4 pb-3">
        <p className="caps flex items-center gap-2">
          <span aria-hidden="true" className="inline-block size-2 rounded-full bg-accent" />
          {now === null ? "Today" : new Date(now).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
        </p>
        <p className="caps text-muted">
          {days === null ? (
            <Link href="/backup#exam" className="text-accent hover:underline">
              Set exam date
            </Link>
          ) : days < 0 ? (
            "Exam day has passed"
          ) : (
            <>
              <strong className="text-sm tracking-normal text-foreground">{days}</strong> {days === 1 ? "day" : "days"} to exam
            </>
          )}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          {/* The hero number and the ledger bar */}
          <section aria-label="Exam weight secured" className="space-y-3 border-b border-rule pb-4">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <div>
                <p className="display text-[5.25rem] sm:text-[6rem]" style={{ fontStretch: "90%" }}>
                  {secured}
                  <span className="text-[2.25rem] font-bold tracking-normal">%</span>
                </p>
                <p className="caps mt-0.5 text-muted">of the exam secured, by official topic weight</p>
              </div>
              <div className="flex flex-col items-end gap-0.5 text-right text-[0.8125rem] text-muted">
                <span>
                  <strong className="text-foreground">{finished}</strong> of {modules.length} modules solid
                </span>
                {weakest && weakest.mastery === 0 && (
                  <span className="font-bold text-warn">
                    {weakest.name} is {weakest.weight.min}–{weakest.weight.max}%: not started
                  </span>
                )}
                <Link href="/syllabus" className="mt-1 font-bold text-accent hover:underline">
                  All 10 topics →
                </Link>
              </div>
            </div>
            <LedgerBar progress={progress} />
            <LedgerLegend />
          </section>

          {/* Glance row */}
          <section aria-label="At a glance" className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
            <Link href="/review" className="flex flex-col gap-0.5 rounded-tile border border-line bg-surface px-3.5 py-3 hover:border-accent">
              <span className={`display text-[1.75rem] sm:text-[2.25rem] ${due.length ? "text-warn" : ""}`}>{due.length}</span>
              <span className="caps text-[0.625rem] text-muted sm:text-[0.6875rem]">cards due</span>
            </Link>
            <div className="flex flex-col gap-0.5 rounded-tile border border-line bg-surface px-3.5 py-3">
              <span className="display text-[1.75rem] sm:text-[2.25rem]">
                {studiedDays}
                <span className="text-sm font-bold tracking-normal text-muted">/7</span>
              </span>
              <span className="caps text-[0.625rem] text-muted sm:text-[0.6875rem]">days studied</span>
              <ul aria-label="Last seven days" className="mt-1.5 flex gap-1">
                {week.map((d) => (
                  <li
                    key={d.key}
                    title={d.key}
                    className={`h-1.5 flex-1 rounded-[2px] ${d.studied ? "bg-accent" : "bg-surface-3"} ${d.today ? "outline-1 outline-offset-1 outline-accent" : ""}`}
                  >
                    <span className="sr-only">
                      {WEEKDAY[new Date(d.key + "T12:00:00").getDay()]}: {d.studied ? "studied" : "no study"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/mock" className="flex flex-col gap-0.5 rounded-tile border border-line bg-surface px-3.5 py-3 hover:border-accent">
              <span className="display text-[1.75rem] sm:text-[2.25rem]">
                {lastMock === null ? "—" : lastMock.pct}
                {lastMock !== null && <span className="text-sm font-bold tracking-normal text-muted">%</span>}
              </span>
              <span className="caps text-[0.625rem] text-muted sm:text-[0.6875rem]">{lastMock === null ? "no mock yet" : `last mock · ${lastMock.n} q`}</span>
            </Link>
          </section>

          {/* Next up */}
          {next && (
            <section aria-label="Next up" className="space-y-2 rounded-tile bg-accent-soft p-5">
              <p className="caps text-accent">
                Next · {next.topicName} {String(next.order).padStart(2, "0")} / {next.topicModules} · about 25 min
              </p>
              <h1 className="display text-[2rem] sm:text-[2.5rem]">{next.title}</h1>
              <p className="text-sm text-muted">{next.hasLessons ? "Lecture, lessons, then practice questions" : "Lectures and the outcome checklist (lessons coming soon)"}</p>
              <Link
                href={`/learn/${next.slug}`}
                className="mt-1 flex min-h-12 items-center justify-between rounded-control bg-accent px-4 text-base font-extrabold text-accent-fg hover:brightness-110"
              >
                {finished === 0 ? "Start studying" : "Continue"}
                <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </Link>
            </section>
          )}
          {!next && (
            <section className="rounded-tile bg-accent-soft p-5">
              <h1 className="display text-[2rem]">Syllabus complete</h1>
              <p className="mt-1 text-sm text-muted">Keep reviewing and sit mocks until exam day.</p>
            </section>
          )}

          {fresh && next && (
            <section className="space-y-3 rounded-tile border border-line bg-surface p-5">
              <h2 className="font-extrabold">New here? Three steps to get going</h2>
              <ol className="grid gap-3 sm:grid-cols-3">
                <StartStep n={1} title="Read the beginner guide" detail={`Plain-English intro to ${next.topicName}`} href={`/topics/${next.topicId}`} />
                <StartStep n={2} title="Watch and study module 1" detail="Lecture first, then the lesson and practice" href={`/learn/${next.slug}`} />
                <StartStep n={3} title="Review your flashcards" detail="A few minutes a day keeps it in memory" href="/review" />
              </ol>
            </section>
          )}

          {/* Plan */}
          <section aria-label="Tonight's plan">
            <div className="flex items-baseline justify-between">
              <h2 className="caps text-muted">Today&apos;s plan</h2>
              <span className="text-sm font-bold tabular-nums text-muted">about {minutes} min</span>
            </div>
            <ol>
              <PlanRow n={1} title={`Review ${due.length} card${due.length === 1 ? "" : "s"}`} minutes={Math.round(due.length * 0.4)} href="/review" done={due.length === 0} />
              {next && <PlanRow n={2} title={`Study ${next.title}`} minutes={25} href={`/learn/${next.slug}`} current />}
              <PlanRow
                n={next ? 3 : 2}
                title={missedDue ? `Redo ${missedDue} missed question${missedDue === 1 ? "" : "s"}` : "No missed questions waiting"}
                minutes={missedDue * 2}
                href="/review"
                done={missedDue === 0}
                last
              />
            </ol>
          </section>
        </div>

        <aside className="min-w-0 space-y-5">
          {backupDue && (
            <Link href="/backup" className="block space-y-1 rounded-tile border border-warn bg-surface p-4 hover:bg-surface-2">
              <span className="caps text-warn">Back up your progress</span>
              <span className="block text-sm text-muted">
                {backupDays === null ? "You haven't made a backup on this device yet." : `Your last backup was ${backupDays} days ago.`} Clearing your browser would erase
                your progress.
              </span>
            </Link>
          )}
          <section className="rounded-tile border border-line bg-surface p-4 sm:p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[0.9375rem] font-extrabold">By topic · weight</h2>
              <Link href="/syllabus" className="text-[0.8125rem] font-bold text-accent hover:underline">
                Open →
              </Link>
            </div>
            <ul className="mt-2">
              {progress.map((t) => (
                <li key={t.id} className="grid min-h-[34px] grid-cols-[minmax(0,1fr)_72px_auto] items-center gap-3 border-b border-line text-[0.8125rem] last:border-b-0">
                  <Link href={`/topics/${t.id}`} className="truncate hover:text-accent">
                    {t.name} <span className="text-muted">· {t.weight.min}–{t.weight.max}%</span>
                  </Link>
                  <span className="flex h-2.5 overflow-hidden rounded-[3px] bg-mastery-0" role="img" aria-label={`${t.name}: ${MASTERY_LABEL[t.mastery]}`}>
                    <span className="bg-mastery-3" style={{ width: `${t.solidShare * 100}%` }} />
                    <span className="bg-mastery-1" style={{ width: `${t.learningShare * 100}%` }} />
                  </span>
                  <span className={`w-[72px] text-right tabular-nums ${t.mastery ? "font-bold" : "text-xs text-muted"}`}>
                    {t.solid > 0 ? `${t.solid}/${t.moduleSlugs.length}` : MASTERY_LABEL[t.mastery]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function scoreMock(ids: string[], answers: Record<string, number>, key: Record<string, number>) {
  const scored = ids.filter((id) => key[id] !== undefined);
  const right = scored.filter((id) => answers[id] === key[id]).length;
  return { n: scored.length, pct: scored.length ? Math.round((right / scored.length) * 100) : 0 };
}

function StartStep({ n, title, detail, href }: { n: number; title: string; detail: string; href: string }) {
  return (
    <li>
      <Link href={href} className="flex h-full flex-col gap-1 rounded-control bg-surface-2 p-4 hover:bg-accent-soft">
        <span className="caps text-accent">Step {n}</span>
        <span className="font-bold">{title}</span>
        <span className="text-sm text-muted">{detail}</span>
      </Link>
    </li>
  );
}

function PlanRow({ n, title, href, minutes = 0, done = false, current = false, last = false }: { n: number; title: string; href: string; minutes?: number; done?: boolean; current?: boolean; last?: boolean }) {
  return (
    <li className={last ? "" : "border-b border-line"}>
      <Link href={href} className="grid min-h-12 grid-cols-[40px_1fr_auto] items-baseline gap-2.5 hover:bg-surface-2">
        <span className={`display text-[1.5rem] ${done ? "text-muted line-through" : current ? "text-accent" : ""}`} aria-hidden="true">
          {String(n).padStart(2, "0")}
        </span>
        <span className={`text-[0.9375rem] ${done ? "text-muted line-through" : current ? "font-bold" : ""}`}>{title}</span>
        <span className="text-xs font-bold tabular-nums text-muted">{done ? "done" : minutes > 0 ? `${minutes} min` : ""}</span>
      </Link>
    </li>
  );
}

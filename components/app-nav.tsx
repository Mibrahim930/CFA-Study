"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { dueIds, useNow, useReviewState } from "@/lib/store/review";
import { daysToExam, useSettings } from "@/lib/store/settings";

/*
 * One source of truth for the app's sections. Rendered twice from the same list:
 *  - a rail on the left from the `sm` breakpoint up (icons only, labels from `lg`),
 *  - a floating dock on phones.
 * Both are reactive: the selected tab follows the URL, the Review badge follows the deck as cards
 * fall due (useNow ticks every 30 s), the dock's pill slides to the selected tab, and a tab shows a
 * pending state while a slow navigation is in flight (useLinkStatus).
 */

interface Tab {
  href: "/" | "/syllabus" | "/review" | "/mock" | "/resources" | "/backup";
  label: string;
  short?: string;
  match: (path: string) => boolean;
  icon: ReactNode;
  /** In the phone dock (at most 5 destinations); the rest live only in the rail. */
  dock: boolean;
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const TABS: Tab[] = [
  { href: "/", label: "Today", match: (p) => p === "/", dock: true, icon: <path d="M3 9l7-6 7 6v8H3z" /> },
  {
    href: "/syllabus",
    label: "Syllabus",
    match: (p) => p.startsWith("/syllabus") || p.startsWith("/topics") || p.startsWith("/learn"),
    dock: true,
    icon: <path d="M4 4h12v13H4zM7 8h6M7 12h4" />,
  },
  {
    href: "/review",
    label: "Review",
    match: (p) => p.startsWith("/review"),
    dock: true,
    icon: (
      <>
        <rect x="2" y="6" width="12" height="10" rx="2" />
        <path d="M6 6V5a2 2 0 012-2h8a2 2 0 012 2v7a2 2 0 01-2 2h-2" />
      </>
    ),
  },
  {
    href: "/mock",
    label: "Mock exam",
    short: "Mock",
    match: (p) => p.startsWith("/mock"),
    dock: true,
    icon: (
      <>
        <circle cx="10" cy="11" r="7" />
        <path d="M10 7v4l3 2" />
      </>
    ),
  },
  {
    href: "/resources",
    label: "Resources",
    match: (p) => p.startsWith("/resources"),
    dock: false,
    icon: <path d="M3 5h6a3 3 0 013 3v9a2 2 0 00-2-2H3zM17 5h-6a3 3 0 00-3 3v9a2 2 0 012-2h7z" />,
  },
  { href: "/backup", label: "Backup", match: (p) => p.startsWith("/backup"), dock: false, icon: <path d="M10 3v9M6 8l4 4 4-4M4 15h12" /> },
];

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 shrink-0" {...stroke}>
      {children}
    </svg>
  );
}

/** Fixed-size badge so the tab never shifts when the count appears. */
function DueBadge({ due, className = "" }: { due: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-warn px-1 text-[0.625rem] font-extrabold leading-none text-warn-fg transition-opacity duration-200 ${due > 0 ? "opacity-100" : "opacity-0"} ${className}`}
    >
      {due > 99 ? "99+" : due}
    </span>
  );
}

/** The tab's body knows whether its navigation is still in flight. */
function TabBody({ tab, active, due, compact }: { tab: Tab; active: boolean; due: number; compact: boolean }) {
  const { pending } = useLinkStatus();
  const label = compact ? (tab.short ?? tab.label) : tab.label;
  return (
    <>
      <span className={`relative transition-opacity duration-200 ${pending ? "animate-pulse opacity-60" : ""}`}>
        <Icon>{tab.icon}</Icon>
        {tab.href === "/review" && compact && <DueBadge due={due} className="absolute -top-2 left-3.5" />}
      </span>
      <span className={`${compact ? "text-[0.6875rem] font-extrabold tracking-[0.04em]" : "text-[0.9375rem] font-bold"} ${pending ? "opacity-60" : ""}`}>{label}</span>
      {tab.href === "/review" && !compact && <DueBadge due={due} className="ml-auto h-5 min-w-5 text-[0.6875rem]" />}
      {tab.href === "/review" && due > 0 && <span className="sr-only">, {due} cards due</span>}
      {active && <span className="sr-only">(current)</span>}
    </>
  );
}

function useNavState() {
  const path = usePathname();
  const now = useNow();
  const due = dueIds(useReviewState(), now).length;
  const settings = useSettings();
  const days = daysToExam(settings.examDate, now);
  return { path, due, days, examDate: settings.examDate };
}

/** Left rail, from the `sm` breakpoint: icons only until `lg`, where labels and the exam countdown appear. */
export function Rail() {
  const { path, due, days, examDate } = useNavState();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[72px] shrink-0 flex-col border-r border-line bg-background px-3 py-5 sm:flex lg:w-[220px] lg:px-4">
      <Link href="/" className="mb-6 flex min-h-11 items-center gap-2.5 px-2.5 text-lg font-black tracking-tight">
        <span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-full bg-accent" />
        <span className="hidden lg:inline">L1 Study</span>
        <span className="sr-only lg:hidden">L1 Study</span>
      </Link>
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {TABS.map((t) => {
            const active = t.match(path);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  title={t.label}
                  className={`flex min-h-11 items-center justify-center gap-3 rounded-control px-2.5 transition-colors duration-200 lg:justify-start lg:px-3.5 ${
                    active ? "bg-accent text-accent-fg" : "text-foreground hover:bg-surface-2"
                  }`}
                >
                  <RailBody tab={t} active={active} due={due} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto hidden rounded-tile bg-surface-2 p-3.5 text-xs leading-relaxed text-muted lg:block">
        <p className="caps mb-1 text-foreground">Exam day</p>
        {days === null ? (
          <Link href="/backup#exam" className="font-bold text-accent hover:underline">
            Set your exam date
          </Link>
        ) : (
          <p>
            <strong className="display text-[1.75rem] text-foreground">{Math.max(days, 0)}</strong> {days === 1 ? "day" : "days"} ·{" "}
            {new Date(examDate + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>
    </aside>
  );
}

function RailBody({ tab, active, due }: { tab: Tab; active: boolean; due: number }) {
  const { pending } = useLinkStatus();
  return (
    <>
      <span className={`relative transition-opacity duration-200 ${pending ? "animate-pulse opacity-60" : ""}`}>
        <Icon>{tab.icon}</Icon>
        {tab.href === "/review" && <DueBadge due={due} className="absolute -top-2 left-3.5 lg:hidden" />}
      </span>
      <span className={`hidden text-[0.9375rem] font-bold lg:inline ${pending ? "opacity-60" : ""}`}>{tab.label}</span>
      {tab.href === "/review" && <DueBadge due={due} className="ml-auto hidden h-5 min-w-5 text-[0.6875rem] lg:inline-flex" />}
      {tab.href === "/review" && due > 0 && <span className="sr-only">, {due} cards due</span>}
      {active && <span className="sr-only">(current)</span>}
    </>
  );
}

/** Phone dock: four destinations in thumb reach, a pill that slides to the selected one. */
export function Dock() {
  const { path, due } = useNavState();
  const tabs = TABS.filter((t) => t.dock);
  const index = Math.max(
    0,
    tabs.findIndex((t) => t.match(path)),
  );
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-4 bottom-[max(0.875rem,env(safe-area-inset-bottom))] z-10 rounded-dock bg-surface p-1.5 shadow-[0_1px_2px_rgb(29_27_36/0.06),0_10px_28px_rgb(29_27_36/0.12)] sm:hidden dark:shadow-[0_1px_2px_rgb(0_0_0/0.4),0_10px_28px_rgb(0_0_0/0.5)]"
    >
      <ul className="relative grid h-[52px]" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        <li
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 rounded-[13px] bg-accent transition-transform duration-300 ease-out"
          style={{ width: `${100 / tabs.length}%`, transform: `translateX(${index * 100}%)` }}
        />
        {tabs.map((t, i) => {
          const active = i === index;
          return (
            <li key={t.href} className="relative">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 rounded-[13px] transition-colors duration-200 ${active ? "text-accent-fg" : "text-foreground"}`}
              >
                <TabBody tab={t} active={active} due={due} compact />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

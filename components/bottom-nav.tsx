"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { dueIds, useNow, useReviewState } from "@/lib/store/review";

/** Tab icons: outlined at rest, filled when selected (HIG tab bars prefer filled symbols for the selection). */
const ICONS: Record<string, (active: boolean) => ReactNode> = {
  "/": (a) => (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2.5" fill={a ? "currentColor" : "none"} />
      <path d="M8 3v4M16 3v4" />
      <path d="M4 10h16" className={a ? "stroke-surface" : ""} />
    </>
  ),
  "/syllabus": (a) => (
    <path
      d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13z"
      fill={a ? "currentColor" : "none"}
    />
  ),
  "/review": (a) => (
    <>
      <rect x="3" y="8" width="14" height="13" rx="2.5" fill={a ? "currentColor" : "none"} />
      <path d="M7 4.5h11.5A2.5 2.5 0 0 1 21 7v10" />
    </>
  ),
  "/mock": (a) => (
    <>
      <circle cx="12" cy="13.5" r="7.5" fill={a ? "currentColor" : "none"} />
      <path d="M12 10v3.5l2.5 2" className={a ? "stroke-surface" : ""} />
      <path d="M9.5 2.5h5" />
    </>
  ),
};

const TABS = [
  { href: "/", label: "Today", match: (p: string) => p === "/" },
  { href: "/syllabus", label: "Syllabus", match: (p: string) => p.startsWith("/syllabus") || p.startsWith("/topics") || p.startsWith("/learn") },
  { href: "/review", label: "Review", match: (p: string) => p.startsWith("/review") },
  { href: "/mock", label: "Mock", match: (p: string) => p.startsWith("/mock") },
];

/** Phone-only bottom navigation (thumb reach); the top nav covers wider screens. */
export function BottomNav() {
  const path = usePathname();
  const due = dueIds(useReviewState(), useNow()).length;
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const active = t.match(path);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-bold ${active ? "text-accent" : "text-muted"}`}
              >
                <span className="relative">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[t.href](active)}
                  </svg>
                  {t.href === "/review" && due > 0 && (
                    <span aria-hidden="true" className="absolute -top-1.5 left-4 min-w-5 rounded-full bg-warn px-1 text-center text-[0.6875rem] font-bold leading-5 text-warn-fg">
                      {due > 99 ? "99+" : due}
                    </span>
                  )}
                </span>
                {t.label}
                {t.href === "/review" && due > 0 && <span className="sr-only">, {due} cards due</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

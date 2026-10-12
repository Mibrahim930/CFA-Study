"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dueIds, useNow, useReviewState } from "@/lib/store/review";

const TABS = [
  { href: "/", label: "Today", match: (p: string) => p === "/" },
  { href: "/syllabus", label: "Learn", match: (p: string) => p.startsWith("/syllabus") || p.startsWith("/topics") || p.startsWith("/learn") },
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
                className={`relative flex min-h-14 flex-col items-center justify-center text-xs font-bold ${active ? "text-accent" : "text-muted"}`}
              >
                {active && <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />}
                {t.label}
                {t.href === "/review" && due > 0 && (
                  <span className="absolute top-2 right-[calc(50%-1.6rem)] min-w-4 rounded-full bg-warn px-1 text-[10px] leading-4 text-white">{due > 99 ? "99+" : due}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

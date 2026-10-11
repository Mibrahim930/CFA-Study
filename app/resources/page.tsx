import type { Metadata } from "next";
import { ResourceCard } from "@/components/resource-card";
import { RESOURCES } from "@/lib/resources";

export const metadata: Metadata = { title: "Free resources" };

const GROUPS = [
  { title: "Official CFA Institute material", kinds: ["official"] },
  { title: "Question banks and courses", kinds: ["question-bank", "course", "video"] },
  { title: "Time-limited trials", kinds: ["trial"] },
] as const;

export default function ResourcesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Free resources</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Free practice and courses to use on their own sites alongside the app. They are a second opinion: if
          you score far higher here than on outside questions, the app is too easy. Start each time-limited trial
          the week it is most useful, and record it below so it isn&apos;t wasted.
        </p>
      </div>
      {GROUPS.map((g) => {
        const items = RESOURCES.filter((r) => (g.kinds as readonly string[]).includes(r.kind));
        return (
          <section key={g.title} className="space-y-3">
            <h2 className="text-lg font-medium">{g.title}</h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {items.map((r) => (
                <ResourceCard key={r.id} r={r} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

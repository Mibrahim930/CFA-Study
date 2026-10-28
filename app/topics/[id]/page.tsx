import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MasteryChip, ProgressBar } from "@/components/progress";
import { ResourceCard } from "@/components/resource-card";
import { getDeck } from "@/lib/content/deck";
import { getHeldBackLos } from "@/lib/content/generated";
import { getPrimer } from "@/lib/content/primers";
import { getModuleLectures } from "@/lib/content/videos";
import { TopicPrimer } from "@/components/topic-primer";
import { resourcesForTopic } from "@/lib/resources";
import { formatTime } from "@/lib/youtube";
import { getTopic, syllabus } from "@/lib/syllabus";

export function generateStaticParams() {
  return syllabus.topics.map((t) => ({ id: t.id }));
}

export async function generateMetadata(props: PageProps<"/topics/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: getTopic(id)?.name ?? "Topic" };
}

export default function TopicPage(props: PageProps<"/topics/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <TopicContent params={props.params} />
    </Suspense>
  );
}

async function TopicContent({ params }: { params: PageProps<"/topics/[id]">["params"] }) {
  const { id } = await params;
  const topic = getTopic(id);
  if (!topic) notFound();

  const deck = await getDeck();
  const withLessons = new Set(Object.values(deck).map((d) => d.moduleSlug));
  const rows = await Promise.all(
    topic.modules.map(async (m) => {
      const [lectures, heldBack] = await Promise.all([getModuleLectures(m.id), getHeldBackLos(topic.id, m.id)]);
      return { m, lectures, heldBack: heldBack.length, lessons: withLessons.has(m.slug) };
    }),
  );
  const ready = rows.filter((r) => r.lessons).length;
  const primer = await getPrimer(topic.id);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link href="/syllabus" className="text-sm font-semibold text-muted hover:text-accent">
          ← Syllabus
        </Link>
        <h1 className="display text-[2rem] sm:text-[2.5rem]">{topic.name}</h1>
        <p className="text-sm text-muted">
          Exam weight {topic.weight.min}–{topic.weight.max}% · session {topic.session} · {topic.modules.length} modules · lessons ready for {ready}
        </p>
        <div className="max-w-sm pt-1">
          <ProgressBar modules={topic.modules.map((m) => ({ slug: m.slug, losIds: m.los.map((l) => l.id) }))} />
        </div>
      </div>
      {primer && <TopicPrimer primer={primer} topicName={topic.name} />}
      <h2 className="text-lg font-bold">Modules</h2>
      <ol className="divide-y divide-line overflow-hidden rounded-tile border border-line bg-surface">
        {rows.map(({ m, lectures, heldBack, lessons }) => (
          <li key={m.id}>
            <Link href={`/learn/${m.slug}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 hover:bg-surface-2">
              <span className="w-6 shrink-0 font-semibold tabular-nums text-muted">{m.order}</span>
              <span className="min-w-0 flex-[1_1_240px] font-semibold">{m.title}</span>
              <span className="flex shrink-0 flex-wrap items-center gap-2 text-xs font-semibold">
                <MasteryChip module={{ slug: m.slug, losIds: m.los.map((l) => l.id) }} />
                {lessons ? (
                  <span className="rounded-full bg-success/12 px-2.5 py-1 text-success">Lessons ready</span>
                ) : heldBack ? (
                  <span className="rounded-full bg-warn/12 px-2.5 py-1 text-warn">Held back</span>
                ) : (
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-muted">Lessons coming</span>
                )}
                {lectures.length > 0 && (
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-muted">
                    {lectures.length} video{lectures.length === 1 ? "" : "s"} · {formatTime(lectures.reduce((s, l) => s + l.seconds, 0))}
                  </span>
                )}
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-muted">{m.los.length} LOS</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">Practise elsewhere</h2>
          <Link href="/resources" className="text-sm font-semibold text-muted hover:text-accent">
            All free resources →
          </Link>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {resourcesForTopic(topic.id).map((r) => (
            <ResourceCard key={r.id} r={r} />
          ))}
        </ul>
      </section>
    </div>
  );
}

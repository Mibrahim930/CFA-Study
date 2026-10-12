import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DoneMark, ProgressBar } from "@/components/progress";
import { ResourceCard } from "@/components/resource-card";
import { resourcesForTopic } from "@/lib/resources";
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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/syllabus" className="text-sm font-semibold text-muted hover:text-accent">
          ← Syllabus
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{topic.name}</h1>
        <p className="mt-1 text-sm text-muted">
          Exam weight {topic.weight.min}–{topic.weight.max}% · session {topic.session} · {topic.modules.length}{" "}
          modules
        </p>
        <div className="mt-3 max-w-sm">
          <ProgressBar slugs={topic.modules.map((m) => m.slug)} />
        </div>
      </div>
      <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
        {topic.modules.map((m) => (
          <li key={m.id}>
            <Link href={`/learn/${m.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
              <span className="w-6 shrink-0 text-sm text-muted tabular-nums">{m.order}</span>
              <span className="flex-1">{m.title}</span>
              <span className="shrink-0 text-xs text-muted">{m.los.length} LOS</span>
              <span className="w-4 shrink-0 text-right">
                <DoneMark slug={m.slug} />
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-medium">Practise elsewhere</h2>
          <Link href="/resources" className="text-sm text-muted hover:text-foreground">
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

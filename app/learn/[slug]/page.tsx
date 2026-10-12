import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonView } from "@/components/lesson-view";
import { ModuleWorkspace } from "@/components/module-workspace";
import { getModuleLessons } from "@/lib/content/generated";
import { getModuleLectures } from "@/lib/content/videos";
import { getModule, syllabus } from "@/lib/syllabus";

async function GeneratedLessons({ topicId, moduleId, losOrder }: { topicId: string; moduleId: string; losOrder: string[] }) {
  const lessons = await getModuleLessons(topicId, moduleId, losOrder);
  if (lessons.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-muted">
        Lessons for this module haven&apos;t been generated yet. Use the video, notes and checklist below in the meantime.
      </p>
    );
  }
  return (
    <div className="space-y-12">
      {lessons.map((l) => (
        <LessonView key={l.losId} lesson={l} />
      ))}
    </div>
  );
}

export function generateStaticParams() {
  return syllabus.topics.flatMap((t) => t.modules.map((m) => ({ slug: m.slug })));
}

export async function generateMetadata(props: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: getModule(slug)?.module.title ?? "Module" };
}

export default function LearnPage(props: PageProps<"/learn/[slug]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <LearnContent params={props.params} />
    </Suspense>
  );
}

async function LearnContent({ params }: { params: PageProps<"/learn/[slug]">["params"] }) {
  const { slug } = await params;
  const found = getModule(slug);
  if (!found) notFound();
  const { topic, module } = found;
  const idx = topic.modules.findIndex((m) => m.id === module.id);
  const prev = topic.modules[idx - 1];
  const next = topic.modules[idx + 1];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link href={`/topics/${topic.id}`} className="text-sm font-semibold text-muted hover:text-accent">
          ← {topic.name}
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">{module.title}</h1>
        <p className="text-sm text-muted">
          Module {module.order} of {topic.modules.length} · {module.los.length} learning outcome{module.los.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <div className="min-w-0 flex-[999_1_640px] space-y-12">
          <Suspense fallback={<p className="text-muted">Loading lessons…</p>}>
            <GeneratedLessons topicId={topic.id} moduleId={module.id} losOrder={module.los.map((l) => l.id)} />
          </Suspense>
          <ModuleWorkspace slug={module.slug} los={module.los} lectures={await getModuleLectures(module.id)} />
        </div>

        <aside className="min-w-0 flex-[1_1_260px] lg:sticky lg:top-24">
          <nav aria-label="In this module" className="space-y-3 rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-sm font-bold">In this module</h2>
            <ol className="space-y-2 text-sm">
              {module.los.map((l, i) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} className="flex gap-2 text-muted hover:text-accent">
                    <span className="tabular-nums font-semibold text-foreground">{i + 1}.</span>
                    <span className="line-clamp-3">{l.text}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </div>

      <nav aria-label="Modules" className="flex justify-between gap-4 border-t border-line pt-5 text-sm font-semibold">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="text-muted hover:text-accent">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/learn/${next.slug}`} className="text-right text-muted hover:text-accent">
            {next.title} →
          </Link>
        )}
      </nav>
    </div>
  );
}

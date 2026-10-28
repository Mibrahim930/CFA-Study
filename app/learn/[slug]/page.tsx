import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonView } from "@/components/lesson-view";
import { ModuleChecklist, ModuleWorkspace } from "@/components/module-workspace";
import { getHeldBackLos, getModuleLessons } from "@/lib/content/generated";
import { getModuleLectures } from "@/lib/content/videos";
import { getModule, syllabus } from "@/lib/syllabus";

async function GeneratedLessons({ topicId, moduleId, losOrder }: { topicId: string; moduleId: string; losOrder: string[] }) {
  const [lessons, heldBack] = await Promise.all([getModuleLessons(topicId, moduleId, losOrder), getHeldBackLos(topicId, moduleId)]);
  const notice = heldBack.length > 0 && (
    <p className="rounded-tile border border-warn/40 bg-warn/8 p-5 text-sm">
      <strong>
        {heldBack.length} lesson{heldBack.length === 1 ? " was" : "s were"} held back by the quality checks
      </strong>{" "}
      (a possible error was found) and will be regenerated. Use the lectures and checklist below for{" "}
      {heldBack.length === 1 ? "that outcome" : "those outcomes"} in the meantime.
    </p>
  );
  if (lessons.length === 0) {
    return (
      notice || (
        <p className="rounded-tile border border-dashed border-line bg-surface p-6 text-muted">
          Lessons for this module haven&apos;t been generated yet. Use the lectures, notes and checklist below in the meantime.
        </p>
      )
    );
  }
  return (
    <div className="space-y-12">
      {notice}
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
        <h1 className="display text-[2rem] sm:text-[2.5rem]">{module.title}</h1>
        <p className="text-sm text-muted">
          Module {module.order} of {topic.modules.length} · {module.los.length} learning outcome{module.los.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <div className="min-w-0 flex-[999_1_640px] space-y-12">
          <ModuleWorkspace slug={module.slug} lectures={await getModuleLectures(module.id)} />
          <Suspense fallback={<p className="text-muted">Loading lessons…</p>}>
            <GeneratedLessons topicId={topic.id} moduleId={module.id} losOrder={module.los.map((l) => l.id)} />
          </Suspense>
        </div>

        <aside aria-label="Module progress" className="min-w-0 flex-[1_1_260px] lg:sticky lg:top-24">
          <ModuleChecklist slug={module.slug} los={module.los} />
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

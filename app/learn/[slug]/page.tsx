import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleWorkspace } from "@/components/module-workspace";
import { getModule, syllabus } from "@/lib/syllabus";

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
    <div className="space-y-6">
      <div>
        <Link href={`/topics/${topic.id}`} className="text-sm text-muted hover:text-foreground">
          ← {topic.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          <span className="mr-2 text-muted tabular-nums">{module.order}.</span>
          {module.title}
        </h1>
      </div>
      <ModuleWorkspace slug={module.slug} los={module.los} />
      <nav className="flex justify-between gap-4 border-t border-line pt-4 text-sm">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="text-muted hover:text-foreground">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/learn/${next.slug}`} className="text-right text-muted hover:text-foreground">
            {next.title} →
          </Link>
        )}
      </nav>
    </div>
  );
}

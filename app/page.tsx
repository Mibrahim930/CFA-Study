import { TodayView, type TodayModule } from "@/components/today-view";
import { getDeck } from "@/lib/content/deck";
import type { TopicWeight } from "@/lib/progress";
import { topicsInStudyOrder } from "@/lib/syllabus";

export default async function TodayPage() {
  const deck = await getDeck();
  const withLessons = new Set(Object.values(deck).map((d) => d.moduleSlug));
  const topics = topicsInStudyOrder();
  const modules: TodayModule[] = topics.flatMap((t) =>
    t.modules.map((m) => ({
      slug: m.slug,
      title: m.title,
      order: m.order,
      topicId: t.id,
      topicName: t.name,
      topicModules: t.modules.length,
      hasLessons: withLessons.has(m.slug),
      losIds: m.los.map((l) => l.id),
    })),
  );
  const weights: TopicWeight[] = topics.map((t) => ({ id: t.id, name: t.name, weight: t.weight, moduleSlugs: t.modules.map((m) => m.slug) }));
  // Answer key for scoring the last mock on the client (only ids that are questions).
  const mockAnswers: Record<string, number> = {};
  for (const [id, d] of Object.entries(deck)) if (d.answer !== undefined) mockAnswers[id] = d.answer;
  return <TodayView modules={modules} topics={weights} mockAnswers={mockAnswers} />;
}

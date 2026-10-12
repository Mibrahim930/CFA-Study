import { TodayView, type TodayModule } from "@/components/today-view";
import { getDeck } from "@/lib/content/deck";
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
    })),
  );
  return <TodayView modules={modules} topics={topics.map((t) => ({ id: t.id, name: t.name }))} />;
}

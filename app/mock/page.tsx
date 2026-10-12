import type { Metadata } from "next";
import { MockExam } from "@/components/mock-exam";
import { getDeck } from "@/lib/content/deck";
import { syllabus } from "@/lib/syllabus";

export const metadata: Metadata = { title: "Mock exam" };

export default async function MockPage() {
  const deck = await getDeck();
  const topicNames = Object.fromEntries(syllabus.topics.map((t) => [t.id, t.name]));
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Mock exam</h1>
        <p className="text-muted">Timed practice from verified questions, at the real exam&apos;s pace. Wrong answers go to your review deck.</p>
      </div>
      <MockExam deck={deck} topicNames={topicNames} />
    </div>
  );
}

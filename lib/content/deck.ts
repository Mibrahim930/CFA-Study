import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import { syllabus } from "@/lib/syllabus";
import { getModuleLessons } from "./generated";

/** Everything the review page can show, keyed by review id ("<losId>:f2" / "<losId>:q3"). */
export interface DeckItem {
  front: string;
  back: string;
  /** For missed questions: the options, so the card shows the full question. */
  options?: string[];
  /** For questions: index of the correct option (mock exams score against it). */
  answer?: number;
  topicId: string;
  moduleTitle: string;
  moduleSlug: string;
}

export async function getDeck(): Promise<Record<string, DeckItem>> {
  "use cache";
  cacheLife("max");
  const deck: Record<string, DeckItem> = {};
  const root = join(process.cwd(), "content", "generated");
  const topics = existsSync(root) ? readdirSync(root) : [];
  for (const topic of syllabus.topics.filter((t) => topics.includes(t.id))) {
    for (const mod of topic.modules) {
      const lessons = await getModuleLessons(topic.id, mod.id, mod.los.map((l) => l.id));
      for (const l of lessons) {
        for (const f of l.flashcards) deck[`${l.losId}:${f.id}`] = { front: f.front, back: f.back, topicId: topic.id, moduleTitle: mod.title, moduleSlug: mod.slug };
        for (const q of l.mcqs) {
          const key = q.options[q.answerIndex];
          deck[`${l.losId}:${q.id}`] = {
            front: q.stem,
            options: q.options.map((o, i) => `${"ABC"[i]}. ${o.text}`),
            back: `${"ABC"[q.answerIndex]}. ${key.text}\n\n${key.explanation}`,
            answer: q.answerIndex,
            topicId: topic.id,
            moduleTitle: mod.title,
            moduleSlug: mod.slug,
          };
        }
      }
    }
  }
  return deck;
}

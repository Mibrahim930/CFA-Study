import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import type { Badge } from "./generated";

/** Beginner "Start here" primer for a topic (content-pipeline/generate-primer.ts). */
export interface Primer {
  topicId: string;
  overview: string;
  whyItMatters: string;
  prerequisites: string[];
  studyTips: string[];
  terms: { id: string; term: string; definition: string; example: string; badge: Badge }[];
  cards: { id: string; front: string; back: string; badge: Badge }[];
  sources: { id: string; title: string; locator: string; url: string; license: string }[];
  model: string;
}

export async function getPrimer(topicId: string): Promise<Primer | null> {
  "use cache";
  cacheLife("max");
  const file = join(process.cwd(), "content", "primers", `${topicId}.json`);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Primer) : null;
}

/** Review-deck id for a primer flashcard. */
export const primerCardId = (topicId: string, cardId: string) => `primer:${topicId}:${cardId}`;

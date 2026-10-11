import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cacheLife } from "next/cache";

/**
 * Verified pipeline output (content/generated/<topic>/<losId>.verified.json, written by
 * content-pipeline/verify.ts), reduced to what the app shows. Quarantined items never reach the UI.
 */

export type Badge = "grounded_verified" | "verified" | "model_only";

export interface ViewOption {
  text: string;
  explanation: string;
}

export interface ViewMcq {
  id: string;
  badge: Badge;
  kind: "concept" | "calc";
  difficulty: "easy" | "medium" | "hard";
  stem: string;
  options: ViewOption[];
  answerIndex: number;
}

export interface ViewSource {
  id: string;
  title: string;
  locator: string;
  url: string;
  license: string;
}

export interface ViewLesson {
  losId: string;
  losText: string;
  badge: Badge;
  title: string;
  summary: string;
  sections: { heading: string; body: string }[];
  workedExample: { problem: string; steps: string[]; answer: string };
  formulas: { name: string; latex: string; where: string }[];
  examTraps: string[];
  mcqs: ViewMcq[];
  flashcards: { id: string; badge: Badge; front: string; back: string }[];
  sources: ViewSource[];
  generatedBy: string;
}

type Checked<T> = { id: string; item: T; badge: Badge | "quarantined" | "pending" };
interface VerifiedFileShape {
  losId: string;
  losText: string;
  moduleId: string;
  generatedBy: string;
  retrieved: { id: string; title: string; locator: string; url: string; license: string }[];
  lesson: Checked<{
    title: string;
    summary: string;
    sections: { heading: string; body_markdown: string }[];
    worked_example: { problem: string; steps: string[]; answer: string };
    formulas: { name: string; latex: string; where: string }[];
    exam_traps: string[];
    cited_chunk_ids: string[];
  }>;
  mcqs: Checked<{ kind: "concept" | "calc"; difficulty: "easy" | "medium" | "hard"; stem: string; options: ViewOption[]; answer_index: number; cited_chunk_ids: string[] }>[];
  flashcards: Checked<{ front: string; back: string; cited_chunk_ids: string[] }>[];
}

const shown = <T,>(c: Checked<T>): c is Checked<T> & { badge: Badge } => c.badge !== "quarantined" && c.badge !== "pending";

function toView(f: VerifiedFileShape): ViewLesson | null {
  if (!shown(f.lesson)) return null;
  const l = f.lesson.item;
  const mcqs = f.mcqs.filter(shown);
  const cards = f.flashcards.filter(shown);
  const cited = new Set([...l.cited_chunk_ids, ...mcqs.flatMap((m) => m.item.cited_chunk_ids), ...cards.flatMap((c) => c.item.cited_chunk_ids)]);
  return {
    losId: f.losId,
    losText: f.losText,
    badge: f.lesson.badge,
    title: l.title,
    summary: l.summary,
    sections: l.sections.map((s) => ({ heading: s.heading, body: s.body_markdown })),
    workedExample: { problem: l.worked_example.problem, steps: l.worked_example.steps, answer: l.worked_example.answer },
    formulas: l.formulas,
    examTraps: l.exam_traps,
    mcqs: mcqs.map((m) => ({ id: m.id, badge: m.badge, kind: m.item.kind, difficulty: m.item.difficulty, stem: m.item.stem, options: m.item.options.map((o) => ({ text: o.text, explanation: o.explanation })), answerIndex: m.item.answer_index })),
    flashcards: cards.map((c) => ({ id: c.id, badge: c.badge, front: c.item.front, back: c.item.back })),
    sources: f.retrieved.filter((r) => cited.has(r.id)),
    generatedBy: f.generatedBy,
  };
}

/** Verified lessons for one module, in LOS order. Read once at build time. */
export async function getModuleLessons(topicId: string, moduleId: string, losOrder: string[]): Promise<ViewLesson[]> {
  "use cache";
  cacheLife("max");
  const dir = join(process.cwd(), "content", "generated", topicId);
  if (!existsSync(dir)) return [];
  const lessons = readdirSync(dir)
    // *.opus-pilot.verified.json are comparison copies, not app content.
    .filter((f) => f.endsWith(".verified.json") && !f.includes(".opus-pilot."))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as VerifiedFileShape)
    .filter((f) => f.moduleId === moduleId)
    .map(toView)
    .filter((l): l is ViewLesson => l !== null);
  return lessons.sort((a, b) => losOrder.indexOf(a.losId) - losOrder.indexOf(b.losId));
}

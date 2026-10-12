/**
 * Beginner primer per topic: plain-English overview, prerequisites, key terms and starter flashcards.
 *   npx tsx content-pipeline/generate-primer.ts            all topics without a primer yet
 *   npx tsx content-pipeline/generate-primer.ts --topic fsa --force
 * Checks, as for lessons: copy guard, IFRS 18 gate, grounding critic, and a second opinion before any
 * item is dropped. Writes content/primers/<topicId>.json.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import * as z from "zod/v4";
import { TOPICS } from "../lib/syllabus/topics";
import { callStructured, DEFAULT_MODEL, loadEnv, monthlyBudgetUsd, monthSpendUsd, type CallRecord } from "./lib/claude";
import { losForTopic, retrieve } from "./lib/context";
import { copyGuard, ifrs18Gate, type CopyRef } from "./lib/gates";
import { GroundingSchema } from "./lib/schema";
import { CONFIRM_SYSTEM, ConfirmSchema, CRITIC_SYSTEM } from "./verify";

const PrimerSchema = z.object({
  overview: z.string().describe("2–3 short paragraphs, plain English: what this topic is about and how its parts fit together"),
  why_it_matters: z.string().describe("1–2 sentences: why it matters for the exam and for a finance career"),
  prerequisites: z.array(z.string()).describe("3–6 background skills a beginner needs first (maths, accounting, vocabulary)"),
  key_terms: z.array(z.object({ term: z.string(), definition: z.string(), example: z.string().describe("A concrete everyday or numeric example"), cited_chunk_ids: z.array(z.string()) })).describe("14–20 foundational terms"),
  flashcards: z.array(z.object({ front: z.string(), back: z.string(), cited_chunk_ids: z.array(z.string()) })).describe("15–20 starter cards"),
  study_tips: z.array(z.string()).describe("3–5 practical tips for learning this topic"),
});

const SYSTEM = `You write the "Start here" beginner primer for one CFA® Level I topic in "L1 Study", a private app for one complete beginner (bachelor's degree, no finance or accounting background).
The primer comes BEFORE the topic's lessons: it gives the vocabulary and mental model the lessons assume. Keep it foundational and accurate; teach what the 2027 Level I curriculum expects, not advanced material.
- Write everything in your own words; never copy sentences from the passages. Cite passage ids only where a passage truly supports the item; otherwise leave cited_chunk_ids empty.
- Define terms the way the Level I curriculum uses them. Examples must be concrete (numbers where natural). No IFRS 18 concepts.
- Flashcards: one idea per card; front is a question, back a short answer. Cover the key terms and the core relationships (e.g. "What happens to bond prices when yields rise?").
- Inline math as $...$ (KaTeX). Currency as plain text like "$100".

## Write for someone with ZERO finance background
- Assume the reader knows everyday money (a pay cheque, a savings account, a loan, a shop's prices) and school maths, and nothing else.
- Define every finance or accounting word in everyday words the first time it appears, even common ones like "asset", "equity", "yield" or "portfolio". Never define a term using another undefined term.
- Short sentences (aim for under 20 words). Active voice. One idea per sentence.
- Give an everyday analogy for each abstract idea (e.g. a bond as an IOU that pays interest, diversification as not putting all your eggs in one basket).
- Examples use familiar situations and small, round numbers before any formula.
- Prerequisites must say how to pick each skill up quickly, not just name it.`;

const EDITOR_SYSTEM = `You are a plain-language editor. You receive a draft beginner primer as JSON. Its reader has NO finance or accounting background.
Rewrite it so a complete beginner can follow every sentence:
- replace or define any jargon that is used before it is explained;
- shorten long sentences;
- add an everyday analogy where an idea is abstract;
- keep examples concrete.
Keep every fact, number, formula and cited_chunk_ids exactly as they are: change wording, not meaning. Keep the same number of key terms and flashcards, in the same order. Return the full revised primer.`;

async function primerFor(topicId: string, model: string) {
  const all = losForTopic(topicId);
  const topic = all[0].topic;
  // The top passages for each module's first LOS, so every part of the topic is represented.
  const seen = new Set<string>();
  const hits = topic.modules.flatMap((m) => retrieve({ topic, module: m, los: m.los[0] }, 3)).filter(({ chunk }) => !seen.has(chunk.id) && seen.add(chunk.id));
  const passages = hits.map(({ chunk }) => `<passage id="${chunk.id}" source="${chunk.title}, ${chunk.locator}">\n${chunk.text.trim()}\n</passage>`).join("\n\n");
  const usage: CallRecord[] = [];
  const call = async <S extends z.ZodType>(purpose: string, schema: S, system: string, user: string) => {
    const { data, record } = await callStructured({ purpose, losId: `primer:${topicId}`, schema, system, user, model, effort: "high" });
    usage.push(record);
    return data;
  };

  const draft = await call("primer", PrimerSchema, SYSTEM, `Topic: ${topic.name} (exam weight ${topic.weight.min}–${topic.weight.max}%)\nModules:\n${topic.modules.map((m) => `- ${m.title}`).join("\n")}\n\nSource passages:\n${passages}`);
  // Plain-language pass for a reader with no finance background; the accuracy checks below run on this version.
  const edited = await call("primer-editor", PrimerSchema, EDITOR_SYSTEM, JSON.stringify(draft));
  const p = edited.key_terms.length === draft.key_terms.length && edited.flashcards.length === draft.flashcards.length ? edited : draft;

  // Deterministic gates: copying and IFRS 18.
  const refs: CopyRef[] = hits.map(({ chunk }) => ({ label: `${chunk.title} ${chunk.locator}`, text: chunk.text, maxRun: chunk.reuse === "ground" ? 8 : 15 }));
  const ok = (text: string) => copyGuard(text, refs).length === 0 && ifrs18Gate(text).length === 0;
  const terms = p.key_terms.map((t, i) => ({ ...t, id: `t${i + 1}` })).filter((t) => ok(`${t.term} ${t.definition} ${t.example}`));
  const cards = p.flashcards.map((c, i) => ({ ...c, id: `c${i + 1}` })).filter((c) => ok(`${c.front} ${c.back}`));

  // Grounding critic, then a second opinion on anything flagged; only confirmed errors are dropped.
  const items = [
    ...terms.map((t) => `<item id="${t.id}" cites="${t.cited_chunk_ids.join(",")}">\n${t.term}: ${t.definition}\nExample: ${t.example}\n</item>`),
    ...cards.map((c) => `<item id="${c.id}" cites="${c.cited_chunk_ids.join(",")}">\nQ: ${c.front}\nA: ${c.back}\n</item>`),
  ];
  const g = await call("primer-grounding", GroundingSchema, CRITIC_SYSTEM, `Source passages:\n${passages}\n\nItems to review:\n${items.join("\n\n")}`);
  const verdicts = new Map(g.verdicts.map((v) => [v.id, v]));
  const flagged = [...verdicts.values()].filter((v) => v.error_found || v.verdict === "contradicted");
  const confirmed = new Set<string>();
  if (flagged.length) {
    const blocks = flagged.map((v) => `${items.find((x) => x.includes(`id="${v.id}"`))}\n<flagged_error id="${v.id}">${v.note}</flagged_error>`);
    const c = await call("primer-confirm", ConfirmSchema, CONFIRM_SYSTEM, blocks.join("\n\n"));
    for (const v of c.verdicts) if (v.real_error) confirmed.add(v.id);
  }
  const badge = (id: string) => (verdicts.get(id)?.verdict === "supported" ? "grounded_verified" : "model_only");
  const cited = new Set([...terms, ...cards].flatMap((x) => x.cited_chunk_ids));

  return {
    topicId,
    generatedAt: new Date().toISOString(),
    model: usage[0]?.servedModel ?? model,
    overview: p.overview,
    whyItMatters: p.why_it_matters,
    prerequisites: p.prerequisites,
    studyTips: p.study_tips,
    terms: terms.filter((t) => !confirmed.has(t.id)).map((t) => ({ id: t.id, term: t.term, definition: t.definition, example: t.example, badge: badge(t.id) })),
    cards: cards.filter((c) => !confirmed.has(c.id)).map((c) => ({ id: c.id, front: c.front, back: c.back, badge: badge(c.id) })),
    dropped: { copyOrIfrs18: p.key_terms.length + p.flashcards.length - terms.length - cards.length, confirmedErrors: confirmed.size },
    sources: hits.filter(({ chunk }) => cited.has(chunk.id)).map(({ chunk }) => ({ id: chunk.id, title: chunk.title, locator: chunk.locator, url: chunk.url, license: chunk.license })),
    costUsd: usage.reduce((s, r) => s + r.costUsd, 0),
  };
}

async function main() {
  const { values } = parseArgs({ options: { topic: { type: "string", multiple: true }, force: { type: "boolean", default: false }, model: { type: "string", default: DEFAULT_MODEL } } });
  loadEnv();
  const ids = values.topic ?? TOPICS.map((t) => t.id);
  console.log(`Model ${values.model}. Spent this month: $${monthSpendUsd().toFixed(2)} of $${monthlyBudgetUsd().toFixed(2)}.`);
  mkdirSync(join("content", "primers"), { recursive: true });
  for (const id of ids) {
    const out = join("content", "primers", `${id}.json`);
    if (existsSync(out) && !values.force) {
      console.log(`skip ${id} (exists)`);
      continue;
    }
    const primer = await primerFor(id, values.model);
    writeFileSync(out, JSON.stringify(primer, null, 2) + "\n");
    console.log(`${id}: ${primer.terms.length} terms, ${primer.cards.length} cards, dropped ${JSON.stringify(primer.dropped)} | $${primer.costUsd.toFixed(4)}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as z from "zod";
import { CALCS } from "../../lib/finance/registry";
import { Bm25Index } from "../../lib/kb/search";
import type { SourceChunk } from "../../lib/kb/types";
import syllabusJson from "../../content/syllabus-2027.json";
import type { Los, Module, Syllabus, Topic } from "../../lib/syllabus/types";

/** Shared loaders for generate.ts and verify.ts. */

const syllabus = syllabusJson as Syllabus;
const CORPUS_DIR = join("sources", "corpus");

export interface LosContext {
  topic: Topic;
  module: Module;
  los: Los;
}

export function findLos(losId: string): LosContext {
  for (const topic of syllabus.topics) {
    for (const mod of topic.modules) {
      const los = mod.los.find((l) => l.id === losId);
      if (los) return { topic, module: mod, los };
    }
  }
  throw new Error(`Unknown LOS id "${losId}"`);
}

export function losForTopic(topicId: string): LosContext[] {
  const topic = syllabus.topics.find((t) => t.id === topicId);
  if (!topic) throw new Error(`Unknown topic "${topicId}"`);
  return topic.modules.flatMap((mod) => mod.los.map((los) => ({ topic, module: mod, los })));
}

let corpus: SourceChunk[] | undefined;
/** Every sources/corpus/*.jsonl file: OpenStax (npm run ingest:openstax) plus PDFs (npm run ingest:sources). */
export function loadCorpus(): SourceChunk[] {
  if (!corpus) {
    const files = existsSync(CORPUS_DIR) ? readdirSync(CORPUS_DIR).filter((f) => f.endsWith(".jsonl")) : [];
    if (!files.includes("openstax.jsonl")) throw new Error(`${CORPUS_DIR}/openstax.jsonl is missing. Run: npm run ingest:openstax`);
    corpus = files.flatMap((f) =>
      readFileSync(join(CORPUS_DIR, f), "utf8")
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l) as SourceChunk),
    );
  }
  return corpus;
}

/** Topics each OpenStax book serves (PDF sources carry their own `topics`). */
const OPENSTAX_TOPICS: Record<string, string[]> = {
  "Principles of Finance 2e": ["quant", "corpfin", "equity", "fixed-income", "derivatives", "portfolio"],
  "Introductory Business Statistics 2e": ["quant"],
  "Principles of Data Science": ["quant"],
  "Principles of Accounting, Volume 1: Financial Accounting": ["fsa"],
  "Principles of Economics 3e": ["econ"],
  "Principles of Management": ["corpfin", "equity"],
};

export function servesTopic(chunk: SourceChunk, topicId: string): boolean {
  return (chunk.topics ?? OPENSTAX_TOPICS[chunk.title] ?? []).includes(topicId);
}

const indexes = new Map<string, Bm25Index>();
/** BM25 over the chunks that serve this LOS's topic. */
export function retrieve(ctx: LosContext, k = 10): { chunk: SourceChunk; score: number }[] {
  let index = indexes.get(ctx.topic.id);
  if (!index) {
    index = new Bm25Index(loadCorpus().filter((c) => servesTopic(c, ctx.topic.id)));
    indexes.set(ctx.topic.id, index);
  }
  return index.search(`${ctx.module.title} ${ctx.los.text}`, k);
}

export function chunksById(ids: string[]): Map<string, SourceChunk> {
  const want = new Set(ids);
  return new Map(loadCorpus().filter((c) => want.has(c.id)).map((c) => [c.id, c]));
}

type JsonSchema = { type?: string; properties?: Record<string, JsonSchema>; required?: string[]; default?: unknown; enum?: unknown[]; anyOf?: JsonSchema[]; const?: unknown; items?: JsonSchema };

function describeArg(s: JsonSchema): string {
  if (s.anyOf) return s.anyOf.map(describeArg).join("|");
  if (s.const !== undefined) return JSON.stringify(s.const);
  if (s.enum) return s.enum.map((e) => JSON.stringify(e)).join("|");
  if (s.type === "array") return `${describeArg(s.items ?? {})}[]`;
  if (s.type === "object" && s.properties) {
    return `{${Object.entries(s.properties)
      .map(([k, v]) => `${k}${v.default !== undefined ? `=${JSON.stringify(v.default)}` : ""}: ${describeArg(v)}`)
      .join(", ")}}`;
  }
  return s.type ?? "any";
}

/** Compact catalog of finance-engine functions the generator may reference in calc_spec. */
export function calcCatalog(): string {
  return Object.entries(CALCS)
    .map(([name, e]) => `- ${name}: ${e.description}. args ${describeArg(z.toJSONSchema(e.args, { io: "input" }) as JsonSchema)}`)
    .join("\n");
}

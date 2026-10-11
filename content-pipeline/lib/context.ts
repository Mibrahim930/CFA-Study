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
  // Ch. 5–6 cover financial statements and ratio analysis (incl. common-size statements and DuPont).
  "Principles of Finance 2e": ["quant", "fsa", "corpfin", "equity", "fixed-income", "derivatives", "portfolio"],
  "Introductory Business Statistics 2e": ["quant"],
  "Principles of Data Science": ["quant"],
  "Principles of Accounting, Volume 1: Financial Accounting": ["fsa"],
  // Market structure chapters (concentration ratio, HHI) serve equity industry analysis too.
  "Principles of Economics 3e": ["econ", "equity"],
  "Principles of Management": ["corpfin", "equity"],
};

export function servesTopic(chunk: SourceChunk, topicId: string): boolean {
  return (chunk.topics ?? OPENSTAX_TOPICS[chunk.title] ?? []).includes(topicId);
}

const LOS_VERBS = /^(?:and\s+|or\s+)?(?:(?:describe|explain|calculate|interpret|compare|contrast|evaluate|identify|discuss|demonstrate|distinguish|formulate|recommend|determine|analyze|define|construct|estimate|apply|justify)(?:,\s*|\s+and\s+|\s+|$))+/i;

/**
 * Split an LOS into its parts so each gets its own search, e.g. "present value of fixed-income and
 * equity instruments" → also "fixed-income instruments", "equity instruments". Exported for tests.
 */
export function losFacets(text: string): string[] {
  // "measures of (1) central tendency and (2) dispersion" → "measures of central tendency", "measures of dispersion"
  const numbered = text.match(/^(.*?)\(1\)(.*)$/i);
  const clauses = numbered
    ? numbered[2].split(/\(\d\)/).map((part) => `${numbered[1].replace(LOS_VERBS, "")} ${part}`)
    : text.split(/[,;]|\band\b(?=\s+(?:describe|explain|calculate|interpret|compare|evaluate|identify|discuss|demonstrate|distinguish))/i);
  const facets = new Set(
    clauses
      .map((c) => c.trim().replace(LOS_VERBS, "").replace(/\s+(?:and|or|of|the)\s*$/i, "").trim())
      .filter((c) => c.replace(/[^a-z]/gi, "").length >= 5),
  );
  // "X of A and B <noun>" → "A <noun>" and "B <noun>" so each object of a shared head gets searched.
  const m = text.match(/\bof\s+([\w-]+)\s+and\s+([\w-]+)\s+(\w+)/i);
  if (m) {
    facets.add(`${m[1]} ${m[3]}`);
    facets.add(`${m[2]} ${m[3]}`);
  }
  facets.delete(text);
  return [...facets];
}

/** Curriculum wording → textbook wording, so keyword search can bridge the two vocabularies. */
const SYNONYMS: [RegExp, string][] = [
  [/\bequity\b|\bequities\b/i, "stock shares dividend"],
  [/\bfixed[- ]income\b/i, "bond coupon"],
  [/\bissuers?\b/i, "company firm"],
  [/\bdispersion\b/i, "variance standard deviation range"],
  [/\bcentral tendency\b/i, "mean median mode"],
  [/\bimplied return\b/i, "yield internal rate of return"],
  [/\bcontingent claims?\b/i, "options"],
  [/\bforward commitments?\b/i, "forwards futures swaps"],
  [/\bcommon-size\b/i, "vertical analysis percentage of revenue"],
];

export const expandQuery = (q: string) => [q, ...SYNONYMS.filter(([re]) => re.test(q)).map(([, s]) => s)].join(" ");

let hints: Map<string, string[]> | undefined;
/**
 * Gap-directed queries: every coverage audit (content/coverage/coverage*.json) lists what the library
 * lacked for each LOS. Those phrases are exactly the textbook vocabulary the LOS needs, so they are
 * searched too, which pulls in sources added after the audit even when the LOS wording ranks them low.
 */
export function auditHints(losId: string): string[] {
  if (!hints) {
    hints = new Map();
    const dir = join("content", "coverage");
    const files = existsSync(dir) ? readdirSync(dir).filter((f) => /^coverage.*\.json$/.test(f)) : [];
    for (const f of files) {
      const results = JSON.parse(readFileSync(join(dir, f), "utf8")) as Record<string, { missing?: string[] }>;
      for (const [id, r] of Object.entries(results)) {
        const set = new Set([...(hints.get(id) ?? []), ...(r.missing ?? [])]);
        hints.set(id, [...set]);
      }
    }
  }
  return hints.get(losId) ?? [];
}

/**
 * Passages per LOS. Generation and the coverage audit share it, so the audit grades exactly what the
 * generator sees. Raised from 10 (generate) / 6 (audit) after the first audit flagged search misses.
 */
export const RETRIEVE_K = 12;

const indexes = new Map<string, Bm25Index>();
/**
 * BM25 over the chunks that serve this LOS's topic. The full LOS query and each facet are searched
 * separately and merged by reciprocal rank fusion, so one part of a multi-part LOS can't crowd out the rest.
 */
export function retrieve(ctx: LosContext, k = RETRIEVE_K): { chunk: SourceChunk; score: number }[] {
  let index = indexes.get(ctx.topic.id);
  if (!index) {
    index = new Bm25Index(loadCorpus().filter((c) => servesTopic(c, ctx.topic.id)));
    indexes.set(ctx.topic.id, index);
  }
  const queries = [`${ctx.module.title} ${ctx.los.text}`, ...losFacets(ctx.los.text), ...auditHints(ctx.los.id)].map(expandQuery);
  const fused = new Map<string, { chunk: SourceChunk; score: number }>();
  for (const q of queries) {
    index.search(q, k).forEach(({ chunk }, rank) => {
      const prev = fused.get(chunk.id);
      fused.set(chunk.id, { chunk, score: (prev?.score ?? 0) + 1 / (60 + rank) });
    });
  }
  return [...fused.values()].sort((a, b) => b.score - a.score).slice(0, k);
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

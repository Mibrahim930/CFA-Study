/**
 * Coverage audit: does the corpus actually cover each learning objective? (step 2 of the source plan)
 *   npm run coverage -- --sample 10          one LOS per topic: measure cost first
 *   npm run coverage                          every LOS not yet audited
 *   npm run coverage -- --topic ethics --force
 *   npm run coverage -- --report-only         rebuild docs/coverage-report.md from saved results
 * Results: content/coverage/coverage.json (resumable). Report: docs/coverage-report.md.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import * as z from "zod/v4";
import { callStructured, DEFAULT_MODEL, loadEnv, monthlyBudgetUsd, monthSpendUsd } from "./lib/claude";
import { findLos, losForTopic, retrieve, RETRIEVE_K, type LosContext } from "./lib/context";
import { TOPICS } from "../lib/syllabus/topics";

const RESULTS = "content/coverage/coverage.json";
const REPORT = "docs/coverage-report.md";
const PASSAGES = RETRIEVE_K;

const CoverageSchema = z.object({
  coverage: z.enum(["full", "partial", "none"]),
  covered: z.array(z.string()).describe("Short phrases: what the passages do cover for this LOS"),
  missing: z.array(z.string()).describe("Short phrases: what a Level I candidate needs that the passages lack"),
  useful_chunk_ids: z.array(z.string()),
  note: z.string().describe("One sentence"),
});

const SYSTEM = `You audit a study library for the CFA® Level I exam. For one learning objective (LOS) you receive the passages a search returned from the library.
Judge whether these passages, taken together, give a beginner enough to learn what Level I expects for this LOS:
- full: the core concepts, definitions and (if the LOS says calculate) the method are all present.
- partial: some core content is present but important parts are missing.
- none: the passages are off-topic or too thin to teach from.
Be strict: related words are not coverage. List what is covered and what is missing as short phrases, and list the ids of passages that are genuinely useful.`;

interface Result extends z.infer<typeof CoverageSchema> {
  losId: string;
  topicId: string;
  moduleTitle: string;
  losText: string;
  retrieved: { id: string; title: string; locator: string }[];
  costUsd: number;
  auditedAt: string;
}

type Results = Record<string, Result>;

function load(): Results {
  return existsSync(RESULTS) ? (JSON.parse(readFileSync(RESULTS, "utf8")) as Results) : {};
}

function save(results: Results) {
  mkdirSync(dirname(RESULTS), { recursive: true });
  writeFileSync(RESULTS, JSON.stringify(results, null, 2) + "\n");
}

async function audit(ctx: LosContext, model: string): Promise<Result> {
  const hits = retrieve(ctx, PASSAGES);
  const passages = hits.map(({ chunk }) => `<passage id="${chunk.id}" source="${chunk.title}, ${chunk.locator}">\n${chunk.text.trim()}\n</passage>`);
  const user = `Topic: ${ctx.topic.name}\nModule: ${ctx.module.title}\nLOS ${ctx.los.id}: ${ctx.los.text}\n\nPassages (${hits.length}):\n${passages.join("\n\n") || "(none found)"}`;
  const { data, record } = await callStructured({ purpose: "coverage", losId: ctx.los.id, schema: CoverageSchema, system: SYSTEM, user, model, effort: "low", maxTokens: 8000 });
  return {
    ...data,
    losId: ctx.los.id,
    topicId: ctx.topic.id,
    moduleTitle: ctx.module.title,
    losText: ctx.los.text,
    retrieved: hits.map(({ chunk }) => ({ id: chunk.id, title: chunk.title, locator: chunk.locator })),
    costUsd: record.costUsd,
    auditedAt: record.at,
  };
}

/** One LOS per topic per round (spread across each topic's list) until n are chosen. */
function sample(n: number): LosContext[] {
  const perTopic = TOPICS.map((t) => losForTopic(t.id));
  const picked: LosContext[] = [];
  for (let round = 0; picked.length < n && round < 50; round++) {
    for (const list of perTopic) {
      if (picked.length >= n) break;
      const ctx = list[Math.floor((((round * 7 + 3) % 17) / 17) * list.length)];
      if (ctx && !picked.includes(ctx)) picked.push(ctx);
    }
  }
  return picked;
}

function writeReport(results: Results) {
  const rows = Object.values(results);
  const lines = [
    "# Corpus coverage report",
    "",
    `Generated ${new Date().toISOString().slice(0, 10)} by \`content-pipeline/coverage.ts\`. ${rows.length} LOS audited.`,
    `Each LOS was judged by ${DEFAULT_MODEL} against the top ${PASSAGES} passages the pipeline's search returns. "Full" means the library can ground that LOS; "none" means generated content for it would be model-only.`,
    "",
    "| Topic | Audited | Full | Partial | None |",
    "|---|---|---|---|---|",
  ];
  for (const t of TOPICS) {
    const r = rows.filter((x) => x.topicId === t.id);
    const n = (c: string) => r.filter((x) => x.coverage === c).length;
    lines.push(`| ${t.name} | ${r.length}/${losForTopic(t.id).length} | ${n("full")} | ${n("partial")} | ${n("none")} |`);
  }
  lines.push("", "## Gaps by topic", "");
  for (const t of TOPICS) {
    const gaps = rows.filter((x) => x.topicId === t.id && x.coverage !== "full");
    if (!gaps.length) continue;
    lines.push(`### ${t.name}`, "");
    for (const g of gaps) lines.push(`- **${g.losId}** (${g.coverage}): ${g.losText}`, `  - Missing: ${g.missing.join("; ") || "unspecified"}`);
    lines.push("");
  }
  const cost = rows.reduce((s, r) => s + r.costUsd, 0);
  lines.push(`Audit cost so far: $${cost.toFixed(2)}.`);
  writeFileSync(REPORT, lines.join("\n") + "\n");
}

async function main() {
  const { values } = parseArgs({
    options: {
      los: { type: "string", multiple: true },
      topic: { type: "string" },
      sample: { type: "string" },
      model: { type: "string", default: DEFAULT_MODEL },
      concurrency: { type: "string", default: "4" },
      force: { type: "boolean", default: false },
      "report-only": { type: "boolean", default: false },
    },
  });
  const results = load();
  if (values["report-only"]) {
    writeReport(results);
    console.log(`Wrote ${REPORT}`);
    return;
  }
  loadEnv();

  let targets: LosContext[];
  if (values.sample) targets = sample(Number(values.sample));
  else if (values.topic) targets = losForTopic(values.topic);
  else if (values.los) targets = values.los.flatMap((s) => s.split(",")).map(findLos);
  else targets = TOPICS.flatMap((t) => losForTopic(t.id));
  if (!values.force) targets = targets.filter((c) => !results[c.los.id]);

  console.log(`${targets.length} LOS to audit with ${values.model}. Spent this month: $${monthSpendUsd().toFixed(2)} of $${monthlyBudgetUsd().toFixed(2)}.`);
  let next = 0;
  let runCost = 0;
  const worker = async () => {
    while (next < targets.length) {
      const ctx = targets[next++];
      const r = await audit(ctx, values.model);
      results[r.losId] = r;
      runCost += r.costUsd;
      save(results);
      console.log(`${r.losId.padEnd(18)} ${r.coverage.padEnd(8)} $${r.costUsd.toFixed(4)}  ${r.note}`);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Number(values.concurrency)) }, worker));
  writeReport(results);
  console.log(`\nRun cost $${runCost.toFixed(4)} for ${targets.length} LOS (avg $${(runCost / Math.max(1, targets.length)).toFixed(4)}). Report: ${REPORT}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

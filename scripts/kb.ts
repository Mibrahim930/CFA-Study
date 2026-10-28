/**
 * Knowledge-base CLI over the verified lessons (content/generated/<topic>/<losId>.verified.json), the
 * beginner primers (content/primers) and the finance engine. Used by the "l1-expert" skill
 * (.claude/skills/l1-expert/SKILL.md) so that answers come from verified notes and numbers from code.
 *
 *   npm run kb -- search "money-weighted return" [--topic quant] [--k 8]
 *   npm run kb -- los quant-01-los1
 *   npm run kb -- module quant-04            (a module id or slug: its outcomes and lesson titles)
 *   npm run kb -- formulas "duration"
 *   npm run kb -- calc bondPrice '{"bond":{"couponRate":0.05,"years":10},"ytm":0.06}'
 *   npm run kb -- calc --list
 *
 * Read-only. Output is Markdown. Quarantined and pending items are never shown.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CALCS, runCalc } from "../lib/finance/registry";
import { Bm25Index } from "../lib/kb/search";
import type { SourceChunk } from "../lib/kb/types";

type Badge = "grounded_verified" | "verified" | "model_only" | "quarantined" | "pending";
interface Checked<T> {
  id: string;
  item: T;
  badge: Badge;
}
interface Source {
  id: string;
  title: string;
  locator: string;
  url: string;
  license: string;
  year?: number;
}
interface Verified {
  losId: string;
  losText: string;
  moduleId: string;
  moduleTitle: string;
  generatedBy: string;
  verifiedAt: string;
  retrieved: Source[];
  lesson: Checked<{
    title: string;
    summary: string;
    sections: { heading: string; body_markdown: string }[];
    worked_example: { problem: string; steps: string[]; answer: string; calc_spec: { fn: string; args_json: string } | null };
    formulas: { name: string; latex: string; where: string }[];
    exam_traps: string[];
    builds_on: string[];
    leads_to: string[];
    cited_chunk_ids: string[];
  }>;
  mcqs: Checked<{ kind: string; difficulty: string; stem: string; options: { text: string; explanation: string }[]; answer_index: number; calc_spec: { fn: string; args_json: string } | null }>[];
  flashcards: Checked<{ front: string; back: string }>[];
  warnings?: string[];
}
interface Primer {
  topicId: string;
  overview: string;
  whyItMatters: string;
  prerequisites: string[];
  studyTips: string[];
  terms: { id: string; term: string; definition: string; example: string; badge: Badge }[];
  cards: { id: string; front: string; back: string; badge: Badge }[];
}
interface Syllabus {
  curriculumYear: number;
  topics: { id: string; name: string; weight: { min: number; max: number }; modules: { id: string; slug: string; order: number; title: string; los: { id: string; text: string }[] }[] }[];
}

const ROOT = join(__dirname, "..");
const shown = (b: Badge) => b !== "quarantined" && b !== "pending";
const BADGE_TEXT: Record<Badge, string> = {
  grounded_verified: "Grounded + verified (cited source, every check passed)",
  verified: "Math verified (engine recomputed; no cited source)",
  model_only: "AI-only (checks passed, no source in the library backs it)",
  quarantined: "QUARANTINED (not shown in the app)",
  pending: "pending verification",
};

const syllabus = JSON.parse(readFileSync(join(ROOT, "content", "syllabus-2027.json"), "utf8")) as Syllabus;
const topicOf = new Map<string, { id: string; name: string }>();
for (const t of syllabus.topics) for (const m of t.modules) topicOf.set(m.id, { id: t.id, name: t.name });

function loadLessons(): Verified[] {
  const root = join(ROOT, "content", "generated");
  const out: Verified[] = [];
  for (const topic of existsSync(root) ? readdirSync(root) : []) {
    const dir = join(root, topic);
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".verified.json") || f.includes(".opus-pilot.")) continue;
      out.push(JSON.parse(readFileSync(join(dir, f), "utf8")) as Verified);
    }
  }
  return out.sort((a, b) => a.losId.localeCompare(b.losId));
}

function loadPrimers(): Primer[] {
  const dir = join(ROOT, "content", "primers");
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as Primer) : [];
}

/** One searchable document per LOS (lesson text, formulas, traps, flashcards) and one per primer. */
function buildIndex(lessons: Verified[], primers: Primer[]) {
  const chunks: SourceChunk[] = [];
  for (const v of lessons) {
    if (!shown(v.lesson.badge)) continue;
    const l = v.lesson.item;
    const text = [
      v.losText,
      l.title,
      l.summary,
      ...l.sections.map((s) => `${s.heading} ${s.body_markdown}`),
      ...l.formulas.map((f) => `${f.name} ${f.where}`),
      ...l.exam_traps,
      ...v.flashcards.filter((c) => shown(c.badge)).map((c) => `${c.item.front} ${c.item.back}`),
    ].join("\n");
    chunks.push({ id: v.losId, source: "other", tier: "T2", title: l.title, locator: v.moduleTitle, url: "", license: "", reuse: "ground", text, topics: [topicOf.get(v.moduleId)?.id ?? ""] });
  }
  for (const p of primers) {
    const text = [p.overview, p.whyItMatters, ...p.prerequisites, ...p.studyTips, ...p.terms.map((t) => `${t.term} ${t.definition} ${t.example}`)].join("\n");
    chunks.push({ id: `primer:${p.topicId}`, source: "other", tier: "T2", title: `Beginner primer: ${syllabus.topics.find((t) => t.id === p.topicId)?.name ?? p.topicId}`, locator: "Start here", url: "", license: "", reuse: "ground", text, topics: [p.topicId] });
  }
  return new Bm25Index(chunks);
}

const flag = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const positional = process.argv.slice(2).filter((a, i, arr) => !a.startsWith("--") && !(i > 0 && arr[i - 1].startsWith("--") && !["list"].includes(arr[i - 1].slice(2))));

function cmdSearch(query: string) {
  const lessons = loadLessons();
  const byId = new Map(lessons.map((v) => [v.losId, v]));
  const index = buildIndex(lessons, loadPrimers());
  const topic = flag("topic");
  const k = Number(flag("k") ?? 8);
  const hits = index.search(query, topic ? 200 : k).filter((h) => !topic || h.chunk.topics?.includes(topic)).slice(0, k);
  if (!hits.length) return console.log(`No verified notes match "${query}". Say so rather than guessing.`);
  console.log(`# Verified notes for "${query}"${topic ? ` (topic ${topic})` : ""}\n`);
  hits.forEach((h, i) => {
    const v = byId.get(h.chunk.id);
    if (!v) return console.log(`${i + 1}. **${h.chunk.title}** (\`${h.chunk.id}\`): ${h.chunk.text.split("\n")[0].slice(0, 200)}\n`);
    const l = v.lesson.item;
    const formulas = l.formulas.length ? ` Formulas: ${l.formulas.map((f) => f.name).join("; ")}.` : "";
    console.log(`${i + 1}. **${l.title}** (\`${v.losId}\`, ${v.moduleTitle}) · ${BADGE_TEXT[v.lesson.badge].split(" (")[0]}\n   LOS: ${v.losText}\n   ${l.summary}${formulas}\n`);
  });
  console.log(`Open one with: npm run kb -- los <losId>`);
}

function cmdLos(losId: string) {
  const v = loadLessons().find((x) => x.losId === losId);
  if (!v) return console.log(`No verified lesson for "${losId}".`);
  const t = topicOf.get(v.moduleId);
  const l = v.lesson.item;
  const lines: string[] = [];
  lines.push(`# ${l.title}`, "");
  lines.push(`- LOS \`${v.losId}\` (${t?.name ?? "?"} · ${v.moduleTitle}, \`${v.moduleId}\`): ${v.losText}`);
  lines.push(`- Lesson badge: ${BADGE_TEXT[v.lesson.badge]}`);
  lines.push(`- Written by ${v.generatedBy}, verified ${v.verifiedAt.slice(0, 10)}; original wording, numbers recomputed by lib/finance.`);
  if (!shown(v.lesson.badge)) lines.push(`- **The lesson itself is ${v.lesson.badge}: do not rely on it.**`);
  if (v.warnings?.length) lines.push(`- Warnings: ${v.warnings.join(" | ")}`);
  lines.push("", `**Summary.** ${l.summary}`, "");
  for (const s of l.sections) lines.push(`## ${s.heading}`, "", s.body_markdown, "");
  if (l.formulas.length) {
    lines.push("## Formulas", "");
    for (const f of l.formulas) lines.push(`- **${f.name}**: $${f.latex}$ — ${f.where}`);
    lines.push("");
  }
  lines.push("## Worked example", "", l.worked_example.problem, "");
  l.worked_example.steps.forEach((s, i) => lines.push(`${i + 1}. ${s.replace(/^\s*(step\s*)?\d+[.):]\s*/i, "")}`));
  lines.push("", `**Answer:** ${l.worked_example.answer}`);
  if (l.worked_example.calc_spec) lines.push(`Engine check: \`npm run kb -- calc ${l.worked_example.calc_spec.fn} '${l.worked_example.calc_spec.args_json}'\``);
  lines.push("");
  if (l.exam_traps.length) lines.push("## Exam traps", "", ...l.exam_traps.map((x) => `- ${x}`), "");
  if (l.builds_on.length || l.leads_to.length) lines.push(`Builds on: ${l.builds_on.join("; ") || "—"}. Leads to: ${l.leads_to.join("; ") || "—"}.`, "");
  const cards = v.flashcards.filter((c) => shown(c.badge));
  if (cards.length) lines.push("## Flashcards", "", ...cards.map((c) => `- **${c.item.front}** ${c.item.back} _(${c.badge})_`), "");
  const mcqs = v.mcqs.filter((m) => shown(m.badge));
  lines.push("## Practice questions", "");
  mcqs.forEach((m, i) => {
    lines.push(`${i + 1}. ${m.item.stem} _(${m.item.kind}, ${m.item.difficulty}, ${m.badge})_`);
    m.item.options.forEach((o, k) => lines.push(`   - ${"ABC"[k]}${k === m.item.answer_index ? " ✓" : ""}. ${o.text} — ${o.explanation}`));
  });
  const held = v.mcqs.length - mcqs.length + v.flashcards.length - cards.length;
  if (held) lines.push("", `(${held} item${held === 1 ? "" : "s"} held back by the checks and not shown.)`);
  const cited = new Set([...l.cited_chunk_ids, ...v.mcqs.flatMap((m) => (m.item as { cited_chunk_ids?: string[] }).cited_chunk_ids ?? [])]);
  const sources = v.retrieved.filter((r) => cited.has(r.id));
  lines.push("", "## Sources", "");
  for (const s of sources.length ? sources : v.retrieved) lines.push(`- ${s.title}, ${s.locator}${s.year ? ` (${s.year})` : ""} — ${s.url} · ${s.license}`);
  console.log(lines.join("\n"));
}

function cmdModule(key: string) {
  for (const t of syllabus.topics) {
    const m = t.modules.find((x) => x.id === key || x.slug === key);
    if (!m) continue;
    const lessons = new Map(loadLessons().map((v) => [v.losId, v]));
    console.log(`# ${m.title}\n\n${t.name} (${t.weight.min}–${t.weight.max}% of the exam) · module ${m.order} · \`${m.id}\` · /learn/${m.slug}\n`);
    m.los.forEach((l, i) => {
      const v = lessons.get(l.id);
      console.log(`${i + 1}. \`${l.id}\` ${l.text}\n   ${v ? `→ "${v.lesson.item.title}" · ${BADGE_TEXT[v.lesson.badge].split(" (")[0]}` : "→ no verified lesson"}`);
    });
    return;
  }
  console.log(`No module "${key}". Ids look like quant-04; slugs like quant-04-the-time-value-of-money-in-finance.`);
}

function cmdFormulas(query: string) {
  const q = query.toLowerCase();
  const rows: string[] = [];
  for (const v of loadLessons()) {
    if (!shown(v.lesson.badge)) continue;
    for (const f of v.lesson.item.formulas) {
      if (`${f.name} ${f.where} ${f.latex}`.toLowerCase().includes(q)) rows.push(`- **${f.name}** (\`${v.losId}\`): $${f.latex}$ — ${f.where}`);
    }
  }
  console.log(rows.length ? `# Formulas matching "${query}"\n\n${rows.join("\n")}` : `No formula in the verified lessons matches "${query}".`);
}

function cmdCalc(fn: string | undefined, argsJson: string | undefined) {
  if (!fn || process.argv.includes("--list")) {
    console.log("# Finance engine calculations (lib/finance/registry.ts)\n");
    for (const [name, e] of Object.entries(CALCS)) {
      const shape = e.args as unknown as { shape?: Record<string, unknown> };
      console.log(`- \`${name}\`: ${e.description}${shape.shape ? ` — args: ${Object.keys(shape.shape).join(", ")}` : ""}`);
    }
    return;
  }
  let args: unknown;
  try {
    args = JSON.parse(argsJson ?? "{}");
  } catch {
    return console.log(`Args must be a JSON object, e.g. '{"rate":0.05,"n":10,"pv":-100}'.`);
  }
  const r = runCalc({ fn, args });
  console.log(r.ok ? `${fn}(${JSON.stringify(args)}) = ${r.value}` : `Engine error: ${r.error}`);
}

const [cmd, ...rest] = positional;
switch (cmd) {
  case "search":
    cmdSearch(rest.join(" "));
    break;
  case "los":
    cmdLos(rest[0] ?? "");
    break;
  case "module":
    cmdModule(rest[0] ?? "");
    break;
  case "formulas":
    cmdFormulas(rest.join(" "));
    break;
  case "calc":
    cmdCalc(rest[0], rest[1]);
    break;
  default:
    console.log("Usage: npm run kb -- search <query> [--topic id] [--k n] | los <losId> | module <id|slug> | formulas <query> | calc <fn> '<json>' | calc --list");
}

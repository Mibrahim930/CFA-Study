/**
 * Source audit (free, no API calls): is every source in the library verified and actually used by
 * Level I learning objectives from recent curricula?
 *   npx tsx content-pipeline/source-audit.ts [--outline-2026 <path to 2026 L1 topic outline PDF>]
 * Writes docs/source-audit.md with a keep / review / remove verdict per source.
 *
 * Relevance: run the pipeline's own retrieval for every 2027 LOS (and, if the 2026 outline is given,
 * every 2026 LOS that isn't word-for-word in 2027, i.e. the rewritten Quant/Equity ones) and count
 * how often each source lands in the top passages. A source no LOS ever retrieves is off-syllabus
 * for practical purposes.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { SourceChunk } from "../lib/kb/types";
import { Bm25Index } from "../lib/kb/search";
import { TOPICS } from "../lib/syllabus/topics";
import { loadCorpus, losForTopic, retrieve } from "./lib/context";
import { extractPdfText } from "./lib/pdf-text";
import { SOURCES } from "./ingest-sources";

const REPORT = "docs/source-audit.md";
const LOS_VERB = /^(describe|explain|calculate|interpret|compare|contrast|evaluate|identify|discuss|demonstrate|distinguish|formulate|recommend|determine|analyze|define|construct|estimate|apply|justify)\b/i;

/** Source id of a chunk: OpenStax chunks are grouped by book title, PDF/HTML sources by manifest id. */
const sourceOf = (c: SourceChunk) => (c.source === "openstax" ? `openstax: ${c.title}` : c.id.split(":")[0]);

/** Share of tokens that look like real words; garbled PDF extraction scores low. */
function textQuality(texts: string[]): number {
  const tokens = texts.join(" ").split(/\s+/).filter(Boolean);
  if (!tokens.length) return 0;
  const good = tokens.filter((t) => /^[A-Za-z][a-z'’-]{1,24}[.,;:)]?$/.test(t) && /[aeiouy]/i.test(t)).length;
  return good / tokens.length;
}

function los2026(text: string, known: Set<string>): string[] {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  // LOS in the outline wrap across lines; join continuation lines onto the line that starts with a verb.
  const out: string[] = [];
  // Each LOS starts with a "□" checkbox in the outline PDF.
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const bullet = /^[□•]\s*/.test(line);
    const raw = line.replace(/^[□•]\s*/, "");
    if (bullet && LOS_VERB.test(raw)) out.push(raw);
    else if (!bullet && out.length && /^[a-z(]/.test(raw)) out[out.length - 1] += ` ${raw}`;
  }
  return [...new Set(out)].filter((l) => l.split(" ").length >= 5 && !known.has(norm(l)));
}

async function main() {
  const { values } = parseArgs({ options: { "outline-2026": { type: "string" } } });
  const corpus = loadCorpus();
  const hits2027 = new Map<string, Set<string>>();
  const hits2026 = new Map<string, number>();
  const add = (m: Map<string, Set<string>>, src: string, los: string) => (m.get(src) ?? m.set(src, new Set()).get(src)!).add(los);

  const all2027 = TOPICS.flatMap((t) => losForTopic(t.id));
  for (const ctx of all2027) for (const { chunk } of retrieve(ctx)) add(hits2027, sourceOf(chunk), ctx.los.id);

  let extra2026: string[] = [];
  if (values["outline-2026"] && existsSync(values["outline-2026"])) {
    const known = new Set(all2027.map((c) => c.los.text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()));
    extra2026 = los2026(await extractPdfText(values["outline-2026"]), known);
    const index = new Bm25Index(corpus);
    for (const los of extra2026) for (const { chunk } of index.search(los, 12)) hits2026.set(sourceOf(chunk), (hits2026.get(sourceOf(chunk)) ?? 0) + 1);
  }

  const bySource = new Map<string, SourceChunk[]>();
  for (const c of corpus) (bySource.get(sourceOf(c)) ?? bySource.set(sourceOf(c), []).get(sourceOf(c))!).push(c);
  const manifest = new Map(SOURCES.map((s) => [s.id, s]));

  type Row = { id: string; chunks: number; reuse: string; license: string; los2027: number; los2026: number; quality: number; file: string; verdict: string; why: string[] };
  const rows: Row[] = [];
  for (const [id, chunks] of bySource) {
    const def = manifest.get(id);
    const first = chunks[0];
    const why: string[] = [];
    const docDir = join("sources", "docs", id);
    let file = first.source === "openstax" ? "git clone (CNXML)" : "missing";
    if (existsSync(docDir)) {
      const files = readdirSync(docDir);
      const pdf = files.find((f) => f.endsWith(".pdf"));
      if (pdf) file = readFileSync(join(docDir, pdf)).subarray(0, 5).toString() === "%PDF-" ? "PDF ok" : "NOT a PDF";
      else if (files.some((f) => f.endsWith(".html"))) file = "HTML";
    }
    const sample = chunks.filter((_, i) => i % Math.max(1, Math.floor(chunks.length / 25)) === 0).map((c) => c.text);
    const quality = textQuality(sample);
    const license = def?.license ?? first.license ?? "";
    const reuse = def?.reuse ?? first.reuse;
    const n2027 = hits2027.get(id)?.size ?? 0;
    const n2026 = hits2026.get(id) ?? 0;

    if (!license) why.push("no licence recorded");
    if (reuse === "adapt" && !/creative commons|cc by|public domain|U\.S\. government|free use|open/i.test(license)) why.push("adapt without an open-licence statement");
    if (file === "NOT a PDF" || file === "missing") why.push(`source file: ${file}`);
    if (quality < 0.45) why.push(`low text quality (${Math.round(quality * 100)}% clean words)`);
    if (n2027 === 0 && n2026 === 0) why.push("never retrieved for any 2026/2027 LOS");
    else if (n2027 + n2026 <= 2) why.push(`rarely used (${n2027 + n2026} LOS)`);

    const remove = n2027 === 0 && n2026 === 0;
    rows.push({ id, chunks: chunks.length, reuse, license, los2027: n2027, los2026: n2026, quality, file, verdict: remove ? "remove" : why.length ? "review" : "keep", why });
  }

  const order = { remove: 0, review: 1, keep: 2 } as Record<string, number>;
  rows.sort((a, b) => order[a.verdict] - order[b.verdict] || a.los2027 - b.los2027);
  const count = (v: string) => rows.filter((r) => r.verdict === v).length;
  const lines = [
    "# Source audit",
    "",
    `Generated ${new Date().toISOString().slice(0, 10)} by \`content-pipeline/source-audit.ts\` (no API calls).`,
    `${rows.length} sources, ${corpus.length} chunks. Relevance = how many LOS retrieve the source in their top passages: all ${all2027.length} LOS of the 2027 outline${extra2026.length ? `, plus ${extra2026.length} LOS from the 2026 outline that changed in 2027 (2024–2026 Level I outlines were the same apart from Ethics)` : ""}.`,
    "",
    `**${count("keep")} keep · ${count("review")} review · ${count("remove")} remove** (nothing is deleted automatically).`,
    "",
    "| Verdict | Source | Chunks | 2027 LOS | 2026-only LOS | Clean text | File | Reuse | Why |",
    "|---|---|---|---|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.verdict} | ${r.id} | ${r.chunks} | ${r.los2027} | ${r.los2026} | ${Math.round(r.quality * 100)}% | ${r.file} | ${r.reuse} | ${r.why.join("; ") || "—"} |`),
  ];
  writeFileSync(REPORT, lines.join("\n") + "\n");
  console.log(`${rows.length} sources: ${count("keep")} keep, ${count("review")} review, ${count("remove")} remove. Report: ${REPORT}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

/**
 * Ingest the official "2027 Level I Topic Outlines" PDF into content/syllabus-2027.json.
 *   npx tsx content-pipeline/ingest-outline.ts
 * Module titles are anchored on lib/syllabus/topics.ts (verified list); LOS are parsed from the PDF.
 * The output contains CFA Institute LOS text — candidate use only, keep the repo private.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { TOPICS } from "../lib/syllabus/topics";
import type { Syllabus } from "../lib/syllabus/types";
import { slugify } from "../lib/syllabus/slug";
import { extractPdfText, fetchSource } from "./lib/pdf-text";

export const OUTLINE_URL =
  "https://www.cfainstitute.org/sites/default/files/2027levelitopicoutline_online.pdf";

const EXPECTED = { topics: 10, modules: 102, los: 340 };

export function normalize(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐-—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Running heads: topic names and every fragment produced when they wrap onto two lines. */
function runningHeads(): Set<string> {
  const heads = new Set<string>();
  for (const t of TOPICS) {
    const words = normalize(t.outlineName).split(" ");
    heads.add(words.join(" "));
    for (let i = 1; i < words.length; i++) {
      heads.add(words.slice(0, i).join(" "));
      heads.add(words.slice(i).join(" "));
    }
  }
  return heads;
}

function isNoise(line: string, heads: Set<string>): boolean {
  return (
    line === "" ||
    /^\d+$/.test(line) ||
    line.startsWith("©") ||
    line === "2027 Level I Topic Outlines" ||
    line === "LEARNING OUTCOMES" ||
    line === "The candidate should be able to:" ||
    heads.has(line)
  );
}

export function parseOutline(text: string, generatedAt = new Date().toISOString()): Syllabus {
  const heads = runningHeads();
  const lines = text.split(/\r?\n/).map(normalize);
  const expected = TOPICS.flatMap((t) => t.modules.map((title) => ({ topic: t, title })));
  const losByModule: string[][] = expected.map(() => []);

  let next = 0; // index of the next module title we expect to see
  let current = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isNoise(line, heads)) continue;

    if (next < expected.length) {
      const want = normalize(expected[next].title);
      const joined = i + 1 < lines.length ? `${line} ${lines[i + 1]}` : line;
      if (line === want || joined === want) {
        current = next++;
        if (line !== want) i++; // title wrapped onto two lines
        continue;
      }
    }

    if (line.startsWith("□")) {
      if (current < 0) throw new Error(`LOS before first module: "${line}"`);
      losByModule[current].push(line.replace(/^□\s*/, ""));
    } else if (current >= 0 && losByModule[current].length > 0) {
      const list = losByModule[current];
      list[list.length - 1] = `${list[list.length - 1]} ${line}`; // wrapped LOS continuation
    } else {
      throw new Error(`Unexpected line before any LOS: "${line}"`);
    }
  }

  if (next !== expected.length) {
    throw new Error(`Matched ${next}/${expected.length} module titles; missing "${expected[next].title}"`);
  }

  let m = 0;
  const syllabus: Syllabus = {
    curriculumYear: 2027,
    source: OUTLINE_URL,
    generatedAt,
    topics: TOPICS.map((t) => ({
      id: t.id,
      name: t.name,
      weight: t.weight,
      session: t.session,
      modules: t.modules.map((title, idx) => {
        const los = losByModule[m++];
        const id = `${t.id}-${String(idx + 1).padStart(2, "0")}`;
        return {
          id,
          slug: `${id}-${slugify(title)}`,
          order: idx + 1,
          title,
          los: los.map((text, j) => ({ id: `${id}-los${j + 1}`, text })),
        };
      }),
    })),
  };

  const moduleCount = syllabus.topics.reduce((n, t) => n + t.modules.length, 0);
  const losCount = syllabus.topics.reduce(
    (n, t) => n + t.modules.reduce((k, mod) => k + mod.los.length, 0),
    0,
  );
  const empty = syllabus.topics.flatMap((t) => t.modules).filter((mod) => mod.los.length === 0);
  if (
    syllabus.topics.length !== EXPECTED.topics ||
    moduleCount !== EXPECTED.modules ||
    losCount !== EXPECTED.los ||
    empty.length
  ) {
    throw new Error(
      `Count mismatch: topics=${syllabus.topics.length} modules=${moduleCount} los=${losCount} ` +
        `emptyModules=${empty.map((e) => e.title).join("; ")}`,
    );
  }
  return syllabus;
}

async function main() {
  const pdf = await fetchSource(OUTLINE_URL, "cfa/2027-level-i-topic-outline.pdf");
  const syllabus = parseOutline(extractPdfText(pdf));
  const out = resolve(process.cwd(), "content/syllabus-2027.json");
  writeFileSync(out, JSON.stringify(syllabus, null, 2) + "\n");
  const los = syllabus.topics.reduce((n, t) => n + t.modules.reduce((k, m) => k + m.los.length, 0), 0);
  console.log(`Wrote ${out}: ${syllabus.topics.length} topics, 102 modules, ${los} LOS`);
}

if (process.argv[1]?.endsWith("ingest-outline.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

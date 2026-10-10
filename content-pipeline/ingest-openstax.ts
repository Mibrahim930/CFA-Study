/**
 * Clone OpenStax book sources (CC BY-NC-SA 4.0) and split them into citable chunks.
 *   npx tsx content-pipeline/ingest-openstax.ts
 * Output: sources/corpus/openstax.jsonl (git-ignored; reproducible from this script).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { slugify } from "../lib/syllabus/slug";
import type { SourceChunk } from "../lib/kb/types";
import { decodeEntities, splitModule } from "./lib/cnxml";

interface BookDef {
  repo: string;
  collection: string;
  bookSlug: string;
  title: string;
}

export const BOOKS: BookDef[] = [
  { repo: "osbooks-principles-finance", collection: "principles-finance-2e", bookSlug: "principles-finance-2e", title: "Principles of Finance 2e" },
  { repo: "osbooks-introductory-statistics-bundle", collection: "introductory-business-statistics-2e", bookSlug: "introductory-business-statistics-2e", title: "Introductory Business Statistics 2e" },
  { repo: "osbooks-principles-data-science", collection: "principles-data-science", bookSlug: "principles-data-science", title: "Principles of Data Science" },
  { repo: "osbooks-principles-accounting-bundle", collection: "principles-financial-accounting", bookSlug: "principles-financial-accounting", title: "Principles of Accounting, Volume 1: Financial Accounting" },
  { repo: "osbooks-principles-economics-bundle", collection: "principles-economics-3e", bookSlug: "principles-economics-3e", title: "Principles of Economics 3e" },
  { repo: "osbooks-principles-of-management-bundle", collection: "principles-management", bookSlug: "principles-management", title: "Principles of Management" },
];

const LICENSE = "CC BY-NC-SA 4.0";
const MAX_WORDS = 450;

function cloneRepo(repo: string): string {
  const dir = resolve(process.cwd(), "sources/openstax", repo);
  if (!existsSync(dir)) {
    mkdirSync(resolve(process.cwd(), "sources/openstax"), { recursive: true });
    execFileSync("git", ["clone", "--depth", "1", `https://github.com/openstax/${repo}.git`, dir], { stdio: "inherit" });
  }
  const license = readFileSync(join(dir, "LICENSE"), "utf8");
  if (!license.includes("Attribution-NonCommercial-ShareAlike 4.0")) {
    throw new Error(`${repo}: unexpected LICENSE — refusing to ingest`);
  }
  return dir;
}

/** Chapters and their module ids from a collection file. */
function readCollection(xml: string): { chapter: string; chapterNum: number; modules: string[] }[] {
  const out: { chapter: string; chapterNum: number; modules: string[] }[] = [];
  const re = /<col:subcollection>\s*<md:title>([\s\S]*?)<\/md:title>([\s\S]*?)<\/col:subcollection>/g;
  let n = 0;
  for (const m of xml.matchAll(re)) {
    out.push({
      chapter: decodeEntities(m[1]).trim(),
      chapterNum: ++n,
      modules: [...m[2].matchAll(/document="(m\d+)"/g)].map((x) => x[1]),
    });
  }
  return out;
}

function splitWords(text: string, max: number): string[] {
  const paras = text.split("\n");
  const chunks: string[] = [];
  let cur: string[] = [];
  let words = 0;
  for (const p of paras) {
    const w = p.split(/\s+/).length;
    if (words + w > max && cur.length) {
      chunks.push(cur.join("\n"));
      cur = [];
      words = 0;
    }
    cur.push(p);
    words += w;
  }
  if (cur.length) chunks.push(cur.join("\n"));
  return chunks;
}

function main() {
  const filter = process.argv.slice(2);
  const books = filter.length ? BOOKS.filter((b) => filter.some((f) => b.bookSlug.includes(f))) : BOOKS;
  const all: SourceChunk[] = [];

  for (const book of books) {
    const dir = cloneRepo(book.repo);
    const collection = readFileSync(join(dir, "collections", `${book.collection}.collection.xml`), "utf8");
    let count = 0;
    for (const ch of readCollection(collection)) {
      ch.modules.forEach((mod, idx) => {
        const path = join(dir, "modules", mod, "index.cnxml");
        if (!existsSync(path)) return;
        const { title, sections } = splitModule(readFileSync(path, "utf8"));
        // Chapter intro module is index 0; numbered sections start at 1 (OpenStax convention).
        const sectionNum = idx;
        const pageSlug = idx === 0 ? `${ch.chapterNum}-introduction` : `${ch.chapterNum}-${sectionNum}-${slugify(title)}`;
        const locator = idx === 0 ? `Ch. ${ch.chapterNum} ${ch.chapter}` : `§${ch.chapterNum}.${sectionNum} ${title}`;
        sections.forEach((sec, s) => {
          splitWords(sec.text, MAX_WORDS).forEach((text, k) => {
            if (text.split(/\s+/).length < 25) return;
            all.push({
              id: `os:${book.bookSlug}:${mod}:${s}${k ? `.${k}` : ""}`,
              source: "openstax",
              tier: "T2",
              title: book.title,
              locator: `${locator} — ${sec.title}`,
              url: `https://openstax.org/books/${book.bookSlug}/pages/${pageSlug}`,
              license: LICENSE,
              reuse: "adapt",
              text,
            });
            count++;
          });
        });
      });
    }
    console.log(`${book.title}: ${count} chunks`);
  }

  const outDir = resolve(process.cwd(), "sources/corpus");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "openstax.jsonl"), all.map((c) => JSON.stringify(c)).join("\n") + "\n");
  console.log(`Wrote ${all.length} chunks to sources/corpus/openstax.jsonl`);
}

main();

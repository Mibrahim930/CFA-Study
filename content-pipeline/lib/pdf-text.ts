import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// macOS PDFKit via JXA — no extra dependencies. Fonts in CFA PDFs use custom encodings that
// naive stream parsing can't decode; PDFKit handles them.
const JXA = `
ObjC.import('PDFKit');
function run(argv) {
  const doc = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(argv[0]));
  if (!doc || doc.isNil()) throw new Error('could not open PDF');
  return doc.string.js;
}`;

export function extractPdfText(pdfPath: string): string {
  if (process.platform !== "darwin") {
    throw new Error("PDF extraction uses macOS PDFKit; run the pipeline on a Mac.");
  }
  return execFileSync("osascript", ["-l", "JavaScript", "-e", JXA, resolve(pdfPath)], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** Download a file once into sources/ (git-ignored). Returns the local path. */
export async function fetchSource(url: string, relPath: string): Promise<string> {
  const out = resolve(process.cwd(), "sources", relPath);
  if (existsSync(out)) return out;
  mkdirSync(dirname(out), { recursive: true });
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (personal study app)" } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  return out;
}

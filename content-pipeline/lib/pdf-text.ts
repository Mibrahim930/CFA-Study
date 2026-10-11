import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

// Cross-platform PDF text extraction (Mozilla pdf.js). Works on macOS, Windows and Linux.

// pdf.js requires forward slashes and a trailing "/" even on Windows.
const STANDARD_FONTS =
  join(dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json")), "standard_fonts").replace(/\\/g, "/") + "/";

export async function extractPdfText(pdfPath: string): Promise<string> {
  return (await extractPdfPages(pdfPath)).join("\n");
}

/** One string per PDF page (index 0 = page 1). */
export async function extractPdfPages(pdfPath: string): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(readFileSync(resolve(pdfPath)));
  const task = pdfjs.getDocument({ data, useSystemFonts: false, standardFontDataUrl: STANDARD_FONTS });
  const doc = await task.promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    let text = "";
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      // pdf.js doesn't always flag line ends (e.g. before a page footer), so also break
      // whenever the baseline moves vertically.
      // Superscripts (e.g. "M²") shift the baseline by less than half a line, so they stay inline.
      const y = item.transform[5];
      const threshold = Math.max(2, 0.6 * (item.height || 10));
      if (lastY !== null && Math.abs(y - lastY) > threshold && !text.endsWith("\n")) text += "\n";
      text += item.str;
      if (item.hasEOL) text += "\n";
      lastY = y;
    }
    pages.push(text.replace(/\n[ \t]*(?=\n)/g, "")); // drop blank lines from empty items
  }
  await task.destroy();
  return pages;
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

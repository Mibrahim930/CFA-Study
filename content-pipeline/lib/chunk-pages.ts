/**
 * Split extracted PDF pages into retrieval-sized passages that remember their page range.
 * Cuts fall at line ends, preferring the end of a sentence once the target size is reached.
 */

export interface PageChunk {
  text: string;
  startPage: number;
  endPage: number;
}

/** Joins words hyphenated across line breaks and drops bare page-number lines. */
export function cleanPage(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/([a-z])-\n([a-z])/g, "$1$2")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter((l) => l && !/^(page )?\d{1,4}$/i.test(l));
}

export function chunkPages(pages: string[], target = 1800, max = 2600, minTail = 300): PageChunk[] {
  const chunks: PageChunk[] = [];
  let buf: string[] = [];
  let len = 0;
  let start = 1;
  let end = 1;

  const flush = () => {
    if (buf.length) chunks.push({ text: buf.join("\n"), startPage: start, endPage: end });
    buf = [];
    len = 0;
  };

  pages.forEach((page, i) => {
    for (const line of cleanPage(page)) {
      if (buf.length === 0) start = i + 1;
      buf.push(line);
      len += line.length + 1;
      end = i + 1;
      if ((len >= target && /[.:;?!)"”]$/.test(line)) || len >= max) flush();
    }
  });

  if (buf.length) {
    const prev = chunks.at(-1);
    if (prev && len < minTail) {
      prev.text += `\n${buf.join("\n")}`;
      prev.endPage = end;
    } else flush();
  }
  return chunks;
}

export const pageLocator = (c: PageChunk) => (c.startPage === c.endPage ? `p. ${c.startPage}` : `pp. ${c.startPage}–${c.endPage}`);

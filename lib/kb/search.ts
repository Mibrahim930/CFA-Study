import type { SourceChunk } from "./types";

const STOP = new Set(
  "a an the and or of to in on for with by as at from is are be this that these those it its into using use describe explain calculate interpret compare evaluate identify contrast discuss including their how what which".split(
    " ",
  ),
);

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t));
}

/** Okapi BM25 index over source chunks (no external dependencies). */
export class Bm25Index {
  private docs: { chunk: SourceChunk; tf: Map<string, number>; len: number }[] = [];
  private df = new Map<string, number>();
  private avgLen = 0;

  constructor(
    chunks: SourceChunk[],
    private k1 = 1.4,
    private b = 0.75,
  ) {
    for (const chunk of chunks) {
      const toks = tokenize(`${chunk.locator} ${chunk.text}`);
      const tf = new Map<string, number>();
      for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      this.docs.push({ chunk, tf, len: toks.length });
    }
    this.avgLen = this.docs.reduce((s, d) => s + d.len, 0) / Math.max(1, this.docs.length);
  }

  search(query: string, k = 8): { chunk: SourceChunk; score: number }[] {
    const q = [...new Set(tokenize(query))];
    const N = this.docs.length;
    return this.docs
      .map((d) => {
        let score = 0;
        for (const t of q) {
          const f = d.tf.get(t);
          if (!f) continue;
          const n = this.df.get(t) ?? 0;
          const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
          score += idf * ((f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * d.len) / this.avgLen)));
        }
        return { chunk: d.chunk, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

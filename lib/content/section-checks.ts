import { tokenize } from "@/lib/kb/search";

// "Chunk, then check": after a lesson section, one flashcard whose wording overlaps that section most.
// Pure, so the lesson page (a server component) can decide placement at build time.

export interface CheckCard {
  id: string;
  front: string;
  back: string;
}

/**
 * For each section, the index of the flashcard to show after it, or null. Each card is used at most once, each
 * section gets at most one, and a card goes where it shares the most vocabulary with the section (ties go to the
 * earlier section). Cards that share nothing with any section are left for the flashcard list at the end.
 */
export function assignChecks(sections: { heading: string; body: string }[], cards: CheckCard[]): (number | null)[] {
  const sectionTokens = sections.map((s) => new Set(tokenize(`${s.heading} ${s.body}`)));
  const pairs: { section: number; card: number; score: number }[] = [];
  cards.forEach((c, card) => {
    const q = [...new Set(tokenize(`${c.front} ${c.back}`))];
    sectionTokens.forEach((toks, section) => {
      const score = q.filter((t) => toks.has(t)).length;
      if (score > 0) pairs.push({ section, card, score });
    });
  });
  pairs.sort((a, b) => b.score - a.score || a.section - b.section || a.card - b.card);
  const out: (number | null)[] = sections.map(() => null);
  const used = new Set<number>();
  for (const p of pairs) {
    if (out[p.section] !== null || used.has(p.card)) continue;
    out[p.section] = p.card;
    used.add(p.card);
  }
  return out;
}

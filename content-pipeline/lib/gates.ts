import { matches, runCalc } from "../../lib/finance/registry";
import type { CalcSpecOut, Flashcard, Generation, Lesson, Mcq } from "./schema";

/**
 * Deterministic verification gates (no API calls). Each returns a list of issues; empty = pass.
 * Model-based gates (blind solve, grounding critic) live in verify.ts.
 */

const BANNED_OPTION = /\b(all|none|both|neither) of (the )?(above|these|them)\b|\bboth [abc] and [abc]\b/i;

/** TVM functions return BA II Plus signed values; students see magnitudes. */
const SIGN_CONVENTION_FNS = new Set(["pv", "fv", "pmt"]);

// Comparison signs stay: "Mean < median" and "Mean > median" are different options.
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9.%<>=≤≥≠-]+/g, " ").trim();

export function parseCalcSpec(spec: CalcSpecOut): { fn: string; args: unknown } | { error: string } {
  try {
    const args: unknown = JSON.parse(spec.args_json);
    if (typeof args !== "object" || args === null || Array.isArray(args)) return { error: "args_json is not a JSON object" };
    return { fn: spec.fn, args };
  } catch {
    return { error: `args_json is not valid JSON: ${spec.args_json.slice(0, 80)}` };
  }
}

/** Recompute a calc spec with the finance engine. */
export function recompute(spec: CalcSpecOut): { ok: true; value: number } | { ok: false; error: string } {
  const parsed = parseCalcSpec(spec);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  return runCalc(parsed);
}

function sameValue(fn: string, answer: number, expected: number, relTol = 0.005): boolean {
  if (matches(answer, expected, relTol)) return true;
  return SIGN_CONVENTION_FNS.has(fn) && matches(Math.abs(answer), Math.abs(expected), relTol);
}

/** Distractors may sit close to the answer (e.g. a compounding slip); they clash only within 0.05%. */
const DISTRACTOR_CLASH_TOL = 0.0005;

function distance(fn: string, answer: number, expected: number): number {
  const d = Math.abs(answer - expected);
  return SIGN_CONVENTION_FNS.has(fn) ? Math.min(d, Math.abs(Math.abs(answer) - Math.abs(expected))) : d;
}

/** Numbers that appear in display text, e.g. "$1,234.50" → 1234.5, "5.25%" → 5.25. */
export function numbersIn(text: string): number[] {
  return [...text.replace(/(\d),(?=\d{3}\b)/g, "$1").matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
}

/** True if the text displays `value` (allowing percent form and display rounding). */
export function textShowsValue(text: string, value: number): boolean {
  return numbersIn(text).some((n) =>
    [value, value * 100, Math.abs(value), Math.abs(value) * 100].some((v) => matches(n, v, 0.005, 0.006)),
  );
}

export function lintMcq(m: Mcq, allowedChunkIds: Set<string>): string[] {
  const issues: string[] = [];
  if (!m.stem.trim()) issues.push("empty stem");
  if (m.options.length !== 3) issues.push(`has ${m.options.length} options, needs exactly 3`);
  if (!Number.isInteger(m.answer_index) || m.answer_index < 0 || m.answer_index >= m.options.length) {
    issues.push(`answer_index ${m.answer_index} is out of range`);
  }
  m.options.forEach((o, i) => {
    if (!o.text.trim()) issues.push(`option ${i} has no text`);
    if (!o.explanation.trim()) issues.push(`option ${i} has no explanation`);
    if (BANNED_OPTION.test(o.text)) issues.push(`option ${i} uses a banned form ("${o.text}")`);
  });
  const texts = m.options.map((o) => norm(o.text));
  if (new Set(texts).size !== texts.length) issues.push("options are not distinct");

  const isCalc = m.kind === "calc" || m.calc_spec !== null;
  if (m.kind === "calc" && !m.calc_spec) issues.push("calc item has no calc_spec");
  if (isCalc) {
    if (m.options.some((o) => o.value === null || !Number.isFinite(o.value))) issues.push("calc item has an option without a numeric value");
    const values = m.options.map((o) => o.value);
    if (new Set(values).size !== values.length) issues.push("calc options share a value");
  }

  for (const id of m.cited_chunk_ids) {
    if (!allowedChunkIds.has(id)) issues.push(`cites unknown chunk "${id}"`);
  }
  return issues;
}

export interface CalcCheck {
  status: "pass" | "fail" | "n/a";
  expected?: number;
  issues: string[];
}

/**
 * Engine recompute: the key must match (±0.5%) and be the option closest to the engine value;
 * no distractor may clash with it (±0.05%); option text must show its value.
 */
export function calcGateMcq(m: Mcq): CalcCheck {
  if (!m.calc_spec) return { status: "n/a", issues: [] };
  const r = recompute(m.calc_spec);
  if (!r.ok) return { status: "fail", issues: [`engine could not recompute: ${r.error}`] };
  const issues: string[] = [];
  const fn = m.calc_spec.fn;
  const key = m.options[m.answer_index]?.value;
  m.options.forEach((o, i) => {
    if (o.value === null) return;
    if (i === m.answer_index && !sameValue(fn, o.value, r.value)) issues.push(`key value ${o.value} does not match engine value ${r.value}`);
    if (i !== m.answer_index) {
      if (sameValue(fn, o.value, r.value, DISTRACTOR_CLASH_TOL)) issues.push(`distractor ${i} (${o.value}) equals the engine value ${r.value}`);
      else if (key != null && distance(fn, o.value, r.value) <= distance(fn, key, r.value)) {
        issues.push(`distractor ${i} (${o.value}) is at least as close to the engine value ${r.value} as the key (${key})`);
      }
    }
    if (!textShowsValue(o.text, o.value)) issues.push(`option ${i} text "${o.text}" does not show its value ${o.value}`);
  });
  return { status: issues.length ? "fail" : "pass", expected: r.value, issues };
}

export function calcGateWorkedExample(we: Lesson["worked_example"]): CalcCheck {
  if (!we.calc_spec) return { status: "n/a", issues: [] };
  const r = recompute(we.calc_spec);
  if (!r.ok) return { status: "fail", issues: [`engine could not recompute: ${r.error}`] };
  if (we.answer_value === null) return { status: "fail", expected: r.value, issues: ["worked example has calc_spec but no answer_value"] };
  const issues: string[] = [];
  if (!sameValue(we.calc_spec.fn, we.answer_value, r.value)) issues.push(`answer_value ${we.answer_value} does not match engine value ${r.value}`);
  if (!textShowsValue(we.answer, we.answer_value)) issues.push(`answer text "${we.answer}" does not show ${we.answer_value}`);
  return { status: issues.length ? "fail" : "pass", expected: r.value, issues };
}

/** Length tell: the key is at least 20 characters and 20% longer than both distractors (a test-wise giveaway). */
export function keyLengthTell(m: Mcq): boolean {
  const key = m.options[m.answer_index]?.text.length ?? 0;
  const others = m.options.filter((_, i) => i !== m.answer_index).map((o) => o.text.length);
  return key >= 20 && others.every((n) => key >= n * 1.2);
}

/** Set-level answer-key warnings: length tells above 8% of items, or the key stuck in one position. */
export function answerKeyWarnings(mcqs: Mcq[]): string[] {
  const issues: string[] = [];
  const tells = mcqs.filter(keyLengthTell).length;
  if (mcqs.length && tells / mcqs.length > 0.08) issues.push(`${tells}/${mcqs.length} items have the longest option as the key`);
  const positions = new Set(mcqs.map((m) => m.answer_index));
  if (mcqs.length >= 4 && positions.size === 1) issues.push(`every key is option ${"ABC"[[...positions][0]] ?? "?"}`);
  return issues;
}

/** Whole-file counts (plan: 6–8 MCQs, 3–5 flashcards). */
export function lintCounts(g: Generation): string[] {
  const issues: string[] = [];
  if (g.mcqs.length < 6 || g.mcqs.length > 8) issues.push(`${g.mcqs.length} MCQs (want 6–8)`);
  if (g.flashcards.length < 3 || g.flashcards.length > 5) issues.push(`${g.flashcards.length} flashcards (want 3–5)`);
  return issues;
}

// ---------- copy guard ----------

export function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+(?:['.][a-z0-9]+)*/g) ?? [];
}

export interface CopyRef {
  label: string;
  text: string;
  /** Flag any run of this many consecutive words shared with the reference. */
  maxRun: number;
}

/** Flags verbatim runs of ≥ maxRun words shared with any reference text. */
export function copyGuard(text: string, refs: CopyRef[]): string[] {
  const w = words(text);
  const issues: string[] = [];
  for (const ref of refs) {
    const rw = words(ref.text);
    const n = ref.maxRun;
    if (rw.length < n || w.length < n) continue;
    const grams = new Set<string>();
    for (let i = 0; i + n <= rw.length; i++) grams.add(rw.slice(i, i + n).join(" "));
    for (let i = 0; i + n <= w.length; i++) {
      const g = w.slice(i, i + n).join(" ");
      if (grams.has(g)) {
        issues.push(`copies ${n}+ words from ${ref.label}: "${g}"`);
        break;
      }
    }
  }
  return issues;
}

// ---------- IFRS 18 gate ----------

const IFRS18 = /\bIFRS\s*18\b|management[- ]defined performance measures?|\boperating category\b/i;

/** Research Cycle 2: 2027 L1 FSA is IAS 1-era; quarantine items that bring in IFRS 18. */
export function ifrs18Gate(text: string): string[] {
  const m = text.match(IFRS18);
  return m ? [`mentions "${m[0]}" (IFRS 18 is not in the 2027 Level I curriculum)`] : [];
}

// ---------- text extraction ----------

export const mcqText = (m: Mcq) => [m.stem, ...m.options.flatMap((o) => [o.text, o.explanation])].join("\n");
export const flashcardText = (f: Flashcard) => `${f.front}\n${f.back}`;
export const lessonText = (l: Lesson) =>
  [
    l.title,
    l.summary,
    ...l.sections.flatMap((s) => [s.heading, s.body_markdown]),
    l.worked_example.problem,
    ...l.worked_example.steps,
    l.worked_example.answer,
    ...l.formulas.flatMap((f) => [f.name, f.where]),
    ...l.exam_traps,
  ].join("\n");

/**
 * The blind solver sometimes returns a choice_index that contradicts its own reasoning
 * ("…that is option C" with index 1). Returns the letter (0–2) the reasoning finally commits to,
 * or null when it names none.
 */
export function solverNamedChoice(reasoning: string): number | null {
  // Only committing phrases ("is option C", "matches option C", "the answer is C"), not "option A is wrong".
  const re = /\b(?:is|matches|choose|pick|select|answer(?:\s+is)?:?)\s+(?:option\s+)?\(?([ABC])\b/g;
  let last: string | null = null;
  for (const m of reasoning.matchAll(re)) last = m[1];
  return last === null ? null : "ABC".indexOf(last);
}

/** Reasoning too thin to count as a second opinion (empty, "Placeholder", a few words). */
export function solverReasoningUnusable(reasoning: string): boolean {
  return reasoning.trim().split(/\s+/).filter(Boolean).length < 4;
}

/**
 * Does a blind-solve disagreement stand? It's dismissed when the solver's own reasoning names the key,
 * or when its reasoning is unusable and the finance engine has verified the keyed value.
 */
export function solverDisputeStands(m: Mcq, choiceIndex: number | undefined, reasoning: string): { stands: boolean; note?: string } {
  if (choiceIndex === m.answer_index) return { stands: false };
  if (solverNamedChoice(reasoning) === m.answer_index) {
    return { stands: false, note: "solver's index contradicted its own reasoning, which names the key" };
  }
  if (solverReasoningUnusable(reasoning) && calcGateMcq(m).status === "pass") {
    return { stands: false, note: "solver gave no usable reasoning; the finance engine verified the key" };
  }
  return { stands: true };
}

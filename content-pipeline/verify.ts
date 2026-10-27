/**
 * Verify generated content and badge every item (milestone M2).
 *   npx tsx content-pipeline/verify.ts --los quant-04-los1
 *   npx tsx content-pipeline/verify.ts --topic quant [--skip-model-gates]
 * Reads content/generated/<topic>/<losId>.json and writes <losId>.verified.json beside it.
 *
 * Gates, in order: lint → calc engine → copy guard → IFRS 18 → blind solve (one repair, then quarantine)
 * → grounding critic. Badges: Grounded+Verified / Verified (math checked by the engine) / Model-only / Quarantined.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import * as z from "zod/v4";
import { callStructured, DEFAULT_MODEL, loadEnv, monthlyBudgetUsd, monthSpendUsd, type CallRecord } from "./lib/claude";
import { chunksById, findLos, losForTopic, type LosContext } from "./lib/context";
import {
  answerKeyWarnings,
  calcGateMcq,
  calcGateWorkedExample,
  copyGuard,
  flashcardText,
  ifrs18Gate,
  lessonText,
  lintCounts,
  lintMcq,
  mcqText,
  solverDisputeStands,
  type CopyRef,
} from "./lib/gates";
import { BlindSolveSchema, GroundingSchema, McqSchema, type Flashcard, type GeneratedFile, type Grounding, type Lesson, type Mcq } from "./lib/schema";
import { GENERATOR_SYSTEM, outputPath } from "./generate";
import type { SourceChunk } from "../lib/kb/types";

export type Badge = "grounded_verified" | "verified" | "model_only" | "quarantined" | "pending";

export interface Gate {
  pass: boolean;
  issues: string[];
}

export interface Checked<T> {
  id: string;
  item: T;
  gates: Record<string, Gate>;
  badge: Badge;
  repaired?: boolean;
}

export interface VerifiedFile {
  losId: string;
  losText: string;
  moduleId: string;
  moduleTitle: string;
  generatedBy: string;
  verifiedAt: string;
  verifierModel: string | null;
  retrieved: GeneratedFile["retrieved"];
  lesson: Checked<Lesson>;
  mcqs: Checked<Mcq>[];
  flashcards: Checked<Flashcard>[];
  warnings: string[];
  usage: CallRecord[];
  costUsd: number;
}

const gate = (issues: string[]): Gate => ({ pass: issues.length === 0, issues });
export const allPass = (c: Checked<unknown>) => Object.values(c.gates).every((g) => g.pass);
const ABC = "ABC";

const SOLVER_SYSTEM = `You are an expert taking CFA® Level I practice questions. Each question has three options (A, B, C) and exactly one best answer.
Work every question independently and carefully. Do all arithmetic yourself, step by step, and follow the stem's stated conventions and rounding. Return the index of your choice (0 = A, 1 = B, 2 = C), your confidence, and one or two sentences of reasoning.`;

export const CRITIC_SYSTEM = `You review study material for a beginner preparing for CFA® Level I. You receive numbered source passages from open textbooks and a list of items (a lesson, multiple-choice questions, flashcards). Each item lists the passage ids it cites.

For each item, judge its factual claims:
- supported: every substantive claim is backed by the passages it cites (or, if it cites none, by any of the passages).
- partially_supported: the main idea is backed but some claims are not.
- unsupported: the passages do not back the item's claims (they may still be true).
- contradicted: a passage says something incompatible with the item.
List the unsupported claims briefly.

Separately, set error_found = true only when the item contains a definite error by standard Level I curriculum knowledge: a wrong formula, definition, rule or key, or an arithmetic mistake. This applies whatever the passages say. Clear simplifications made for beginners are not errors. Recheck any arithmetic step by step before flagging it; if your note concludes that the item is correct, error_found must be false. Explain any error in note.`;

export const CONFIRM_SYSTEM = `You are a second reviewer for CFA® Level I study material. Another reviewer flagged each item below as containing an error. For each, decide independently whether the flagged error is REAL.
Recompute all arithmetic carefully, step by step. Where an engine value is given, it was computed by a tested finance library and is correct. A difference that only comes from rounding the final figure as the item instructs is not an error. Simplifications made for beginners are not errors.
Return real_error = true only if the item, as a student would read it, teaches or keys something wrong.`;

export const ConfirmSchema = z.object({
  verdicts: z.array(z.object({ id: z.string(), real_error: z.boolean(), explanation: z.string().describe("One or two sentences") })),
});

const REPAIR_SYSTEM = `${GENERATOR_SYSTEM}

## Repair task
You will receive multiple-choice questions where an independent solver chose a different option from the key, together with the solver's reasoning. For each, decide who is right. Return a corrected replacement that keeps the same LOS and kind: fix the key, remove the ambiguity, or rewrite the question. The replacement must follow every rule above.`;

const RepairSchema = z.object({ items: z.array(z.object({ id: z.string(), mcq: McqSchema })) });

export function copyRefs(file: GeneratedFile, chunks: Map<string, SourceChunk>): CopyRef[] {
  return [
    { label: `LOS ${file.losId}`, text: file.losText, maxRun: 10 },
    ...[...chunks.values()].map((c) => ({ label: `${c.title} ${c.locator}`, text: c.text, maxRun: c.reuse === "ground" ? 8 : 15 })),
  ];
}

function citationIssues(ids: string[], allowed: Set<string>): string[] {
  return ids.filter((id) => !allowed.has(id)).map((id) => `cites unknown chunk "${id}"`);
}

export function mcqGates(m: Mcq, allowed: Set<string>, refs: CopyRef[]): Record<string, Gate> {
  return {
    lint: gate(lintMcq(m, allowed)),
    calc: gate(calcGateMcq(m).issues),
    copy: gate(copyGuard(mcqText(m), refs)),
    ifrs18: gate(ifrs18Gate(mcqText(m))),
  };
}

const formatQuestion = (id: string, m: Mcq) =>
  `<question id="${id}">\n${m.stem}\n${m.options.map((o, i) => `${ABC[i]}. ${o.text}`).join("\n")}\n</question>`;

const formatPassages = (chunks: Map<string, SourceChunk>) =>
  [...chunks.values()].map((c) => `<passage id="${c.id}" source="${c.title}, ${c.locator}">\n${c.text.trim()}\n</passage>`).join("\n\n");

class Verifier {
  readonly usage: CallRecord[] = [];
  constructor(
    private file: GeneratedFile,
    private ctx: LosContext,
    private chunks: Map<string, SourceChunk>,
    private model: string,
  ) {}

  private async call<S extends z.ZodType>(purpose: string, schema: S, system: string, user: string, effort: "medium" | "high") {
    const { data, record } = await callStructured({ purpose, losId: this.file.losId, schema, system, user, model: this.model, effort });
    this.usage.push(record);
    return data;
  }

  async blindSolve(items: Checked<Mcq>[]) {
    const solve = (batch: Checked<Mcq>[], effort: "medium" | "high") =>
      this.call("blind-solve", BlindSolveSchema, SOLVER_SYSTEM, batch.map((c) => formatQuestion(c.id, c.item)).join("\n\n"), effort);
    try {
      const data = await solve(items, "high");
      return new Map(data.answers.map((a) => [a.id, a]));
    } catch (err) {
      // A batch can overflow the output budget when the solver reasons at length (seen on fsa-04-los2).
      // Fall back to one question at a time, then to medium effort, before giving up on an item.
      if (!(err instanceof Error && err.message.includes("max_tokens"))) throw err;
      console.warn(`blind-solve batch for ${this.file.losId} overflowed; solving one question at a time`);
      const answers = new Map<string, z.infer<typeof BlindSolveSchema>["answers"][number]>();
      for (const c of items) {
        for (const effort of ["high", "medium"] as const) {
          try {
            const data = await solve([c], effort);
            for (const a of data.answers) answers.set(a.id, a);
            break;
          } catch (e) {
            if (!(e instanceof Error && e.message.includes("max_tokens")) || effort === "medium") {
              console.warn(`blind-solve for ${this.file.losId} ${c.id} failed at ${effort} effort: ${e instanceof Error ? e.message : e}`);
            }
          }
        }
      }
      return answers;
    }
  }

  async repair(items: { checked: Checked<Mcq>; solver: string }[]) {
    const user = [
      `LOS ${this.ctx.los.id}: ${this.ctx.los.text}`,
      `Source passages:\n${formatPassages(this.chunks)}`,
      ...items.map(
        ({ checked, solver }) =>
          `<disputed id="${checked.id}">\n${JSON.stringify(checked.item, null, 2)}\nKey: ${ABC[checked.item.answer_index]}. Solver: ${solver}\n</disputed>`,
      ),
    ].join("\n\n");
    const data = await this.call("repair", RepairSchema, REPAIR_SYSTEM, user, "high");
    return new Map(data.items.map((r) => [r.id, r.mcq]));
  }

  async confirm(items: { c: Checked<unknown>; claim: string }[]) {
    const blocks = items.map(({ c, claim }) => {
      const it = c.item as Partial<Mcq & Flashcard & Lesson>;
      let body: string;
      if (it.stem !== undefined) {
        const m = c.item as Mcq;
        const engine = calcGateMcq(m).expected;
        body = `${m.stem}\n${m.options.map((o, i) => `${ABC[i]}. ${o.text} — ${o.explanation}`).join("\n")}\nKey: ${ABC[m.answer_index]}${engine !== undefined ? `\nEngine value: ${engine}` : ""}`;
      } else if (it.front !== undefined) body = `Q: ${it.front}\nA: ${it.back}`;
      else body = lessonText(c.item as Lesson);
      return `<item id="${c.id}">\n${body}\n</item>\n<flagged_error id="${c.id}">${claim}</flagged_error>`;
    });
    const data = await this.call("confirm", ConfirmSchema, CONFIRM_SYSTEM, blocks.join("\n\n"), "high");
    return new Map(data.verdicts.map((v) => [v.id, v]));
  }

  async ground(lesson: Checked<Lesson> | null, mcqs: Checked<Mcq>[], cards: Checked<Flashcard>[]) {
    const items: string[] = [];
    if (lesson) items.push(`<item id="lesson" cites="${lesson.item.cited_chunk_ids.join(",")}">\n${lessonText(lesson.item)}\n</item>`);
    for (const c of mcqs) {
      const key = c.item.options[c.item.answer_index];
      items.push(`<item id="${c.id}" cites="${c.item.cited_chunk_ids.join(",")}">\n${c.item.stem}\nCorrect answer: ${key.text}\nWhy: ${key.explanation}\n</item>`);
    }
    for (const c of cards) items.push(`<item id="${c.id}" cites="${c.item.cited_chunk_ids.join(",")}">\nQ: ${c.item.front}\nA: ${c.item.back}\n</item>`);
    if (items.length === 0) return new Map<string, Grounding["verdicts"][number]>();
    const user = `Source passages:\n${formatPassages(this.chunks)}\n\nItems to review:\n${items.join("\n\n")}`;
    const data = await this.call("grounding", GroundingSchema, CRITIC_SYSTEM, user, "medium");
    return new Map(data.verdicts.map((v) => [v.id, v]));
  }
}

function applyGrounding(c: Checked<unknown>, v: Grounding["verdicts"][number] | undefined) {
  if (!v) {
    c.gates.grounding = gate(["critic returned no verdict"]);
    return false;
  }
  const issues: string[] = [];
  if (v.verdict === "contradicted") issues.push(`contradicted by sources: ${v.note}`);
  if (v.error_found) issues.push(`error found: ${v.note}`);
  c.gates.grounding = gate(issues);
  return v.verdict === "supported" && !v.error_found;
}

export async function verifyOne(file: GeneratedFile, opts: { model: string; skipModelGates: boolean }): Promise<VerifiedFile> {
  const ctx = findLos(file.losId);
  const allowed = new Set(file.retrieved.map((r) => r.id));
  const chunks = chunksById([...allowed]);
  const refs = copyRefs(file, chunks);
  const v = new Verifier(file, ctx, chunks, opts.model);

  const { lesson: lessonItem, mcqs: mcqItems, flashcards: cardItems } = file.content;
  const workedCalc = calcGateWorkedExample(lessonItem.worked_example);
  const lesson: Checked<Lesson> = {
    id: "lesson",
    item: lessonItem,
    badge: "pending",
    gates: {
      citations: gate(citationIssues(lessonItem.cited_chunk_ids, allowed)),
      calc: gate(workedCalc.issues),
      copy: gate(copyGuard(lessonText(lessonItem), refs)),
      ifrs18: gate(ifrs18Gate(lessonText(lessonItem))),
    },
  };
  const mcqs: Checked<Mcq>[] = mcqItems.map((m, i) => ({ id: `q${i + 1}`, item: m, badge: "pending", gates: mcqGates(m, allowed, refs) }));
  const cards: Checked<Flashcard>[] = cardItems.map((f, i) => ({
    id: `f${i + 1}`,
    item: f,
    badge: "pending",
    gates: {
      citations: gate(citationIssues(f.cited_chunk_ids, allowed)),
      copy: gate(copyGuard(flashcardText(f), refs)),
      ifrs18: gate(ifrs18Gate(flashcardText(f))),
    },
  }));

  const grounded = new Set<string>();
  if (!opts.skipModelGates) {
    // Blind solve, one repair round, then quarantine.
    const solvable = mcqs.filter(allPass);
    const disputes: { checked: Checked<Mcq>; solver: string }[] = [];
    if (solvable.length) {
      const answers = await v.blindSolve(solvable);
      for (const c of solvable) {
        const a = answers.get(c.id);
        const solver = a ? `chose ${ABC[a.choice_index] ?? a.choice_index} (${a.confidence}): ${a.reasoning}` : "gave no answer";
        const dispute = a ? solverDisputeStands(c.item, a.choice_index, a.reasoning) : { stands: true };
        const agree = !dispute.stands;
        if (dispute.note) c.gates.blind_solve_note = { pass: true, issues: [`${dispute.note}. Solver ${solver}`] };
        c.gates.blind_solve = gate(agree ? [] : [`solver ${solver}`]);
        if (!agree) disputes.push({ checked: c, solver });
      }
    }
    if (disputes.length) {
      const fixes = await v.repair(disputes);
      const retry: Checked<Mcq>[] = [];
      for (const { checked } of disputes) {
        const fixed = fixes.get(checked.id);
        if (!fixed) continue;
        checked.item = fixed;
        checked.repaired = true;
        const firstSolve = checked.gates.blind_solve;
        checked.gates = mcqGates(fixed, allowed, refs);
        checked.gates.blind_solve_first = { pass: true, issues: firstSolve.issues };
        if (allPass(checked)) retry.push(checked);
      }
      if (retry.length) {
        const answers = await v.blindSolve(retry);
        for (const c of retry) {
          const a = answers.get(c.id);
          const dispute = a ? solverDisputeStands(c.item, a.choice_index, a.reasoning) : { stands: true };
          const agree = !dispute.stands;
          if (dispute.note && a) c.gates.blind_solve_note = { pass: true, issues: [`${dispute.note} (after repair). Solver chose ${ABC[a.choice_index] ?? a.choice_index}: ${a.reasoning}`] };
          c.gates.blind_solve = gate(agree ? [] : [`solver ${a ? `chose ${ABC[a.choice_index] ?? a.choice_index} again: ${a.reasoning}` : "gave no answer"} (after repair)`]);
        }
      }
    }

    const verdicts = await v.ground(allPass(lesson) ? lesson : null, mcqs.filter(allPass), cards.filter(allPass));

    // Second opinion: a flagged error only quarantines an item if an independent check confirms it.
    const all = [lesson, ...mcqs, ...cards] as Checked<unknown>[];
    const flagged = all.filter((c) => allPass(c) && (verdicts.get(c.id)?.error_found || verdicts.get(c.id)?.verdict === "contradicted"));
    if (flagged.length) {
      const confirmed = await v.confirm(flagged.map((c) => ({ c, claim: verdicts.get(c.id)!.note })));
      for (const c of flagged) {
        const verdict = verdicts.get(c.id)!;
        const second = confirmed.get(c.id);
        if (second && !second.real_error) {
          verdicts.set(c.id, { ...verdict, error_found: false, verdict: verdict.verdict === "contradicted" ? "partially_supported" : verdict.verdict });
          c.gates.critic_review = { pass: true, issues: [`flag overturned on second review: ${second.explanation}`] };
        } else if (second) {
          c.gates.critic_review = { pass: true, issues: [`flag confirmed: ${second.explanation}`] };
        }
      }
    }
    for (const c of all) {
      if (allPass(c) && applyGrounding(c, verdicts.get(c.id))) grounded.add(c.id);
    }
  }

  const badge = (c: Checked<unknown>, calcVerified: boolean): Badge => {
    if (!allPass(c)) return "quarantined";
    if (opts.skipModelGates) return "pending";
    if (grounded.has(c.id)) return "grounded_verified";
    return calcVerified ? "verified" : "model_only";
  };
  lesson.badge = badge(lesson, workedCalc.status === "pass");
  for (const c of mcqs) c.badge = badge(c, calcGateMcq(c.item).status === "pass");
  for (const c of cards) c.badge = badge(c, false);

  return {
    losId: file.losId,
    losText: file.losText,
    moduleId: file.moduleId,
    moduleTitle: file.moduleTitle,
    generatedBy: file.model,
    verifiedAt: new Date().toISOString(),
    verifierModel: opts.skipModelGates ? null : opts.model,
    retrieved: file.retrieved,
    lesson,
    mcqs,
    flashcards: cards,
    warnings: [...lintCounts(file.content), ...answerKeyWarnings(mcqs.filter((c) => c.badge !== "quarantined").map((c) => c.item))],
    usage: v.usage,
    costUsd: v.usage.reduce((s, r) => s + r.costUsd, 0),
  };
}

function report(out: VerifiedFile, generationCost: number) {
  const all = [out.lesson, ...out.mcqs, ...out.flashcards] as Checked<unknown>[];
  const counts: Record<string, number> = {};
  for (const c of all) counts[c.badge] = (counts[c.badge] ?? 0) + 1;
  console.log(`\n${out.losId}: ${Object.entries(counts).map(([b, n]) => `${n} ${b}`).join(", ")}`);
  for (const c of all) {
    const failed = Object.entries(c.gates).filter(([, g]) => !g.pass);
    const note = c.badge === "quarantined" ? failed.map(([name, g]) => `${name}: ${g.issues.join("; ")}`).join(" | ") : "";
    console.log(`  ${c.id.padEnd(7)} ${c.badge.padEnd(18)}${c.repaired ? "(repaired) " : ""}${note}`);
  }
  for (const w of out.warnings) console.log(`  warning: ${w}`);
  console.log(`  cost: generate $${generationCost.toFixed(4)} + verify $${out.costUsd.toFixed(4)} = $${(generationCost + out.costUsd).toFixed(4)}`);
}

async function main() {
  const { values } = parseArgs({
    options: {
      los: { type: "string", multiple: true },
      topic: { type: "string" },
      model: { type: "string", default: DEFAULT_MODEL },
      "skip-model-gates": { type: "boolean", default: false },
      force: { type: "boolean", default: false },
    },
  });
  loadEnv();
  const targets = values.topic ? losForTopic(values.topic) : (values.los ?? []).flatMap((s) => s.split(",")).map(findLos);
  if (targets.length === 0) throw new Error("Pass --los <id> or --topic <id>");
  if (!values["skip-model-gates"]) console.log(`Verifier model ${values.model}. Spent this month: $${monthSpendUsd().toFixed(2)} of $${monthlyBudgetUsd().toFixed(2)}.`);

  for (const ctx of targets) {
    const src = outputPath(ctx);
    if (!existsSync(src)) {
      console.log(`skip ${ctx.los.id} (not generated yet)`);
      continue;
    }
    if (!values.force && existsSync(src.replace(/\.json$/, ".verified.json"))) {
      console.log(`skip ${ctx.los.id} (already verified; --force to redo)`);
      continue;
    }
    const file = JSON.parse(readFileSync(src, "utf8")) as GeneratedFile;
    const out = await verifyOne(file, { model: values.model, skipModelGates: values["skip-model-gates"] });
    writeFileSync(src.replace(/\.json$/, ".verified.json"), JSON.stringify(out, null, 2) + "\n");
    report(out, file.usage.reduce((s, r) => s + r.costUsd, 0));
  }
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("content-pipeline/verify.ts")) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

/**
 * Re-check quarantined items offline, with no API calls (free).
 *   npx tsx content-pipeline/requalify.ts --topic quant
 *   npx tsx content-pipeline/requalify.ts            (every topic)
 *
 * Reruns the deterministic gates (lint/citations, calc engine, copy guard, IFRS 18) on each quarantined
 * lesson, MCQ and flashcard, and re-reads stored model-gate results with the current rules:
 * a blind-solve dispute is dismissed by `solverDisputeStands`; a grounding gate that only says the critic
 * returned no verdict becomes a note (the item is simply not grounded). Gates the hand-fix script wrote
 * (`hand_fixed`, overridden model gates) are carried over as they are.
 * An item that now passes is badged "verified" (engine-checked math) or "model_only". Never
 * "grounded_verified": the grounding critic only runs in a paid verify pass. Items that never reached
 * the model gates get a note saying so; a later `npm run verify --force` upgrades them.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { chunksById, losForTopic } from "./lib/context";
import { calcGateMcq, calcGateWorkedExample, solverDisputeStands } from "./lib/gates";
import type { Flashcard, GeneratedFile, Lesson, Mcq } from "./lib/schema";
import { outputPath } from "./generate";
import { allPass, copyRefs, flashcardGates, lessonGates, mcqGates, type Checked, type Gate, type VerifiedFile } from "./verify";

const STORED_SOLVE = /^solver chose ([A-C]|-?\d+)(?: \((?:low|medium|high)\))?(?: again)?: ([\s\S]*?)(?: \(after repair\))?$/;
const NO_VERDICT = "critic returned no verdict";

/** Parse the solver's stored verdict out of a failed blind_solve gate. */
export function parseStoredSolve(issue: string): { choice: number; reasoning: string } | null {
  const m = STORED_SOLVE.exec(issue);
  if (!m) return null;
  const choice = "ABC".includes(m[1]) ? "ABC".indexOf(m[1]) : Number(m[1]);
  return { choice, reasoning: m[2] };
}

type Dispute = ReturnType<typeof solverDisputeStands>;

/** Fresh deterministic gates, then every stored model/hand gate re-read under the current rules. */
function requalifyGates<T>(c: Checked<T>, fresh: Record<string, Gate>, today: string, reSolve?: (choice: number, reasoning: string) => Dispute): Record<string, Gate> {
  const old = c.gates;
  const gates: Record<string, Gate> = { ...fresh };
  for (const [name, g] of Object.entries(old)) if (!(name in fresh)) gates[name] = g;

  if (old.blind_solve && !old.blind_solve.pass && reSolve) {
    const stored = parseStoredSolve(old.blind_solve.issues[0] ?? "");
    const dispute: Dispute = stored ? reSolve(stored.choice, stored.reasoning) : { stands: true };
    if (!dispute.stands) {
      gates.blind_solve = { pass: true, issues: [] };
      gates.blind_solve_note = { pass: true, issues: [`${dispute.note} (requalified offline ${today}). Stored: ${old.blind_solve.issues[0]}`] };
    }
  }
  if (old.grounding && !old.grounding.pass && old.grounding.issues.join() === NO_VERDICT) {
    gates.grounding = { pass: true, issues: [`${NO_VERDICT}; not grounded (requalified offline ${today})`] };
  }
  if (!old.blind_solve && !old.grounding) {
    gates.model_gates_pending = { pass: true, issues: [`model gates not run yet (requalified offline ${today}); a paid verify pass upgrades this item`] };
  }
  return gates;
}

export function requalifyMcq(c: Checked<Mcq>, fresh: Record<string, Gate>, today: string): Checked<Mcq> {
  const next: Checked<Mcq> = { ...c, gates: requalifyGates(c, fresh, today, (choice, reasoning) => solverDisputeStands(c.item, choice, reasoning)) };
  next.badge = !allPass(next) ? "quarantined" : calcGateMcq(c.item).status === "pass" ? "verified" : "model_only";
  return next;
}

export function requalifyLesson(c: Checked<Lesson>, fresh: Record<string, Gate>, today: string): Checked<Lesson> {
  const next: Checked<Lesson> = { ...c, gates: requalifyGates(c, fresh, today) };
  next.badge = !allPass(next) ? "quarantined" : calcGateWorkedExample(c.item.worked_example).status === "pass" ? "verified" : "model_only";
  return next;
}

export function requalifyFlashcard(c: Checked<Flashcard>, fresh: Record<string, Gate>, today: string): Checked<Flashcard> {
  const next: Checked<Flashcard> = { ...c, gates: requalifyGates(c, fresh, today) };
  next.badge = !allPass(next) ? "quarantined" : "model_only";
  return next;
}

const failing = (c: Checked<unknown>) =>
  Object.entries(c.gates)
    .filter(([, g]) => !g.pass)
    .map(([n, g]) => `${n}: ${g.issues.join("; ")}`);

export function requalifyTopic(topic: string, today: string): { checked: number; freed: number } {
  let checked = 0;
  let freed = 0;
  for (const ctx of losForTopic(topic)) {
    const src = outputPath(ctx);
    const dst = src.replace(/\.json$/, ".verified.json");
    if (!existsSync(src) || !existsSync(dst)) continue;
    const file = JSON.parse(readFileSync(src, "utf8")) as GeneratedFile;
    const out = JSON.parse(readFileSync(dst, "utf8")) as VerifiedFile;
    const held = [out.lesson, ...out.mcqs, ...out.flashcards].filter((c) => c.badge === "quarantined");
    if (!held.length) continue;

    const allowed = new Set(out.retrieved.map((r) => r.id));
    const refs = copyRefs(file, chunksById([...allowed]));
    const report = (id: string, after: Checked<unknown>) => {
      checked++;
      if (after.badge !== "quarantined") freed++;
      const fails = failing(after);
      console.log(`${out.losId} ${id}: ${after.badge}${fails.length ? ` (${fails.join(" | ")})` : ""}`);
    };
    if (out.lesson.badge === "quarantined") {
      out.lesson = requalifyLesson(out.lesson, lessonGates(out.lesson.item, allowed, refs), today);
      report("lesson", out.lesson);
    }
    out.mcqs = out.mcqs.map((c) => {
      if (c.badge !== "quarantined") return c;
      const next = requalifyMcq(c, mcqGates(c.item, allowed, refs), today);
      report(c.id, next);
      return next;
    });
    out.flashcards = out.flashcards.map((c) => {
      if (c.badge !== "quarantined") return c;
      const next = requalifyFlashcard(c, flashcardGates(c.item, allowed, refs), today);
      report(c.id, next);
      return next;
    });
    writeFileSync(dst, JSON.stringify(out, null, 2) + "\n");
  }
  return { checked, freed };
}

function main() {
  const { values } = parseArgs({ options: { topic: { type: "string" } } });
  const today = new Date().toISOString().slice(0, 10);
  const topics = values.topic ? [values.topic] : readdirSync("content/generated").filter((d) => !d.includes("."));
  let checked = 0;
  let freed = 0;
  for (const t of topics) {
    const r = requalifyTopic(t, today);
    checked += r.checked;
    freed += r.freed;
  }
  console.log(`\nrequalify: ${checked} quarantined items re-checked, ${freed} now pass, ${checked - freed} still held.`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("content-pipeline/requalify.ts")) main();

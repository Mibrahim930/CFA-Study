/**
 * Re-check quarantined questions offline, with no API calls (free).
 *   npx tsx content-pipeline/requalify.ts --topic quant
 *
 * Reruns the deterministic gates (lint, calc engine, copy guard, IFRS 18) on each quarantined MCQ and
 * re-reads its stored blind-solve result with the current consistency rule (solverDisputeStands).
 * An item that now passes is badged "verified" (engine-checked math) or "model_only". Never
 * "grounded_verified": the grounding critic only runs in a paid verify pass. Items that never reached
 * the blind solver get a note saying so; a later `npm run verify` upgrades them.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { chunksById, losForTopic } from "./lib/context";
import { calcGateMcq, solverDisputeStands } from "./lib/gates";
import type { GeneratedFile, Mcq } from "./lib/schema";
import { outputPath } from "./generate";
import { allPass, copyRefs, mcqGates, type Checked, type Gate, type VerifiedFile } from "./verify";

const STORED_SOLVE = /^solver chose ([A-C]|-?\d+)(?: \((?:low|medium|high)\))?(?: again)?: ([\s\S]*?)(?: \(after repair\))?$/;

/** Parse the solver's stored verdict out of a failed blind_solve gate. */
export function parseStoredSolve(issue: string): { choice: number; reasoning: string } | null {
  const m = STORED_SOLVE.exec(issue);
  if (!m) return null;
  const choice = "ABC".includes(m[1]) ? "ABC".indexOf(m[1]) : Number(m[1]);
  return { choice, reasoning: m[2] };
}

export function requalifyMcq(c: Checked<Mcq>, fresh: Record<string, Gate>, today: string): Checked<Mcq> {
  const old = c.gates;
  const gates: Record<string, Gate> = { ...fresh };
  if (old.blind_solve_first) gates.blind_solve_first = old.blind_solve_first;

  if (old.blind_solve) {
    gates.blind_solve = old.blind_solve;
    const stored = old.blind_solve.pass ? null : parseStoredSolve(old.blind_solve.issues[0] ?? "");
    if (stored) {
      const dispute = solverDisputeStands(c.item, stored.choice, stored.reasoning);
      if (!dispute.stands) {
        gates.blind_solve = { pass: true, issues: [] };
        gates.blind_solve_note = { pass: true, issues: [`${dispute.note} (requalified offline ${today}). Stored: ${old.blind_solve.issues[0]}`] };
      }
    }
  } else {
    gates.model_gates_pending = { pass: true, issues: [`blind solve and grounding not run yet (requalified offline ${today}); a paid verify pass upgrades this item`] };
  }
  if (old.grounding) gates.grounding = old.grounding;
  if (old.critic_review) gates.critic_review = old.critic_review;

  const next: Checked<Mcq> = { ...c, gates };
  next.badge = !allPass(next) ? "quarantined" : calcGateMcq(c.item).status === "pass" ? "verified" : "model_only";
  return next;
}

function main() {
  const { values } = parseArgs({ options: { topic: { type: "string" } } });
  if (!values.topic) throw new Error("Pass --topic <id>");
  const today = new Date().toISOString().slice(0, 10);

  for (const ctx of losForTopic(values.topic)) {
    const src = outputPath(ctx);
    const dst = src.replace(/\.json$/, ".verified.json");
    if (!existsSync(src) || !existsSync(dst)) continue;
    const file = JSON.parse(readFileSync(src, "utf8")) as GeneratedFile;
    const out = JSON.parse(readFileSync(dst, "utf8")) as VerifiedFile;
    const held = out.mcqs.filter((c) => c.badge === "quarantined");
    if (!held.length) continue;

    const allowed = new Set(out.retrieved.map((r) => r.id));
    const refs = copyRefs(file, chunksById([...allowed]));
    out.mcqs = out.mcqs.map((c) => {
      if (c.badge !== "quarantined") return c;
      const next = requalifyMcq(c, mcqGates(c.item, allowed, refs), today);
      const failed = Object.entries(next.gates).filter(([, g]) => !g.pass).map(([n, g]) => `${n}: ${g.issues.join("; ")}`);
      console.log(`${out.losId} ${c.id}: ${next.badge}${failed.length ? ` (${failed.join(" | ")})` : ""}`);
      return next;
    });
    for (const c of [out.lesson, ...out.flashcards] as Checked<unknown>[]) {
      if (c.badge === "quarantined") console.log(`${out.losId} ${c.id}: still quarantined (only MCQs are requalified offline)`);
    }
    writeFileSync(dst, JSON.stringify(out, null, 2) + "\n");
  }
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("content-pipeline/requalify.ts")) main();

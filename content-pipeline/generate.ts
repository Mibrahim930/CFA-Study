/**
 * Generate a lesson, MCQs and flashcards per learning objective (milestone M2).
 *   npx tsx content-pipeline/generate.ts --los quant-04-los1
 *   npx tsx content-pipeline/generate.ts --topic quant [--force] [--model claude-sonnet-5-5]
 *   npx tsx content-pipeline/generate.ts --los quant-04-los1 --dry-run   (retrieval + prompt only, no API call)
 * Output: content/generated/<topic>/<losId>.json. Run verify.ts next.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { callStructured, DEFAULT_MODEL, loadEnv, monthlyBudgetUsd, monthSpendUsd } from "./lib/claude";
import { calcCatalog, findLos, losForTopic, retrieve, type LosContext } from "./lib/context";
import { GenerationSchema, type GeneratedFile } from "./lib/schema";

export const GENERATOR_SYSTEM = `You write study material for "L1 Study", a private app for one beginner preparing for the CFA® Level I exam (2027 curriculum). The student has a bachelor's degree but no finance or accounting background, studies 10–15 hours a week, and needs material that is correct above all else.

You will receive one learning objective (LOS) and numbered source passages from open textbooks. Produce a lesson, multiple-choice questions and flashcards for that LOS only.

## Accuracy and sources
- Teach what the 2027 Level I curriculum expects for this LOS. Stay inside its scope; the other LOS of the module are listed so you can avoid overlapping them.
- Prefer facts the passages support. Cite passage ids in cited_chunk_ids only when the passage actually supports that item. Never cite an id that was not provided.
- You may add standard curriculum knowledge the passages do not cover. Leave such items with an empty cited_chunk_ids rather than citing a passage that does not support them; they will be labelled as model-only.
- Do not use IFRS 18 concepts (operating/investing/financing income-statement categories, management-defined performance measures). Level I 2027 uses IAS 1-era presentation.
- Do not claim what "the CFA Institute" or "the curriculum" says verbatim, and do not imitate official question text.

## Original wording (required)
- Write everything in your own words. Never copy sentences or long phrases from the passages or the LOS text. Do not restate the LOS sentence as a heading or summary.

## Lesson
- summary: one or two plain sentences on what this LOS is about and why it matters.
- sections: 3–5 short sections that build from intuition to the exam-level idea. Define every term the first time it appears. Use a concrete everyday analogy where it helps. Markdown is fine; inline math as $...$ (KaTeX), display math as $$...$$.
- worked_example: one realistic exam-style problem with numbered steps a beginner can follow, including BA II Plus keystrokes where a calculator is used. If the answer is numeric and a catalog function computes it, fill calc_spec and answer_value; the answer text must display the same number.
- formulas: each with KaTeX latex and a "where" line defining every symbol. Empty if the LOS has no formulas.
- exam_traps: 3–5 specific mistakes candidates make on this LOS.
- builds_on / leads_to: short names of related concepts.

## Multiple-choice questions (6–8)
- Exactly 3 options (A/B/C style, as on the Level I exam), exactly one correct. Never "all/none of the above" or "both A and B".
- Mix concept and calculation items to suit the LOS: calculation-heavy LOS should be about half calc; purely descriptive LOS can be all concept. Mix easy, medium and hard.
- Every wrong option must come from a specific, realistic mistake (wrong compounding, sign error, confusing two terms…). Its explanation names that mistake. The correct option's explanation shows the reasoning.
- Vary which position holds the correct answer.
- Keep the three options similar in length, detail and style. The correct option must not stand out by being longer or more qualified than the distractors.
- Stems must be self-contained: give every number needed, state compounding and timing conventions explicitly, and say how to round.
- Variance, standard deviation, covariance and correlation stems must say which divisor applies: either "these observations are a sample, so divide by n − 1" or "these outcomes are the complete (equally likely) distribution, so divide by n". Never leave sample vs population for the student to guess.

## Calculation items (kind = "calc")
- Every calc item and its options must be computable with one function from the catalog below. Put the function name in calc_spec.fn and its arguments in calc_spec.args_json as a JSON object (rates as decimals: 5% → 0.05).
- options[].value: each option's number in the function's raw units: decimals for rates and returns (0.0525, displayed as "5.25%"), currency amounts as plain numbers. Distractor values come from the mistake they represent.
- options[].text must display exactly that value (rounded as the stem instructs).
- TVM functions (pv, fv, pmt) follow the BA II Plus sign convention: money paid out is negative. The engine's sign is ignored for these three; give magnitudes in option text.
- If no catalog function fits, make the question a concept item instead of inventing a calc_spec.

## Flashcards (3–5)
- One idea per card: a definition, a formula, or a contrast. Front is a question; back is a short answer.

## Calculation catalog (finance engine; args with = have defaults)
${calcCatalog()}`;

export function buildUserPrompt(ctx: LosContext, hits: ReturnType<typeof retrieve>): string {
  const siblings = ctx.module.los.filter((l) => l.id !== ctx.los.id).map((l) => `- ${l.id}: ${l.text}`);
  const passages = hits.map(
    ({ chunk }) => `<passage id="${chunk.id}" source="${chunk.title}, ${chunk.locator}" license="${chunk.license}">\n${chunk.text.trim()}\n</passage>`,
  );
  return [
    `Topic: ${ctx.topic.name}`,
    `Module ${ctx.module.id}: ${ctx.module.title}`,
    `LOS ${ctx.los.id}: ${ctx.los.text}`,
    siblings.length ? `Other LOS in this module (do not cover them):\n${siblings.join("\n")}` : "This is the only LOS in the module.",
    `Source passages (${passages.length}):\n${passages.join("\n\n")}`,
  ].join("\n\n");
}

export function outputPath(ctx: LosContext): string {
  return join("content", "generated", ctx.topic.id, `${ctx.los.id}.json`);
}

async function generateOne(ctx: LosContext, model: string): Promise<GeneratedFile> {
  const hits = retrieve(ctx);
  const { data, record } = await callStructured({
    purpose: "generate",
    losId: ctx.los.id,
    schema: GenerationSchema,
    system: GENERATOR_SYSTEM,
    user: buildUserPrompt(ctx, hits),
    model,
    effort: "high",
  });
  return {
    losId: ctx.los.id,
    losText: ctx.los.text,
    moduleId: ctx.module.id,
    moduleTitle: ctx.module.title,
    model: record.servedModel,
    generatedAt: record.at,
    retrieved: hits.map(({ chunk, score }) => ({
      id: chunk.id,
      title: chunk.title,
      locator: chunk.locator,
      url: chunk.url,
      license: chunk.license,
      reuse: chunk.reuse,
      score: Number(score.toFixed(2)),
    })),
    content: data,
    usage: [record],
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      los: { type: "string", multiple: true },
      topic: { type: "string" },
      model: { type: "string", default: DEFAULT_MODEL },
      force: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
    },
  });
  loadEnv();

  const targets = values.topic ? losForTopic(values.topic) : (values.los ?? []).flatMap((s) => s.split(",")).map(findLos);
  if (targets.length === 0) throw new Error("Pass --los <id> or --topic <id>");

  if (values["dry-run"]) {
    for (const ctx of targets) {
      const prompt = buildUserPrompt(ctx, retrieve(ctx));
      console.log(`${ctx.los.id}: system ${GENERATOR_SYSTEM.length} chars, user ${prompt.length} chars`);
    }
    return;
  }

  console.log(`Model ${values.model}. Spent this month: $${monthSpendUsd().toFixed(2)} of $${monthlyBudgetUsd().toFixed(2)}.`);
  let total = 0;
  for (const ctx of targets) {
    const out = outputPath(ctx);
    if (existsSync(out) && !values.force) {
      console.log(`skip ${ctx.los.id} (exists; --force to regenerate)`);
      continue;
    }
    const started = Date.now();
    const file = await generateOne(ctx, values.model);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(file, null, 2) + "\n");
    const u = file.usage[0];
    total += u.costUsd;
    console.log(
      `${ctx.los.id}: ${file.content.mcqs.length} MCQs, ${file.content.flashcards.length} cards | ` +
        `in ${u.inputTokens} + cache ${u.cacheReadTokens}r/${u.cacheWriteTokens}w, out ${u.outputTokens} tokens | ` +
        `$${u.costUsd.toFixed(4)} | ${((Date.now() - started) / 1000).toFixed(0)}s${u.servedModel !== u.requestedModel ? ` | served by ${u.servedModel}` : ""}`,
    );
  }
  console.log(`Generation cost this run: $${total.toFixed(4)}`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("content-pipeline/generate.ts")) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

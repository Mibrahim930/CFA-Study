import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type * as z from "zod/v4";

/**
 * Claude calls for the content pipeline: structured output, streaming, server-side refusal
 * fallbacks, per-call cost logging and a monthly budget cap (CLAUDE_MONTHLY_BUDGET_USD).
 */

/** The user chose Sonnet for the pipeline (2026-10-10). Override per run with --model claude-opus-5-5. */
export const DEFAULT_MODEL = "claude-sonnet-5-5";

/** USD per million tokens (first-party API, cached 2026-10-06 in the claude-api skill). */
const PRICES: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
  // Possible server-side fallback targets.
  "claude-opus-5": { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 },
  "claude-opus-4-8": { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 },
};
const UNKNOWN_PRICE = { input: 10, output: 50, cacheWrite: 12.5, cacheRead: 1 };

export interface CallRecord {
  at: string;
  purpose: string;
  losId: string;
  requestedModel: string;
  servedModel: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  costUsd: number;
  stopReason: string | null;
}

const SPEND_DIR = join("content-pipeline", ".spend");

function ledgerPath(d = new Date()): string {
  return join(SPEND_DIR, `${d.toISOString().slice(0, 7)}.jsonl`);
}

export function monthSpendUsd(): number {
  const p = ledgerPath();
  if (!existsSync(p)) return 0;
  return readFileSync(p, "utf8")
    .split("\n")
    .filter(Boolean)
    .reduce((s, line) => s + (JSON.parse(line) as CallRecord).costUsd, 0);
}

export function monthlyBudgetUsd(): number {
  const v = Number(process.env.CLAUDE_MONTHLY_BUDGET_USD);
  if (!Number.isFinite(v) || v <= 0) throw new Error("CLAUDE_MONTHLY_BUDGET_USD must be a positive number in .env.local");
  return v;
}

export class BudgetExceededError extends Error {}

function assertUnderBudget() {
  const spent = monthSpendUsd();
  const budget = monthlyBudgetUsd();
  if (spent >= budget) {
    throw new BudgetExceededError(`Monthly Claude budget reached: $${spent.toFixed(2)} of $${budget.toFixed(2)}. Raise CLAUDE_MONTHLY_BUDGET_USD to continue.`);
  }
}

type UsageLike = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number | null;
  cache_read_input_tokens: number | null;
};

function priceOf(model: string, u: UsageLike): number {
  const p = PRICES[model] ?? UNKNOWN_PRICE;
  return (
    (u.input_tokens * p.input +
      u.output_tokens * p.output +
      (u.cache_creation_input_tokens ?? 0) * p.cacheWrite +
      (u.cache_read_input_tokens ?? 0) * p.cacheRead) /
    1e6
  );
}

/** Cost of a response. With a fallback, each model that ran is billed at its own rate. */
export function costOf(message: Anthropic.Beta.BetaMessage): number {
  const iters = (message.usage.iterations ?? []).filter(
    (i): i is Extract<typeof i, { type: "message" | "fallback_message" }> => i.type === "message" || i.type === "fallback_message",
  );
  if (iters.length === 0) return priceOf(message.model, message.usage);
  return iters.reduce((s, i) => s + priceOf(i.model ?? message.model, i), 0);
}

let client: Anthropic | undefined;
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export interface StructuredCall<S extends z.ZodType> {
  purpose: string;
  losId: string;
  schema: S;
  /** Stable across calls so it is prompt-cached. */
  system: string;
  user: string;
  model?: string;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens?: number;
}

export async function callStructured<S extends z.ZodType>(call: StructuredCall<S>): Promise<{ data: z.infer<S>; record: CallRecord }> {
  assertUnderBudget();
  const model = call.model ?? DEFAULT_MODEL;
  const request = () =>
    getClient()
      .beta.messages.stream({
        model,
        max_tokens: call.maxTokens ?? 64000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        thinking: { type: "adaptive" },
        output_config: { effort: call.effort ?? "high", format: betaZodOutputFormat(call.schema) },
        system: [{ type: "text", text: call.system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: call.user }],
      })
      .finalMessage();
  let message: Awaited<ReturnType<typeof request>>;
  try {
    message = await request();
  } catch (err) {
    // The SDK throws when the reply doesn't match the schema (seen once: an off-list enum value from the
    // grounding critic). One retry; its cost isn't in the ledger because the SDK threw before we saw usage.
    if (!(err instanceof Error && err.message.includes("Failed to parse structured output"))) throw err;
    console.warn(`${call.purpose} for ${call.losId}: reply did not match the schema; retrying once`);
    message = await request();
  }

  const record: CallRecord = {
    at: new Date().toISOString(),
    purpose: call.purpose,
    losId: call.losId,
    requestedModel: model,
    servedModel: message.model,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
    cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
    costUsd: costOf(message),
    stopReason: message.stop_reason,
  };
  mkdirSync(SPEND_DIR, { recursive: true });
  appendFileSync(ledgerPath(), JSON.stringify(record) + "\n");

  if (message.stop_reason === "refusal") {
    throw new Error(`${call.purpose} for ${call.losId} was declined (${message.stop_details?.category ?? "no category"}) by every model in the fallback chain`);
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error(`${call.purpose} for ${call.losId} hit max_tokens; output is truncated`);
  }
  if (message.parsed_output == null) {
    throw new Error(`${call.purpose} for ${call.losId} returned no parseable output`);
  }
  return { data: message.parsed_output as z.infer<S>, record };
}

/** Loads .env.local (Node's built-in loader) so scripts see the API key and budget. */
export function loadEnv() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
}

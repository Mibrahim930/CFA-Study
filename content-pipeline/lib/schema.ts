import * as z from "zod/v4";

/**
 * Shapes for generated study content.
 *
 * The API schema stays simple (no array min/max, no numeric bounds) so structured outputs accept it.
 * Counts, ranges and cross-field rules are enforced afterwards by the lint gate in `gates.ts`,
 * which can quarantine a single bad item instead of rejecting the whole file.
 */

/** `args_json` is a JSON-encoded object, because registry args differ per function. */
export const CalcSpecSchema = z.object({
  fn: z.string().describe("A function name from the calculation catalog"),
  args_json: z.string().describe('JSON object of arguments for that function, e.g. {"rate":0.05,"n":10,"pv":-100}'),
});

export const OptionSchema = z.object({
  text: z.string().describe("Option text as shown to the student"),
  value: z
    .number()
    .nullable()
    .describe("Calc items only: the option's numeric value in the calc function's raw units (decimals for rates). Null for concept items."),
  explanation: z.string().describe("Why this option is right, or the specific mistake that leads to it"),
});

export const McqSchema = z.object({
  kind: z.enum(["concept", "calc"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  stem: z.string(),
  options: z.array(OptionSchema).describe("Exactly 3 options"),
  answer_index: z.number().int().describe("0, 1 or 2"),
  calc_spec: CalcSpecSchema.nullable().describe("Required for calc items; null for concept items"),
  cited_chunk_ids: z.array(z.string()),
});

export const FlashcardSchema = z.object({
  front: z.string(),
  back: z.string(),
  cited_chunk_ids: z.array(z.string()),
});

export const LessonSchema = z.object({
  title: z.string(),
  summary: z.string().describe("One or two plain-English sentences"),
  sections: z
    .array(z.object({ heading: z.string(), body_markdown: z.string() }))
    .describe("Beginner explanation and intuition. Inline math as $...$"),
  worked_example: z.object({
    problem: z.string(),
    steps: z.array(z.string()),
    answer: z.string(),
    answer_value: z.number().nullable().describe("Numeric answer in the calc function's raw units, or null"),
    calc_spec: CalcSpecSchema.nullable(),
  }),
  formulas: z.array(z.object({ name: z.string(), latex: z.string(), where: z.string() })),
  exam_traps: z.array(z.string()),
  builds_on: z.array(z.string()),
  leads_to: z.array(z.string()),
  cited_chunk_ids: z.array(z.string()),
});

export const GenerationSchema = z.object({
  lesson: LessonSchema,
  mcqs: z.array(McqSchema).describe("6 to 8 questions"),
  flashcards: z.array(FlashcardSchema).describe("3 to 5 cards"),
});

export type CalcSpecOut = z.infer<typeof CalcSpecSchema>;
export type Mcq = z.infer<typeof McqSchema>;
export type Flashcard = z.infer<typeof FlashcardSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Generation = z.infer<typeof GenerationSchema>;

/** Blind solve: the solver sees stems and options, never the key. */
export const BlindSolveSchema = z.object({
  answers: z.array(
    z.object({
      id: z.string(),
      choice_index: z.number().int(),
      confidence: z.enum(["low", "medium", "high"]),
      reasoning: z.string().describe("One or two sentences"),
    }),
  ),
});

/** Grounding critic: one verdict per item against the cited passages. */
export const GroundingSchema = z.object({
  verdicts: z.array(
    z.object({
      id: z.string(),
      verdict: z.enum(["supported", "partially_supported", "unsupported", "contradicted"]),
      unsupported_claims: z.array(z.string()),
      error_found: z.boolean().describe("True if the item contains a definite factual or numerical error, whatever the passages say"),
      note: z.string(),
    }),
  ),
});

export type BlindSolve = z.infer<typeof BlindSolveSchema>;
export type Grounding = z.infer<typeof GroundingSchema>;

export interface RetrievedRef {
  id: string;
  title: string;
  locator: string;
  url: string;
  license: string;
  reuse: "adapt" | "ground";
  score: number;
}

/** What generate.ts writes to content/generated/<topic>/<losId>.json. */
export interface GeneratedFile {
  losId: string;
  losText: string;
  moduleId: string;
  moduleTitle: string;
  model: string;
  generatedAt: string;
  retrieved: RetrievedRef[];
  content: Generation;
  usage: import("./claude").CallRecord[];
}

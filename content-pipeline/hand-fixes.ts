/**
 * Hand fixes for verified content, applied offline (free).
 *   npx tsx content-pipeline/hand-fixes.ts            then    npx tsx content-pipeline/requalify.ts
 *
 * Each fix names one item in a .verified.json, the exact text replacements to make, citations to drop and
 * the model gates whose stored failure is overridden because the content was reviewed or corrected by hand.
 * The same replacements are mirrored into the generated .json when its text still matches (it may not:
 * repaired MCQs differ from the generator's output), so a later `verify --force` starts from the fixed text.
 * A `hand_fixed` gate records the note; requalify then re-runs the deterministic gates and rebadges.
 * Running twice is safe: a fix whose note is already recorded on the item is skipped.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Flashcard, GeneratedFile, Lesson, Mcq } from "./lib/schema";
import type { Checked, Gate, VerifiedFile } from "./verify";

export interface HandFix {
  losId: string;
  /** "lesson", "q3", "f2" */
  id: string;
  /** What was wrong and what changed (goes into the hand_fixed gate). */
  note: string;
  /** Exact-text replacements applied to every string field of the item; each must match at least once. */
  replace?: [from: string, to: string][];
  /** MCQ only: new numeric values for options whose text changed (option index → value). */
  values?: Record<number, number>;
  /** Chunk ids to remove from cited_chunk_ids (e.g. ids the retriever never returned). */
  dropCitations?: string[];
  /** Stored model gates (blind_solve, grounding) whose failure this review overrides. */
  override?: string[];
}

export const FIXES: HandFix[] = [
  // ---- calc gate: a distractor sat within 0.05% of the key (add-on yield or 365-day variants of money-market prices).
  // Each clashing distractor is replaced with a different realistic mistake that lands well away from the key.
  {
    losId: "corpfin-04-los3",
    id: "q6",
    note: "distractor 4,901,370 (365-day year) was within 0.03% of the key; replaced with an inverted day-count mistake",
    values: { 2: 4100000 },
    replace: [
      ["4,901,370", "4,100,000"],
      ["Uses a 365-day year instead of the 360-day convention given in the stem.", "Inverts the day-count fraction, using 360/120 = 3 instead of 120/360: 5,000,000 × (1 − 0.06 × 3) = 4,100,000."],
    ],
  },
  {
    losId: "derivatives-04-los2",
    id: "q8",
    note: "distractor $103.00 (simple interest) was within 0.05% of the key; replaced with a discounting-instead-of-compounding mistake",
    values: { 1: 97.13 },
    replace: [
      ["$103.00", "$97.13"],
      ["This uses simple interest for the half year, $100\\times(1+0.06\\times0.5)$, rather than annual compounding raised to $T=0.5$.", "This divides by the growth factor instead of multiplying, $100/(1.06)^{0.5}=97.13$. A forward price is the spot price carried forward, so it must be above $100 when the asset pays no income."],
    ],
  },
  {
    losId: "fixed-income-01-los1",
    id: "q6",
    note: "distractor 972.77 (annual coupons) was within 0.04% of the key; replaced with a discount-at-the-coupon-rate mistake",
    values: { 1: 1000 },
    replace: [
      ["972.77", "1,000.00"],
      ["Wrong: this treats the bond as paying 40 once a year for 3 years at 5%. It ignores semiannual coupons and semiannual compounding.", "Wrong: this discounts at the 4% coupon rate instead of the 5% market yield, which always gives par. A bond trades at par only when its coupon rate equals the market yield."],
    ],
  },
  {
    losId: "fixed-income-04-los1",
    id: "q1",
    note: "both distractors (add-on yield, 365-day year) were within 0.02% of the key; replaced with forgot-to-prorate and added-the-discount mistakes",
    values: { 0: 9520000, 2: 10120000 },
    replace: [
      ["$9,881,423", "$9,520,000"],
      ["Treats the 4.8% as an add-on yield and computes face ÷ (1 + 0.048 × 90/360). A discount rate is applied to face value and subtracted.", "Forgets to prorate the annual rate for 90 days: 10,000,000 × (1 − 0.048) = $9,520,000. The discount for a quarter of a year is a quarter of 4.8%."],
      ["$9,881,644", "$10,120,000"],
      ["Uses a 365-day year (0.048 × 90/365) although the stem says the quote is on a 360-day basis.", "Adds the 90-day discount instead of subtracting it: 10,000,000 × (1 + 0.048 × 90/360). Commercial paper is sold below face value, so the price must be under $10,000,000."],
    ],
  },
  {
    losId: "fixed-income-08-los2",
    id: "q2",
    note: "both distractors (add-on yield, 365-day year) were within 0.02% of the key; replaced with forgot-to-prorate and added-the-discount mistakes",
    values: { 0: 964000, 2: 1009000 },
    replace: [
      ["$991,080.28", "$964,000.00"],
      ["Mistake: treating the discount rate as an add-on rate and computing FV ÷ (1 + 0.036 × 90/360) = 1,000,000 ÷ 1.009.", "Mistake: forgetting to prorate the annual rate for 90 days, 1,000,000 × (1 − 0.036) = $964,000.00. The discount for a quarter of a year is a quarter of 3.60%."],
      ["$991,123.29", "$1,009,000.00"],
      ["Mistake: using a 365-day year for the discount, 1,000,000 × (1 − 0.036 × 90/365), when the quote is on a 360-day basis.", "Mistake: adding the discount instead of subtracting it, 1,000,000 × (1 + 0.036 × 90/360). A bill sells below face value, so the price must be under $1,000,000."],
    ],
  },
  {
    losId: "fixed-income-08-los2",
    id: "q6",
    note: "distractor 96.89 (365-day year) was within 0.05% of the key; replaced with a forgot-to-prorate mistake",
    values: { 0: 95.8 },
    replace: [
      ["96.89", "95.80"],
      ["Mistake: using a 365-day year, 100 × (1 − 0.042 × 270/365), although commercial paper is quoted with a 360-day year.", "Mistake: forgetting to prorate the annual rate for 270 days, 100 × (1 − 0.042) = 95.80. The paper runs for three quarters of a year, so only three quarters of 4.20% is deducted."],
    ],
  },

  // ---- blind solve: the key was checked by hand against the cited source and is right.
  {
    losId: "alternatives-02-los2",
    id: "q7",
    note: "solver returned no answer twice (pipeline fault, not a content error); hard-hurdle arithmetic checked by hand: 20% × (12% − 8%) = 0.8%",
    override: ["blind_solve"],
  },
  {
    losId: "ethics-03-los3",
    id: "q6",
    note: "solver disputed the key; the Handbook's Example 9 under I(D) (cfa-sop-handbook-12:65:73) concludes the same conduct is not professional conduct and is not covered by Standard I(D), so the key (B) stands",
    override: ["blind_solve"],
  },
  {
    losId: "fsa-04-los4",
    id: "q3",
    note: "solver's own reasoning ends 'IFRS CFO higher by 25', which is the key (C); its chosen index contradicted its reasoning",
    override: ["blind_solve"],
  },

  // ---- grounding critic: real errors in the text, corrected.
  {
    losId: "fsa-11-los4",
    id: "q6",
    note: "explanation wrote 0.02 × 5.0 × 2.0 = 0.10 × 1.0 × 2.0; the first product is 0.20, so the chain was rewritten",
    replace: [["Correct. 0.02 × 5.0 × 2.0 = 0.10 × 1.0 × 2.0 = 20%.", "Correct. Firm X: 0.02 × 5.0 × 2.0 = 0.20. Firm Y: 0.10 × 1.0 × 2.0 = 0.20. Both are 20%."]],
    override: ["grounding"],
  },
  {
    losId: "ethics-09-los2",
    id: "lesson",
    note: "worked example called Mara a Level I candidate who had passed Level II; the scenario now states her exam history so the rewritten bio follows from it",
    replace: [
      ["Mara is a Level I candidate who has just passed Level II and is registered for Level III.", "Mara passed Level I and Level II of the CFA exam on her first attempts and is registered for the Level III exam."],
      ["'Mara Quinn passed Level I and Level II of the CFA exams on consecutive attempts and is a Level III candidate for the CFA designation.'", "'Mara Quinn passed Level I and Level II of the CFA exam on her first attempts and is a Level III candidate in the CFA Program.'"],
    ],
    override: ["grounding"],
  },
  {
    losId: "fixed-income-12-los1",
    id: "lesson",
    note: "critic's note ended 'no error' after re-evaluating; arithmetic re-checked by hand (convexity 100, adjustment +0.50%). The muddled BA II Plus keystroke step was simplified",
    replace: [
      [
        "Convexity $= 1.00 / 0.01 = 100$. BA II Plus keystrokes: 108.5 [+] 92.5 [−] 200 [=] gives 1; then [÷] 0.01 [×] 0.01 [=] gives 0.0001 (clear with [CE/C] if needed), so instead compute 1 [÷] 0.01 [÷] 100 [=] to get 100 (since dividing by 100 × 0.0001 = 0.01 is the same as dividing by 0.0001 and then by 100). Check: 1 ÷ 0.0001 = 10,000, then ÷ 100 = 100.",
        "Convexity $= 1.00 / 0.01 = 100$. BA II Plus keystrokes: 108.5 [+] 92.5 [−] 200 [=] shows 1; then [÷] 0.01 [=] shows 100.",
      ],
    ],
    override: ["grounding"],
  },

  // ---- lint: a citation the retriever never returned (the model invented a neighbouring chunk id).
  { losId: "equity-07-los1", id: "q5", note: "dropped an invented chunk id from the citations", dropCitations: ["damodaran-valn2ed-ch17:20:21"] },
  { losId: "portfolio-06-los3", id: "q1", note: "dropped an invented chunk id from the citations", dropCitations: ["occ-corporate-risk-governance:39:55"] },

  // ---- copy guard: sentences that borrowed a source's wording, reworded in plain language. Facts unchanged.
  ...reworded("alternatives-01-los1", "lesson", [["securities of firms that are not publicly traded", "stakes in companies whose shares do not trade on a public exchange"]]),
  ...reworded("alternatives-03-los1", "q1", [["When an outside management team leads the acquisition, it is a management buy-in.", "A management buy-in is the case where the acquiring managers come from outside the company."]]),
  ...reworded("alternatives-03-los3", "q1", [["Private borrowers tend to be smaller and more focused, and their results depend more on", "Private borrowers are usually smaller, narrower businesses, so their results depend more on"]]),
  ...reworded("alternatives-05-los3", "q8", [["Farmland income is tied to commodity price levels", "Farmland income moves with crop and commodity prices"]]),
  ...reworded("alternatives-06-los1", "lesson", [["tend to offer returns between those of stocks and bonds", "have historically earned somewhere between what bonds and stocks earn"]]),
  ...reworded("alternatives-06-los3", "lesson", [
    ["when it has **both** a low volatility and a low correlation with the assets already held", "when it is **both** not very volatile itself and weakly correlated with the assets already held"],
    ["Event-driven and relative-value funds tend to lose money then, while macro and managed futures funds have tended to hold up better.", "Event-driven and relative-value strategies usually lose money then; macro and managed-futures strategies have usually held up better."],
  ]),
  ...reworded("alternatives-06-los3", "f2", [
    ["most diversifying to a stock and bond portfolio", "the best diversifier for a portfolio of stocks and bonds"],
    ["low volatility and low correlation with the stocks, bonds and other assets already held", "low volatility and a weak link to the stocks, bonds and other assets already held"],
  ]),
  ...reworded("alternatives-06-los3", "f4", [
    ["Macro and managed futures funds have tended to preserve or gain value.", "Macro and managed-futures strategies have usually kept or gained value."],
    ["Event-driven and relative-value funds tend to lose in crises", "Event-driven and relative-value strategies usually lose in crises"],
  ]),
  ...reworded("alternatives-07-los2", "lesson", [["is a digital instrument that is issued or represented using", "is anything of value that exists only as a record created and transferred using"]]),
  ...reworded("derivatives-01-los2", "lesson", [["standing between hedgers and speculators and earning a spread", "quoting prices to both sides and earning the gap between them"]]),
  ...reworded("derivatives-02-los1", "lesson", [["is an OTC agreement to exchange cash flows at regular intervals over an agreed period, on terms fixed today", "is an OTC contract in which two parties trade a series of payments on set dates over an agreed period, on terms fixed today"]]),
  ...reworded("derivatives-02-los1", "f2", [["An OTC agreement to exchange cash flows at regular intervals over an agreed period.", "An OTC contract in which two parties trade a series of payments on set dates over an agreed period."]]),
  ...reworded("derivatives-03-los1", "q6", [["OTC derivatives tend to be less liquid than exchange-traded ones", "OTC derivatives are usually harder to trade out of than exchange-traded ones"]]),
  ...reworded("derivatives-09-los1", "q1", [["A long put combined with a short position in the stock", "Buying a put while holding a short position in the stock"]]),
  ...reworded("econ-07-los3", "q5", [["and to worries about high credit growth, rising inflation and output volatility", "and to worries about fast credit expansion, accelerating inflation and swings in output"]]),
  ...reworded("equity-03-los3", "q6", [["The gap between the highest bid and the lowest ask", "The difference between the best bid price and the best ask price"]]),
  ...reworded("equity-11-los2", "lesson", [["**Sell-side analysts** work for brokerage houses and investment banks.", "**Sell-side analysts** are employed by brokerages and investment banks."]]),
  ...reworded("equity-11-los2", "q1", [
    ["Sell-side analysts work for brokerage houses and investment banks, and", "Sell-side analysts are employed by brokerages and investment banks, and"],
    ["and investment banks, and their research is offered to the firm's clients as a service.", "and investment banks, which give their research to clients as part of the service."],
  ]),
  ...reworded("equity-11-los2", "q2", [["Buy-side analysts work for institutional investors, and their research", "Buy-side analysts are employed by institutional investors, and their research"]]),
  ...reworded("ethics-01-los1", "q2", [
    ["basic principles of honesty, fairness, diligence and care and respect for others", "basic principles: being honest, being fair, being diligent, and treating others with care and respect"],
    ["Honesty, fairness, diligence, and care and respect for others are the widely acknowledged fundamentals.", "Being honest, fair and diligent, and treating others with care and respect, are the widely acknowledged fundamentals."],
  ]),
  ...reworded("ethics-01-los1", "f2", [["Honesty, fairness, diligence, and care and respect for others.", "Being honest, fair and diligent, and treating others with care and respect."]]),
  ...reworded("ethics-01-los4", "q5", [["Laws and regulations often do try to guide people toward ethical behavior, but they cannot cover all unethical conduct.", "Laws and regulations often do aim to steer people towards ethical behaviour, but they cannot cover all unethical conduct."]]),
  ...reworded("ethics-01-los5", "lesson", [["That conduct reflects poorly on him, his employer and the industry, so it falls under I(D).", "That conduct damages his own standing, his employer's and the industry's, so it falls under I(D)."]]),
  ...reworded("ethics-01-los8", "q3", [["Act, by elevating the issue to a higher authority", "Act, by taking the issue up the chain to someone more senior"]]),
  ...reworded("ethics-01-los8", "q5", [["Act, by elevating the issue to a higher authority", "Act, by taking the issue up the chain to someone more senior"]]),
  ...reworded("ethics-02-los1", "lesson", [["A candidate may be suspended or prohibited from further participation in the CFA Program.", "A candidate can be suspended from, or barred from continuing in, the CFA Program."]]),
  ...reworded("ethics-02-los1", "q1", [["Its hearing panels review misconduct allegations and impose sanctions for violations.", "Its hearing panels look into alleged misconduct and decide the penalty when a violation is found."]]),
  ...reworded("ethics-02-los1", "f4", [["Candidates may be suspended or prohibited from further participation in the CFA Program.", "Candidates can be suspended from, or barred from continuing in, the CFA Program."]]),
  ...reworded("ethics-04-los2", "lesson", [["ideally routed through a clearance area in the compliance or legal department", "ideally routed through a clearance desk run by compliance or legal"]]),
  ...reworded("ethics-04-los2", "q1", [["The barrier should restrict confidential information to those who need to know it.", "The barrier should keep confidential information from anyone whose job does not require it."]]),
  ...reworded("ethics-04-los3", "lesson", [["you must not distort prices or inflate trading volume with the *intent to mislead* other market participants", "you must not distort prices or artificially pump up trading volume in order to *mislead* other market participants"]]),
  ...reworded("ethics-06-los2", "f5", [["Work with superiors and within the firm structure to develop and implement a code, procedures, training and ethics-linked incentives.", "Work with senior management, through the firm's normal structure, to put in place a code, procedures, training and ethics-linked incentives."]]),
  ...reworded("ethics-06-los3", "lesson", [["if the employer is engaged in illegal or unethical activity, acts that would normally breach loyalty", "if the employer itself is doing something illegal or unethical, acts that would normally breach loyalty"]]),
  ...reworded("ethics-07-los1", "f1", [["a reasonable, adequate basis supported by appropriate research and investigation", "a reasonable and adequate basis, supported by appropriate research and investigation"]]),
  ...reworded("ethics-07-los2", "lesson", [["She should recreate the supporting records at the new firm and must not rebuild them from sources obtained at the old firm", "She should build a fresh set of supporting records at the new firm and must not reconstruct them from material taken from the old firm"]]),
  ...reworded("ethics-08-los3", "q4", [["to the bank's own personal financial management department that results in a sale", "to the bank's own wealth-management unit whenever the referral leads to a sale"]]),
  ...reworded("ethics-09-los1", "lesson", [
    ["broad topical areas and formulas tested or not tested are confidential", "even general topic areas and which formulas appeared (or did not) are confidential"],
    ["passing confidential program or exam information to candidates or the public", "sharing anything confidential about the program or an exam with other candidates or the public"],
  ]),
  ...reworded("ethics-09-los2", "q2", [["Candidates must not state or imply that", "A candidate may never claim or hint that"]]),
  ...reworded("ethics-09-los2", "q3", [["broad topical areas and formulas tested or not tested are confidential", "even general topic areas and which formulas appeared (or did not) are confidential"]]),
  ...reworded("ethics-10-los1", "lesson", [["must make **reasonable efforts to prevent and detect** violations", "must take **reasonable steps to stop violations before they happen and to catch** any that do"]]),
  ...reworded("ethics-10-los1", "q5", [["Supervisors may violate IV(C) if they know or should know that compliance procedures are not being followed.", "Supervisors can breach IV(C) when they are aware, or ought to be aware, that compliance procedures are being ignored."]]),
  ...reworded("ethics-10-los2", "lesson", [["asks supervisors to make **reasonable efforts to prevent and detect** violations", "asks supervisors to take **reasonable steps to stop violations before they happen and to catch** any that do"]]),
  ...reworded("ethics-10-los2", "q1", [["the supervisor's own duty to make reasonable efforts to prevent and detect violations", "the supervisor's own duty to take reasonable steps to stop and catch violations"]]),
  ...reworded("fixed-income-06-los2", "q8", [["so prices rise at an increasing rate as yields fall and decline at a decreasing rate as yields rise", "so each further drop in yield adds more to the price than the last, and each further rise in yield takes away less"]]),
  ...reworded("fixed-income-15-los1", "lesson", [["**Revenue bonds** are paid only from a specific project or system, such as a toll road or water utility", "**Revenue bonds** are repaid only out of what one named project earns, such as a toll road or water utility"]]),
  ...reworded("fsa-03-los2", "lesson", [["It is allocated **first to reduce goodwill to zero**, then to the other assets of the CGU pro rata to their carrying amounts.", "The loss hits **goodwill first, until it is written down to zero**; anything left is spread over the CGU's other assets in proportion to their carrying amounts."]]),
  ...reworded("fsa-03-los3", "lesson", [["Under US GAAP, assets at amortized cost follow the current expected credit loss (CECL) model.", "US GAAP applies its current expected credit loss (CECL) model to assets held at amortized cost."]]),
  ...reworded("fsa-04-los4", "lesson", [
    ["| Interest paid | Operating | Operating or financing |", "| Interest paid | Operating | Either operating or financing |"],
    ["| Interest received | Operating | Operating or investing |", "| Interest received | Operating | Either operating or investing |"],
    ["| Dividends paid | Financing | Operating or financing |", "| Dividends paid | Financing | Either operating or financing |"],
    ["| Dividends received | Operating | Operating or investing |", "| Dividends received | Operating | Either operating or investing |"],
  ]),
  ...reworded("fsa-06-los3", "q6", [["IFRS allows reversal when the reasons for the write-down no longer exist, limited to the original write-down.", "IFRS allows a reversal once the circumstances that caused the write-down have gone, capped at the amount originally written down."]]),
  ...reworded("fsa-10-los1", "lesson", [["Research shows that earnings are more persistent than cash flow on average, but large accruals of either sign reduce earnings persistence.", "Research finds that, on average, earnings carry forward better than cash flow does, yet a large accrual component (positive or negative) makes earnings less likely to persist."]]),
  ...reworded("fsa-10-los8", "lesson", [["Assuming profit is more reliable than cash flow because earnings are, on average, more persistent than cash flows.", "Assuming profit is more reliable than cash flow just because earnings usually carry forward better than cash flows do."]]),
  ...reworded("portfolio-02-los4", "lesson", [["holding 120% in the index and −20% in the riskless asset (borrowing at the riskless rate)", "that puts 120% into the index, funded by borrowing 20% at the risk-free rate"]]),
  ...reworded("portfolio-02-los4", "q6", [["When returns are driven by several sources of systematic risk, a multifactor model", "When more than one kind of market-wide risk drives returns, a multifactor model"]]),
  ...reworded("portfolio-03-los1", "lesson", [["showed that a lot of risk can be diversified away by holding a broad mix", "showed that holding a broad mix removes a large part of the risk"]]),
  ...reworded("portfolio-03-los3", "f4", [["A state-owned investment pool used to stabilise national budgets and secure wealth for future generations", "A state-owned investment pool that smooths government finances and sets money aside for future generations"]]),
  ...reworded("portfolio-03-los5", "lesson", [["fell from 1.10% in 2003 to 0.65% in 2023", "fell between 2003 and 2023, from 1.10% to 0.65%"]]),
  ...reworded("portfolio-04-los6", "f2", [["A brief description of the class and a performance benchmark.", "A short description of what the class covers and a benchmark to measure it against."]]),
];

/** A copy-guard rewording: same facts, our own words. */
function reworded(losId: string, id: string, replace: [string, string][]): HandFix[] {
  return [{ losId, id, note: "reworded a sentence that borrowed the source's phrasing (copy guard)", replace }];
}

// ---------- runner ----------

type Item = Lesson | Mcq | Flashcard;

function topicOf(losId: string): string {
  return losId.replace(/-\d+-los\d+$/, "");
}

/** Replace `from` with `to` in every string field, returning how many fields changed. */
function deepReplace(obj: unknown, from: string, to: string): number {
  let n = 0;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => {
      if (typeof v === "string") {
        if (v.includes(from)) {
          obj[i] = v.split(from).join(to);
          n++;
        }
      } else n += deepReplace(v, from, to);
    });
  } else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof v === "string") {
        if (v.includes(from)) {
          (obj as Record<string, unknown>)[k] = v.split(from).join(to);
          n++;
        }
      } else n += deepReplace(v, from, to);
    }
  }
  return n;
}

function generatedItem(file: GeneratedFile, id: string): Item | undefined {
  if (id === "lesson") return file.content.lesson;
  const i = Number(id.slice(1)) - 1;
  return id.startsWith("q") ? file.content.mcqs[i] : file.content.flashcards[i];
}

function verifiedItem(out: VerifiedFile, id: string): Checked<Item> | undefined {
  if (id === "lesson") return out.lesson;
  return (id.startsWith("q") ? out.mcqs : out.flashcards).find((c) => c.id === id);
}

const contains = (obj: unknown, text: string) => JSON.stringify(obj).includes(JSON.stringify(text).slice(1, -1));

/**
 * Apply one fix to a verified item (and best-effort to the generated one). Every step is idempotent, so
 * a fix can be extended and re-run; returns true when its note was newly recorded.
 */
export function applyFix(fix: HandFix, checked: Checked<Item>, generated: Item | undefined, today: string): boolean {
  for (const [from, to] of fix.replace ?? []) {
    const n = deepReplace(checked.item, from, to);
    if (n === 0 && !contains(checked.item, to)) throw new Error(`${fix.losId} ${fix.id}: text not found: "${from.slice(0, 60)}"`);
    if (n > 1) console.warn(`${fix.losId} ${fix.id}: "${from.slice(0, 40)}" replaced in ${n} fields`);
    if (generated && deepReplace(generated, from, to) === 0 && !contains(generated, to)) {
      console.warn(`${fix.losId} ${fix.id}: generated .json text differs; fix applied to the verified file only`);
    }
  }
  for (const [index, value] of Object.entries(fix.values ?? {})) {
    for (const item of [checked.item, generated]) {
      if (!item || !("options" in item)) continue;
      const o = item.options[Number(index)];
      if (!o) throw new Error(`${fix.losId} ${fix.id}: no option ${index}`);
      o.value = value;
    }
  }
  for (const id of fix.dropCitations ?? []) {
    for (const item of [checked.item, generated]) if (item) item.cited_chunk_ids = item.cited_chunk_ids.filter((c) => c !== id);
  }
  for (const name of fix.override ?? []) {
    const g: Gate | undefined = checked.gates[name];
    if (!g) throw new Error(`${fix.losId} ${fix.id}: no ${name} gate to override`);
    if (!g.pass) checked.gates[name] = { pass: true, issues: [`overridden by hand review ${today}; stored: ${g.issues.join("; ")}`] };
  }
  const prev = checked.gates.hand_fixed?.issues ?? [];
  if (prev.some((s) => s.endsWith(`: ${fix.note}`))) return false;
  checked.gates.hand_fixed = { pass: true, issues: [...prev, `${today}: ${fix.note}`] };
  return true;
}

function main() {
  const today = new Date().toISOString().slice(0, 10);
  const byFile = new Map<string, HandFix[]>();
  for (const f of FIXES) byFile.set(f.losId, [...(byFile.get(f.losId) ?? []), f]);

  let applied = 0;
  for (const [losId, fixes] of byFile) {
    const base = `content/generated/${topicOf(losId)}/${losId}`;
    const genPath = `${base}.json`;
    const verPath = `${base}.verified.json`;
    if (!existsSync(verPath)) throw new Error(`${verPath} does not exist`);
    const gen = existsSync(genPath) ? (JSON.parse(readFileSync(genPath, "utf8")) as GeneratedFile) : undefined;
    const out = JSON.parse(readFileSync(verPath, "utf8")) as VerifiedFile;
    for (const fix of fixes) {
      const checked = verifiedItem(out, fix.id);
      if (!checked) throw new Error(`${losId}: no item ${fix.id}`);
      if (applyFix(fix, checked, gen ? generatedItem(gen, fix.id) : undefined, today)) {
        applied++;
        console.log(`${losId} ${fix.id}: ${fix.note}`);
      }
    }
    // Written even when no note is new: an extended fix may have changed fields on a re-run.
    writeFileSync(verPath, JSON.stringify(out, null, 2) + "\n");
    if (gen) writeFileSync(genPath, JSON.stringify(gen, null, 2) + "\n");
  }
  console.log(`\nhand-fixes: ${applied} newly recorded, ${FIXES.length - applied} re-applied. Now run: npx tsx content-pipeline/requalify.ts`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("content-pipeline/hand-fixes.ts")) main();

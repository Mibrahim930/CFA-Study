/**
 * Cross-check lib/finance against the open CC BY 4.0 formula dataset
 * "cfa-frm-formula-sheets" by UniPrep2Go (https://github.com/marfa77/cfa-frm-formula-sheets).
 *   npx tsx scripts/crosscheck-formulas.ts <path-to-formulas.json>
 *
 * For every CFA Level I entry, evaluate the dataset's formula (transcribed by hand from its LaTeX)
 * on sample inputs and compare with the engine. Also report which Quant formulas appear in the
 * generated Quant lessons' formula lists. Read-only; prints a Markdown report to stdout.
 */
import { readFileSync, readdirSync } from "node:fs";
import * as f from "../lib/finance";

interface Entry {
  id: string;
  exam: string;
  topic: string;
  name: string;
  latex: string;
}

const file = process.argv[2];
if (!file) throw new Error("Pass the path to formulas.json");
const entries = (JSON.parse(readFileSync(file, "utf8")).entries as Entry[]).filter((e) => e.exam === "CFA Level I");

type Check = { dataset: number; engine: number; note?: string } | { gap: string } | { skip: string };
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

// One check per dataset id. "dataset" is the formula as written in the dataset; "engine" is lib/finance.
const bond = { face: 100, couponRate: 0.06, years: 5, freq: 1 };
const xs = [0.05, 0.01, -0.03, 0.07, 0.04];
const ys = [0.04, 0.02, -0.01, 0.05, 0.03];
const CHECKS: Record<string, () => Check> = {
  "cfa1-001": () => ({ dataset: 100 * (1 + 0.05) ** 10, engine: f.fv(0.05, 10, 0, -100) }),
  "cfa1-002": () => ({ dataset: (50 * (1 - (1 + 0.04) ** -8)) / 0.04, engine: -f.pv(0.04, 8, 50, 0) }),
  "cfa1-003": () => ({ dataset: 5 / 0.08, engine: f.growingPerpetuityPV(5, 0.08, 0) }),
  "cfa1-004": () => ({ dataset: (1 + 0.06 / 12) ** 12 - 1, engine: f.effectiveAnnualRate(0.06, 12) }),
  "cfa1-005": () => ({ dataset: 100 * Math.exp(0.05 * 3), engine: f.forwardPriceContinuous(100, 0.05, 3) }),
  "cfa1-006": () => ({ dataset: (108 - 100 + 2) / 100, engine: f.hpr(100, 108, 2) }),
  "cfa1-007": () => ({ dataset: xs.reduce((p, r) => p * (1 + r), 1) ** (1 / xs.length) - 1, engine: f.geometricMeanReturn(xs) }),
  "cfa1-008": () => {
    const m = xs.reduce((s, x) => s + x, 0) / xs.length;
    return { dataset: xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1), engine: f.variance(xs, "sample") };
  },
  "cfa1-009": () => {
    const m = xs.reduce((s, x) => s + x, 0) / xs.length;
    return { dataset: f.stdev(xs, "sample") / m, engine: f.coefficientOfVariation(xs) };
  },
  "cfa1-010": () => ({ dataset: (0.09 - 0.03) / 0.12, engine: f.sharpeRatio(0.09, 0.03, 0.12) }),
  "cfa1-011": () => ({ dataset: f.covariance(xs, ys, "sample") / (f.stdev(xs) * f.stdev(ys)), engine: f.correlation(xs, ys) }),
  "cfa1-012": () => ({ dataset: (0.9 * 0.02) / 0.116, engine: f.bayes(0.9, 0.02, 0.116) }),
  "cfa1-013": () => ({ skip: "z = (X − μ)/σ: no engine function; trivial arithmetic. Lesson quant-06-los2 lists it." }),
  "cfa1-014": () => ({ skip: "t = (x̄ − μ0)/(s/√n): no engine function; trivial. Lessons quant-07-los2/los3 list it." }),
  "cfa1-015": () => ({ dataset: f.covariance(xs, ys, "sample") / f.variance(xs, "sample"), engine: f.simpleRegression(xs, ys).slope }),
  "cfa1-016": () => {
    const r = f.simpleRegression(xs, ys);
    return { dataset: 1 - r.sse / r.sst, engine: r.rSquared };
  },
  "cfa1-017": () => ({ skip: "Price elasticity %ΔQ/%ΔP: no engine function (Economics not generated yet)." }),
  "cfa1-018": () => ({
    dataset: (1.25 * (1 + 0.04 * (90 / 360))) / (1 + 0.02 * (90 / 360)),
    engine: f.forwardFx(1.25, 0.04, 0.02, 90 / 360, "simple"),
    note: "dataset writes F_{f/d} with f = price currency, same as the engine's price/base convention",
  }),
  "cfa1-019": () => ({ skip: "Current ratio: no engine function; trivial ratio." }),
  "cfa1-020": () => ({ dataset: 40 + 35 - 30, engine: f.cashConversionCycle(40, 35, 30) }),
  "cfa1-021": () => ({ dataset: (120 / 1000) * (1000 / 800) * (800 / 500), engine: f.dupont3(120, 1000, 800, 500).roe }),
  "cfa1-022": () => ({ dataset: (500 - 20) / 200, engine: f.basicEps(500, 20, 200) }),
  "cfa1-023": () => ({ skip: "Interest coverage EBIT/interest: no engine function; trivial ratio." }),
  "cfa1-024": () => ({
    dataset: 0.4 * 0.06 * (1 - 0.25) + 0.1 * 0.07 + 0.5 * 0.11,
    engine: f.wacc({ wd: 0.4, rd: 0.06, tax: 0.25, wp: 0.1, rp: 0.07, we: 0.5, re: 0.11 }),
  }),
  "cfa1-025": () => {
    const cf = [-1000, 300, 400, 500];
    return { dataset: cf.reduce((s, c, t) => s + c / (1 + 0.1) ** t, 0), engine: f.npv(0.1, cf) };
  },
  "cfa1-026": () => ({ dataset: (1000 * (50 - 30)) / (1000 * (50 - 30) - 8000), engine: f.dol(1000, 50, 30, 8000) }),
  "cfa1-027": () => ({
    dataset: (1000 * (50 - 30) - 8000) / (1000 * (50 - 30) - 8000 - 2000),
    engine: f.dfl(1000 * (50 - 30) - 8000, 2000),
    note: "dataset's Q(P−V)−F is EBIT; engine takes EBIT and interest directly",
  }),
  "cfa1-028": () => ({ dataset: 0.03 + 1.2 * (0.09 - 0.03), engine: f.capm(0.03, 1.2, 0.09) }),
  "cfa1-029": () => ({ dataset: 2.1 / (0.1 - 0.04), engine: f.gordonValue(2.1, 0.1, 0.04) }),
  "cfa1-030": () => ({ dataset: 0.6 / (0.1 - 0.04), engine: f.justifiedForwardPE(0.6, 0.1, 0.04) }),
  "cfa1-031": () => ({ dataset: 4 / 0.08, engine: f.preferredValue(4, 0.08) }),
  "cfa1-032": () => ({ dataset: (40 * (1 - 0.5)) / (1 - 0.25), engine: f.marginCallPrice(40, 0.5, 0.25) }),
  "cfa1-033": () => {
    let p = 0;
    for (let t = 1; t <= 5; t++) p += 6 / 1.07 ** t;
    p += 100 / 1.07 ** 5;
    return { dataset: p, engine: f.bondPrice(bond, 0.07) };
  },
  "cfa1-034": () => ({
    dataset: f.macaulayDuration(bond, 0.07) / (1 + 0.07),
    engine: f.modifiedDuration(bond, 0.07),
    note: "annual-pay bond so r = yield per period; for semiannual bonds the engine divides by (1 + y/2), the dataset's 'r' must be read as the periodic yield",
  }),
  "cfa1-035": () => ({
    dataset: -4.2 * 0.01 + 0.5 * 25 * 0.01 ** 2,
    engine: f.priceChangeEstimate(4.2, 25, 0.01),
  }),
  "cfa1-036": () => ({
    dataset: 4.2 * 102.5,
    engine: f.moneyDuration(4.2, 102.5),
    note: "PVBP = (PV− − PV+)/2 also matches f.pvbp (checked separately)",
  }),
  "cfa1-037": () => ({
    dataset: ((1 + 0.05) ** 3 / (1 + 0.04) ** 1) ** (1 / 2) - 1,
    engine: f.forwardRate(0.04, 1, 0.05, 3),
    note: "dataset states the identity (1+S_{A+B})^{A+B} = (1+S_A)^A (1+F)^B; solved for F here",
  }),
  "cfa1-038": () => ({ dataset: 100 * (1 + 0.05) ** 0.5, engine: f.forwardPrice(100, 0.05, 0.5) }),
  "cfa1-039": () => ({ dataset: 100 + 3 - 50 / (1 + 0.05) ** 1, engine: f.callFromParity(3, 100, 50, 0.05, 1) }),
  "cfa1-040": () => ({ dataset: (1 + 0.05 - 0.8) / (1.2 - 0.8), engine: f.binomialOnePeriod(100, 100, 1.2, 0.8, 0.05, "call").q }),
  "cfa1-041": () => ({
    dataset: 0.6 ** 2 * 0.2 ** 2 + 0.4 ** 2 * 0.1 ** 2 + 2 * 0.6 * 0.4 * 0.3 * 0.2 * 0.1,
    engine: f.portfolioStdev2(0.6, 0.2, 0.1, 0.3) ** 2,
  }),
  "cfa1-042": () => ({
    dataset: f.covariance(xs, ys, "sample") / f.variance(ys, "sample"),
    engine: f.correlation(xs, ys) * (f.stdev(xs) / f.stdev(ys)),
    note: "no dedicated beta() in the engine; both forms of the dataset's identity computed from engine primitives",
  }),
  "cfa1-043": () => ({
    dataset: (0.12 - 0.03) / 1.2 + (0.12 - (0.03 + 1.2 * (0.1 - 0.03))),
    engine: f.treynorRatio(0.12, 0.03, 1.2) + f.jensensAlpha(0.12, 0.03, 1.2, 0.1),
    note: "Treynor and Jensen's alpha checked as a sum on one input set",
  }),
  "cfa1-044": () => ({
    // Dataset: management fee on ending value, incentive on the gain net of it, no hurdle or high-water mark.
    dataset: 0.02 * 120 + 0.2 * (120 - 0.02 * 120 - 100),
    engine: f.hedgeFundFee({ beginValue: 100, endValue: 120 }).totalFee,
    note: "engine defaults match the dataset's simplification; hurdle and high-water mark are optional inputs",
  }),
};

// Quant lessons: which dataset Quant formulas appear in a lesson's formula list?
const lessonFormulas: { los: string; name: string; latex: string }[] = [];
for (const fn of readdirSync("content/generated/quant").filter((x) => x.endsWith(".verified.json"))) {
  const v = JSON.parse(readFileSync(`content/generated/quant/${fn}`, "utf8"));
  for (const fo of v.lesson.item.formulas ?? []) lessonFormulas.push({ los: v.losId, name: fo.name, latex: fo.latex });
}
const LESSON_MATCH: Record<string, RegExp> = {
  "cfa1-001": /future value|FVs*=s*PV/i,
  "cfa1-002": /annuity/i,
  "cfa1-003": /perpetuity/i,
  "cfa1-004": /effective annual|EAR/,
  "cfa1-005": /continuous/i,
  "cfa1-006": /holding period/i,
  "cfa1-007": /geometric mean/i,
  "cfa1-008": /sample variance/i,
  "cfa1-009": /coefficient of variation/i,
  "cfa1-010": /sharpe/i,
  "cfa1-011": /correlation/i,
  "cfa1-012": /bayes/i,
  "cfa1-013": /z-score|standardis|standardiz/i,
  "cfa1-014": /t-test|t-statistic/i,
  "cfa1-015": /regression slope|slope/i,
  "cfa1-016": /coefficient of determination|R\^2/i,
};

const lines: string[] = [];
lines.push(`# Cross-check: lib/finance vs cfa-frm-formula-sheets (CFA Level I, ${entries.length} entries)`, "");
lines.push(`Run on ${new Date().toISOString().slice(0, 10)}. "match" = dataset formula and engine agree to 1e-9 on sample inputs.`, "");
lines.push("| id | topic | formula | result | note |", "|---|---|---|---|---|");
const tally = { match: 0, mismatch: 0, gap: 0, skip: 0 };
for (const e of entries) {
  const fn = CHECKS[e.id];
  let result: string;
  let note = "";
  if (!fn) {
    result = "no check written";
  } else {
    const c = fn();
    if ("gap" in c) {
      result = "**engine gap**";
      note = c.gap;
      tally.gap++;
    } else if ("skip" in c) {
      result = "n/a";
      note = c.skip;
      tally.skip++;
    } else {
      const ok = close(c.dataset, c.engine);
      result = ok ? "match" : `**MISMATCH** dataset=${c.dataset} engine=${c.engine}`;
      note = c.note ?? "";
      if (ok) tally.match++;
      else tally.mismatch++;
    }
  }
  lines.push(`| ${e.id} | ${e.topic} | ${e.name} | ${result} | ${note} |`);
}
lines.push("", `**Totals:** ${tally.match} match, ${tally.mismatch} mismatch, ${tally.gap} engine gaps, ${tally.skip} not applicable (no engine function needed).`, "");

lines.push("## Quant formulas: dataset vs the generated Quant lessons", "", "| id | formula | in a lesson's formula list? |", "|---|---|---|");
for (const e of entries.filter((x) => x.topic === "Quantitative Methods")) {
  const re = LESSON_MATCH[e.id];
  const hits = lessonFormulas.filter((l) => re.test(l.name) || re.test(l.latex));
  const where = [...new Set(hits.map((h) => h.los))].join(", ");
  lines.push(`| ${e.id} | ${e.name} | ${hits.length ? where : "**not listed**"} |`);
}
console.log(lines.join("\n"));

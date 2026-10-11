import { describe, expect, it } from "vitest";
import { calcGateMcq, calcGateWorkedExample, copyGuard, ifrs18Gate, lintMcq, numbersIn, textShowsValue } from "./gates";
import type { Mcq } from "./schema";

const ids = new Set(["os:a", "os:b"]);

// PV of 1,000 in 10 years at 5% = 613.91 (engine returns −613.91 under the BA II Plus sign convention).
function pvItem(overrides: Partial<Mcq> = {}): Mcq {
  return {
    kind: "calc",
    difficulty: "easy",
    stem: "What is the present value of $1,000 received in 10 years if the annual discount rate is 5%?",
    options: [
      { text: "$613.91", value: 613.91, explanation: "Discount 1,000 by 1.05^10." },
      { text: "$950.00", value: 950, explanation: "Subtracts 5% once instead of compounding." },
      { text: "$666.67", value: 666.67, explanation: "Uses simple interest: 1,000 / 1.5." },
    ],
    answer_index: 0,
    calc_spec: { fn: "pv", args_json: '{"rate":0.05,"n":10,"fv":1000}' },
    cited_chunk_ids: ["os:a"],
    ...overrides,
  };
}

describe("lint gate", () => {
  it("passes a well-formed item", () => {
    expect(lintMcq(pvItem(), ids)).toEqual([]);
  });

  it("rejects a duplicate distractor", () => {
    const m = pvItem();
    m.options[2] = { ...m.options[1] };
    expect(lintMcq(m, ids).join()).toMatch(/not distinct/);
  });

  it("rejects 'all of the above' and wrong option counts", () => {
    const m = pvItem();
    m.options[2] = { text: "All of the above", value: 1, explanation: "x" };
    expect(lintMcq(m, ids).join()).toMatch(/banned/);
    expect(lintMcq(pvItem({ options: pvItem().options.slice(0, 2) }), ids).join()).toMatch(/exactly 3/);
  });

  it("rejects citations of chunks that were not retrieved", () => {
    expect(lintMcq(pvItem({ cited_chunk_ids: ["os:made-up"] }), ids).join()).toMatch(/unknown chunk/);
  });

  it("requires a calc_spec on calc items", () => {
    expect(lintMcq(pvItem({ calc_spec: null }), ids).join()).toMatch(/no calc_spec/);
  });
});

describe("calc gate", () => {
  it("accepts a key that matches the engine (sign convention ignored for TVM)", () => {
    const r = calcGateMcq(pvItem());
    expect(r.status).toBe("pass");
    expect(r.expected).toBeCloseTo(-613.913, 2);
  });

  it("rejects a deliberately wrong key", () => {
    const r = calcGateMcq(pvItem({ answer_index: 1 }));
    expect(r.status).toBe("fail");
    expect(r.issues.join()).toMatch(/key value 950/);
    expect(r.issues.join()).toMatch(/distractor 0/);
  });

  // From the pilot: 3-year 6% semiannual bond at 8% → 94.76; a 94.85 distractor is a legitimate near-miss.
  const bond = (keyIndex: number): Mcq =>
    pvItem({
      options: [
        { text: "94.76", value: 94.76, explanation: "Correct." },
        { text: "94.85", value: 94.85, explanation: "Compounding slip." },
        { text: "76.89", value: 76.89, explanation: "Ignores coupons." },
      ],
      answer_index: keyIndex,
      calc_spec: { fn: "bondPrice", args_json: '{"bond":{"face":100,"couponRate":0.06,"years":3,"freq":2},"ytm":0.08}' },
    });

  it("allows a near-miss distractor but rejects it as the key", () => {
    expect(calcGateMcq(bond(0)).status).toBe("pass");
    const wrongKey = calcGateMcq(bond(1));
    expect(wrongKey.status).toBe("fail");
    expect(wrongKey.issues.join()).toMatch(/distractor 0 \(94\.76\) equals the engine value/);
  });

  it("rejects option text that disagrees with its value", () => {
    const m = pvItem();
    m.options[0] = { ...m.options[0], text: "$631.91" };
    expect(calcGateMcq(m).issues.join()).toMatch(/does not show its value/);
  });

  it("rejects unknown functions and malformed args", () => {
    expect(calcGateMcq(pvItem({ calc_spec: { fn: "magic", args_json: "{}" } })).status).toBe("fail");
    expect(calcGateMcq(pvItem({ calc_spec: { fn: "pv", args_json: "rate=0.05" } })).issues.join()).toMatch(/not valid JSON/);
  });

  it("checks worked examples too, including percent display", () => {
    const ok = calcGateWorkedExample({
      problem: "Stated 12% compounded monthly. EAR?",
      steps: ["(1 + 0.12/12)^12 − 1"],
      answer: "12.68%",
      answer_value: 0.126825,
      calc_spec: { fn: "effectiveAnnualRate", args_json: '{"statedRate":0.12,"m":12}' },
    });
    expect(ok.status).toBe("pass");
  });
});

describe("display numbers", () => {
  it("parses money and percents", () => {
    expect(numbersIn("$1,234.50 or 5.25%")).toEqual([1234.5, 5.25]);
    expect(textShowsValue("5.25%", 0.0525)).toBe(true);
    expect(textShowsValue("5.52%", 0.0525)).toBe(false);
  });
});

describe("copy guard", () => {
  const los = "calculate and interpret the present value of fixed-income and equity instruments based on expected future cash flows";

  it("rejects a near-verbatim LOS copy", () => {
    const text = "In this lesson you will calculate and interpret the present value of fixed-income and equity instruments based on expected future cash flows.";
    expect(copyGuard(text, [{ label: "LOS", text: los, maxRun: 10 }])).toHaveLength(1);
  });

  it("allows short shared phrases", () => {
    const text = "The present value of fixed-income instruments depends on the discount rate.";
    expect(copyGuard(text, [{ label: "LOS", text: los, maxRun: 10 }])).toEqual([]);
  });
});

describe("IFRS 18 gate", () => {
  it("flags IFRS 18 concepts and passes IAS 1-era wording", () => {
    expect(ifrs18Gate("Under IFRS 18, the operating category…")).toHaveLength(1);
    expect(ifrs18Gate("Disclose management-defined performance measures")).toHaveLength(1);
    expect(ifrs18Gate("IAS 1 requires an income statement")).toEqual([]);
  });
});

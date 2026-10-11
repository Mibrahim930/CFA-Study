import { describe, expect, it } from "vitest";
import { expandQuery, losFacets } from "./context";

describe("losFacets", () => {
  it("splits a shared head over two objects and drops lone verbs", () => {
    const f = losFacets("calculate and interpret the present value of fixed-income and equity instruments based on expected future cash flows");
    expect(f).toContain("fixed-income instruments");
    expect(f).toContain("equity instruments");
    expect(f).not.toContain("calculate");
  });

  it("expands numbered lists into one facet per item", () => {
    const f = losFacets("calculate, interpret, and evaluate various measures of (1) central tendency and location and (2) dispersion");
    expect(f.some((x) => x.includes("central tendency"))).toBe(true);
    expect(f.some((x) => x.includes("dispersion") && x.includes("measures of"))).toBe(true);
  });
});

describe("expandQuery", () => {
  it("adds textbook wording for curriculum terms", () => {
    expect(expandQuery("equity instruments")).toMatch(/stock/);
    expect(expandQuery("common-size income statements")).toMatch(/vertical analysis/);
    expect(expandQuery("bond duration")).toBe("bond duration");
  });
});

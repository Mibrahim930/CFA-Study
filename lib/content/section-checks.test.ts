import { describe, expect, it } from "vitest";
import { assignChecks } from "./section-checks";

const sections = [
  { heading: "What a bond is", body: "A bond is a loan: the issuer pays coupons and returns the face value at maturity." },
  { heading: "Yield to maturity", body: "The yield to maturity is the single discount rate that prices the bond's coupons and face value." },
  { heading: "Duration", body: "Duration measures price sensitivity to a change in yield." },
];

describe("assignChecks", () => {
  it("puts each card after the section it shares the most vocabulary with", () => {
    const cards = [
      { id: "f1", front: "What does duration measure?", back: "Price sensitivity to a change in yield." },
      { id: "f2", front: "Define yield to maturity.", back: "The single discount rate that prices all the bond's cash flows." },
    ];
    expect(assignChecks(sections, cards)).toEqual([null, 1, 0]);
  });
  it("uses a card at most once and gives a section at most one card", () => {
    const cards = [
      { id: "a", front: "Duration and yield", back: "Duration, yield, price sensitivity." },
      { id: "b", front: "Duration again", back: "Duration measures sensitivity." },
    ];
    const out = assignChecks(sections, cards);
    expect(out.filter((c) => c !== null)).toHaveLength(1);
    expect(out[2]).toBe(0);
  });
  it("leaves unrelated cards and empty sections alone", () => {
    expect(assignChecks(sections, [{ id: "x", front: "Capital of France?", back: "Paris." }])).toEqual([null, null, null]);
    expect(assignChecks([], [{ id: "x", front: "Duration", back: "Duration." }])).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { examSecured, moduleMastery, modulePractice, topicProgress } from "./progress";
import type { ModuleState } from "./store/local";
import type { LosPractice } from "./store/practice";

const empty: ModuleState = { done: false, losDone: [], videos: [], notes: [] };
const score = (right: number, total: number): LosPractice => ({ attempts: 1, last: { right, total, at: 0 }, best: right / total });

describe("module mastery", () => {
  it("is not started with no state and learning once anything is touched", () => {
    expect(moduleMastery(undefined)).toBe(0);
    expect(moduleMastery(empty)).toBe(0);
    expect(moduleMastery({ ...empty, notes: [{ id: "n", text: "x", createdAt: 0 }] })).toBe(1);
    expect(moduleMastery({ ...empty, losDone: ["a"] })).toBe(1);
  });
  it("is practised after a finished set, whatever the score", () => {
    expect(moduleMastery(empty, { a: score(1, 6) }, ["a", "b"])).toBe(2);
  });
  it("marking complete alone is practised, not solid", () => {
    expect(moduleMastery({ ...empty, done: true })).toBe(2);
    expect(moduleMastery({ ...empty, done: true }, { a: score(4, 6) }, ["a"])).toBe(2);
  });
  it("is solid once complete and the latest scores average 80% or more", () => {
    expect(moduleMastery({ ...empty, done: true }, { a: score(5, 6), b: score(6, 6) }, ["a", "b"])).toBe(3);
    // 5/6 + 3/6 = 8/12 < 80%, so a weak outcome pulls the module back to practised.
    expect(moduleMastery({ ...empty, done: true }, { a: score(5, 6), b: score(3, 6) }, ["a", "b"])).toBe(2);
  });
  it("averages by question, not by outcome, and ignores outcomes never practised", () => {
    expect(modulePractice({ a: score(8, 10), c: score(1, 1) }, ["a", "b", "c"])).toEqual({ practised: 2, average: 9 / 11 });
    expect(modulePractice({}, ["a"])).toEqual({ practised: 0, average: null });
  });
});

describe("topic progress", () => {
  const topics = [
    { id: "t1", name: "One", weight: { min: 10, max: 20 }, moduleSlugs: ["a", "b"] },
    { id: "t2", name: "Two", weight: { min: 5, max: 5 }, moduleSlugs: ["c"] },
  ];
  it("counts each step and rolls up a topic label", () => {
    const [one, two] = topicProgress(topics, { a: 3, b: 2, c: 1 });
    expect(one).toMatchObject({ solid: 1, practised: 1, learning: 0, solidShare: 0.5, practisedShare: 0.5, mastery: 2, points: 15 });
    expect(two).toMatchObject({ solid: 0, practised: 0, learning: 1, mastery: 1 });
    expect(topicProgress(topics, { a: 3, b: 3 })[0].mastery).toBe(3);
  });
  it("secures exam weight only for solid modules", () => {
    expect(examSecured(topicProgress(topics, { a: 3, b: 2, c: 2 }))).toBe(Math.round((7.5 / 20) * 100));
    expect(examSecured(topicProgress(topics, {}))).toBe(0);
  });
});

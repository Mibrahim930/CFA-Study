import { describe, expect, it } from "vitest";
import { getModule, syllabus, totals } from "./index";
import { STUDY_ORDER, TOPICS } from "./topics";

describe("2027 syllabus", () => {
  it("has the official counts", () => {
    expect(syllabus.curriculumYear).toBe(2027);
    expect(syllabus.topics).toHaveLength(10);
    expect(totals.modules).toBe(102);
    expect(totals.los).toBe(340);
  });

  it("matches the verified module list and 2027 weights", () => {
    for (const def of TOPICS) {
      const topic = syllabus.topics.find((t) => t.id === def.id)!;
      expect(topic.modules.map((m) => m.title)).toEqual(def.modules);
      expect(topic.weight).toEqual(def.weight);
    }
    const w = Object.fromEntries(TOPICS.map((t) => [t.id, t.weight]));
    expect(w.ethics).toEqual({ min: 10, max: 15 });
    expect(w.quant).toEqual({ min: 11, max: 14 });
    expect(w.derivatives).toEqual({ min: 6, max: 9 });
    expect(w.alternatives).toEqual({ min: 6, max: 9 });
  });

  it("weight midpoints sum to roughly 100%", () => {
    const mid = TOPICS.reduce((n, t) => n + (t.weight.min + t.weight.max) / 2, 0);
    expect(mid).toBeGreaterThan(95);
    expect(mid).toBeLessThan(110);
  });

  it("has unique ids and slugs, and every module has LOS", () => {
    const mods = syllabus.topics.flatMap((t) => t.modules);
    expect(new Set(mods.map((m) => m.slug)).size).toBe(mods.length);
    const losIds = mods.flatMap((m) => m.los.map((l) => l.id));
    expect(new Set(losIds).size).toBe(losIds.length);
    for (const m of mods) {
      expect(m.los.length).toBeGreaterThan(0);
      expect(getModule(m.slug)?.module.id).toBe(m.id);
    }
  });

  it("study order covers every topic once", () => {
    expect([...STUDY_ORDER].sort()).toEqual(TOPICS.map((t) => t.id).sort());
  });

  it("LOS text has no leaked page furniture", () => {
    const all = syllabus.topics.flatMap((t) => t.modules.flatMap((m) => m.los.map((l) => l.text)));
    for (const text of all) {
      expect(text).not.toMatch(/©|Topic Outlines|LEARNING OUTCOMES|candidate should be able/);
      expect(text).toBe(text.trim());
    }
  });
});

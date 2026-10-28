import type { ModuleState } from "@/lib/store/local";
import type { LosPractice } from "@/lib/store/practice";

// Progress the way the exam is scored: by official topic weight. Pure functions; no React, no storage.

/**
 * Four honest mastery steps, derived from what was actually done:
 *  0 Not started: nothing touched.
 *  1 Learning: a lecture watched, a note taken or an outcome ticked, but no practice set finished.
 *  2 Practised: at least one practice set finished (or the module marked complete) but not yet solid.
 *  3 Solid: the module is marked complete AND the latest practice scores average 80% or better.
 * "Complete" alone is never solid: a tick is a claim, a score is evidence.
 */
export type Mastery = 0 | 1 | 2 | 3;
export const MASTERY_LABEL: Record<Mastery, string> = { 0: "Not started", 1: "Learning", 2: "Practised", 3: "Solid" };
/** Average of the latest practice scores a completed module needs to count as solid. */
export const SOLID_THRESHOLD = 0.8;

export interface TopicWeight {
  id: string;
  name: string;
  weight: { min: number; max: number };
  moduleSlugs: string[];
}

export interface TopicProgress extends TopicWeight {
  /** Midpoint of the official weight range, in percentage points of the exam. */
  points: number;
  solid: number;
  practised: number;
  learning: number;
  /** Share of the topic's modules at each step (0–1). */
  solidShare: number;
  practisedShare: number;
  learningShare: number;
  mastery: Mastery;
}

/** The latest practice scores for a module's outcomes: how many are practised and their average (0–1). */
export function modulePractice(practice: Record<string, LosPractice>, losIds: string[]): { practised: number; average: number | null } {
  const scores = losIds.map((id) => practice[id]?.last).filter((l): l is LosPractice["last"] => !!l && l.total > 0);
  if (!scores.length) return { practised: 0, average: null };
  const right = scores.reduce((a, s) => a + s.right, 0);
  const total = scores.reduce((a, s) => a + s.total, 0);
  return { practised: scores.length, average: right / total };
}

export function moduleMastery(s: ModuleState | undefined, practice: Record<string, LosPractice> = {}, losIds: string[] = []): Mastery {
  const { practised, average } = modulePractice(practice, losIds);
  if (s?.done && average !== null && average >= SOLID_THRESHOLD) return 3;
  if (s?.done || practised > 0) return 2;
  if (!s) return 0;
  if (s.losDone.length || s.videos.length || s.lastVideo || s.notes.length) return 1;
  return 0;
}

export function midpoint(w: { min: number; max: number }): number {
  return (w.min + w.max) / 2;
}

export function topicProgress(topics: TopicWeight[], mastery: Record<string, Mastery>): TopicProgress[] {
  return topics.map((t) => {
    const n = t.moduleSlugs.length;
    const solid = t.moduleSlugs.filter((s) => mastery[s] === 3).length;
    const practised = t.moduleSlugs.filter((s) => mastery[s] === 2).length;
    const learning = t.moduleSlugs.filter((s) => mastery[s] === 1).length;
    const m: Mastery = n && solid === n ? 3 : solid > 0 || practised > 0 ? 2 : learning > 0 ? 1 : 0;
    return {
      ...t,
      points: midpoint(t.weight),
      solid,
      practised,
      learning,
      solidShare: n ? solid / n : 0,
      practisedShare: n ? practised / n : 0,
      learningShare: n ? learning / n : 0,
      mastery: m,
    };
  });
}

/** Percentage points of the exam secured: each topic's weight, scaled by the share of its modules that are solid. */
export function examSecured(progress: TopicProgress[]): number {
  const total = progress.reduce((a, t) => a + t.points, 0) || 100;
  const secured = progress.reduce((a, t) => a + t.points * t.solidShare, 0);
  return Math.round((secured / total) * 100);
}

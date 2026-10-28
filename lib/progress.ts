import type { ModuleState } from "@/lib/store/local";

// Progress the way the exam is scored: by official topic weight. Pure functions; no React, no storage.

/** Four honest mastery steps. "Solid" is only a completed module; "practised" needs question history (coming). */
export type Mastery = 0 | 1 | 2 | 3;
export const MASTERY_LABEL: Record<Mastery, string> = { 0: "Not started", 1: "Learning", 2: "Practised", 3: "Solid" };

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
  learning: number;
  /** Share of the topic's modules that are solid / still learning (0–1). */
  solidShare: number;
  learningShare: number;
  mastery: Mastery;
}

export function moduleMastery(s: ModuleState | undefined): Mastery {
  if (!s) return 0;
  if (s.done) return 3;
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
    const learning = t.moduleSlugs.filter((s) => (mastery[s] ?? 0) > 0 && mastery[s] !== 3).length;
    const m: Mastery = n && solid === n ? 3 : solid > 0 ? 2 : learning > 0 ? 1 : 0;
    return {
      ...t,
      points: midpoint(t.weight),
      solid,
      learning,
      solidShare: n ? solid / n : 0,
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

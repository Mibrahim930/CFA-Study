import data from "@/content/syllabus-2027.json";
import type { Module, Syllabus, Topic } from "./types";
import { STUDY_ORDER, type TopicId } from "./topics";

export const syllabus = data as Syllabus;

export function getTopic(id: string): Topic | undefined {
  return syllabus.topics.find((t) => t.id === id);
}

export function getModule(slug: string): { topic: Topic; module: Module } | undefined {
  for (const topic of syllabus.topics) {
    const module = topic.modules.find((m) => m.slug === slug);
    if (module) return { topic, module };
  }
  return undefined;
}

export function topicsInStudyOrder(): Topic[] {
  return STUDY_ORDER.map((id: TopicId) => getTopic(id)!);
}

export const totals = {
  modules: syllabus.topics.reduce((n, t) => n + t.modules.length, 0),
  los: syllabus.topics.reduce((n, t) => n + t.modules.reduce((k, m) => k + m.los.length, 0), 0),
};

export type { Module, Syllabus, Topic, Los } from "./types";
export { TOPICS, STUDY_ORDER } from "./topics";
export type { TopicId } from "./topics";

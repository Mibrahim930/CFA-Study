import type { TopicId } from "./topics";

export interface Los {
  id: string;
  text: string;
}

export interface Module {
  id: string;
  slug: string;
  order: number;
  title: string;
  los: Los[];
}

export interface Topic {
  id: TopicId;
  name: string;
  weight: { min: number; max: number };
  session: 1 | 2;
  modules: Module[];
}

export interface Syllabus {
  curriculumYear: number;
  source: string;
  generatedAt: string;
  topics: Topic[];
}

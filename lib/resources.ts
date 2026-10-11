import type { TopicId } from "./syllabus/topics";

/**
 * Free outside resources, used on their own sites only. Their content is never ingested into the
 * content pipeline (FreeFellow's terms explicitly prohibit AI training; the rest are proprietary).
 * URLs were checked on 2026-10-10. Terms come from docs/PLAN.md "Free supplements" and
 * docs/reliability-research.md "Past-curriculum transfer map".
 */

export type ResourceKind = "official" | "question-bank" | "course" | "trial" | "video";

export interface Resource {
  id: string;
  name: string;
  provider: string;
  url: string;
  kind: ResourceKind;
  /** "all" or the topics it is most useful for. */
  topics: TopicId[] | "all";
  cost: string;
  /** Length of a time-limited trial; the trial tracker counts it down. */
  trialDays?: number;
  /** When in the study plan to use it. */
  when: string;
  /** Caveats a beginner should know (currency, sign-up, reliability). */
  notes: string;
  extra?: { label: string; url: string };
}

export const RESOURCES: Resource[] = [
  {
    id: "cfa-sample-questions",
    name: "Level I sample questions",
    provider: "CFA Institute",
    url: "https://www.cfainstitute.org/programs/cfa-program/cfa-program-level-i-sample-questions",
    kind: "official",
    topics: "all",
    cost: "Free: 10 on the page, 20 more via a form",
    when: "Once early to see the exam style, again near the end as a check",
    notes: "The only official questions available before registering. Use them to judge whether the app's questions are too easy.",
  },
  {
    id: "cfa-ethics-quizzes",
    name: "Standards of Professional Conduct quizzes",
    provider: "CFA Institute",
    url: "https://www.cfainstitute.org/standards/professionals/code-ethics-standards/standards-of-professional-conduct-quiz",
    kind: "official",
    topics: ["ethics"],
    cost: "Free",
    when: "After each Ethics module",
    notes: "Official short quizzes on the current Code and Standards.",
  },
  {
    id: "cfa-ethics-lab",
    name: "Ethics Learning Lab",
    provider: "CFA Institute",
    url: "https://www.cfainstitute.org/insights/professional-learning/ethics-resources/learning-lab",
    kind: "official",
    topics: ["ethics"],
    cost: "Free courses",
    when: "During the Ethics topic",
    notes: "Needs a free CFA Institute account, which you create yourself. Scenario-based courses on ethical decision-making and applying the Code and Standards.",
  },
  {
    id: "cfa-ethics-casebook",
    name: "Ethics in Practice casebook (2nd ed.)",
    provider: "CFA Institute",
    url: "https://www.cfainstitute.org/-/media/documents/ethics-in-practice/ethics-in-practice-casebook-2nd-edition-web.pdf",
    kind: "official",
    topics: ["ethics"],
    cost: "Free PDF",
    when: "Extra Ethics practice",
    notes: "100 short cases with questions. Published 2019, before the 2024 Standards revisions, so check cases on Competence, client disclosure and conflicts against the current Handbook. Its questions have 4 options; the exam has 3.",
  },
  {
    id: "freefellow",
    name: "FreeFellow free Level I question bank",
    provider: "FreeFellow (CFA Institute prep provider)",
    url: "https://freefellow.org/free/cfa-level-1/",
    kind: "question-bank",
    topics: "all",
    cost: "Free; browsing needs no sign-up, an account adds tracking",
    when: "Weekly practice from the start, by topic",
    notes: "2026 curriculum, so it matches 2027 for 7 topics. Quant and Equity were rewritten for 2027, so expect some mismatch there. Question counts on its own site disagree (1,201 to 1,804).",
    extra: { label: "Free 50-question PDF", url: "https://freefellow.org/free/cfa-level-1/practice-questions-pdf/" },
  },
  {
    id: "ift",
    name: "IFT free course",
    provider: "IFT",
    url: "https://ift.world/",
    kind: "course",
    topics: "all",
    cost: "Free, no card",
    trialDays: 365,
    when: "Start whenever; access lasts a year",
    notes: "Videos, notes and questions; you choose the exam year when signing up. Start the tracker when you create the account.",
  },
  {
    id: "analystprep",
    name: "AnalystPrep free trial",
    provider: "AnalystPrep",
    url: "https://analystprep.com/free-trial/",
    kind: "trial",
    topics: "all",
    cost: "Free, no card, no time limit",
    when: "Any time",
    notes: "The first topic's study notes plus about 100 practice questions.",
  },
  {
    id: "finquiz",
    name: "FinQuiz",
    provider: "FinQuiz",
    url: "https://www.finquiz.com/",
    kind: "question-bank",
    topics: ["quant"],
    cost: "Free Quant questions with sign-up, plus a free mock",
    when: "Quant: time value of money, statistics, regression",
    notes: "Written by charterholders; curriculum year unclear. Because 2027 rewrote Quant, stick to the classic calculation topics.",
    extra: { label: "Free Level I video playlist", url: "https://www.youtube.com/playlist?list=PLxAunyTa64uewhsyAF93FlJ9mMfd-DxO7" },
  },
  {
    id: "salt",
    name: "Salt Solutions trial",
    provider: "Salt Solutions",
    url: "https://www.saltsolutions.com/",
    kind: "trial",
    topics: ["quant"],
    cost: "Free, no card",
    trialDays: 14,
    when: "Your Quant weeks",
    notes: "Time-limited, so start it the week you begin Quant.",
  },
  {
    id: "uworld",
    name: "UWorld trial",
    provider: "UWorld",
    url: "https://finance.uworld.com/cfa/",
    kind: "trial",
    topics: ["fixed-income"],
    cost: "Free, no card, about 100 questions",
    trialDays: 7,
    when: "Your Fixed Income week",
    notes: "Time-limited, so save it for Fixed Income, our thinnest topic in the free sources.",
  },
  {
    id: "kinnu",
    name: "Kinnu trial",
    provider: "Kinnu",
    url: "https://kinnu.xyz/",
    kind: "trial",
    topics: "all",
    cost: "Free, no card, includes mocks",
    trialDays: 7,
    when: "The last weeks before the exam",
    notes: "Save it for mock exams near the end.",
  },
];

export const resourcesForTopic = (topicId: TopicId) =>
  RESOURCES.filter((r) => r.topics === "all" || r.topics.includes(topicId));

export const KIND_LABEL: Record<ResourceKind, string> = {
  official: "Official",
  "question-bank": "Question bank",
  course: "Course",
  trial: "Trial",
  video: "Video",
};

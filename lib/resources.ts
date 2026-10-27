import type { TopicId } from "./syllabus/topics";

/**
 * Free outside resources, used on their own sites only. Their content is never ingested into the
 * content pipeline (FreeFellow's terms explicitly prohibit AI training; the rest are proprietary).
 * URLs were checked on 2026-10-10; the entries added on 2026-10-27 come from the platform search in
 * docs/resource-search-2026-10.md. Terms come from docs/PLAN.md "Free supplements" and
 * docs/reliability-research.md "Past-curriculum transfer map".
 */

export type ResourceKind = "official" | "question-bank" | "course" | "trial" | "video" | "notes";

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
    id: "cfa-ecosystem",
    name: "Official practice questions and mock exams",
    provider: "CFA Institute",
    url: "https://www.cfainstitute.org/programs/cfa-program/candidate-resources/mock-exam-and-practice-questions",
    kind: "official",
    topics: "all",
    cost: "Included with exam registration",
    when: "The day you register: do its end-of-module questions alongside this app's; mocks appear about 60 days before your exam window",
    notes: "The Learning Ecosystem comes with registration: 1,000+ practice questions written by the exam's own question writers, two official mocks, study plans and flashcards. The closest thing to the real exam. The Practice Pack (five more mocks) is a paid $299 add-on you don't need.",
    extra: { label: "What the Learning Ecosystem includes", url: "https://www.cfainstitute.org/programs/cfa-program/learning-ecosystem" },
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
  {
    id: "300hours-mock",
    name: "300Hours free Level I mock",
    provider: "300Hours with Salt Solutions",
    url: "https://300hours.com/free-cfa-level-1-mock-exam/",
    kind: "question-bank",
    topics: "all",
    cost: "Free; the PDF needs no sign-up, scoring needs your email",
    when: "Your first full-length mock, about 6 weeks out",
    notes: "90 questions weighted like the real exam, 2 h 15 min, with explanations and a percentile. Says it follows the 2026 curriculum (checked 2026-10-27).",
    extra: { label: "Mock as a PDF", url: "https://3h.rs/L1MockPDF" },
  },
  {
    id: "300hours-cheat-sheets",
    name: "300Hours topic cheat sheets",
    provider: "300Hours",
    url: "https://300hours.com/cfa-level-1-quantitative-methods-cheat-sheet/",
    kind: "notes",
    topics: "all",
    cost: "Free, no sign-up",
    when: "At the end of each topic, as a revision summary",
    notes: "One web page per topic (all 10) with key formulas, decision tables and calculator tips, labelled 2026 and kept updated. Readers report errors in the comments and the author fixes them, so skim the comments too.",
    extra: { label: "Ethics cheat sheet", url: "https://300hours.com/cfa-level-1-ethics-cheat-sheet/" },
  },
  {
    id: "freefellow-formulas",
    name: "FreeFellow formula sheet",
    provider: "FreeFellow",
    url: "https://freefellow.org/free/cfa-level-1/formula-sheet/",
    kind: "notes",
    topics: "all",
    cost: "Free, no sign-up, web page plus a PDF",
    when: "Keep it open while doing calculation practice",
    notes: "97 formulas across 9 topics, labelled for the 2026 syllabus. Every formula in this app is checked by its own calculator engine; use this sheet to spot anything the app is missing.",
  },
  {
    id: "freefellow-diagnostic",
    name: "FreeFellow 12-question readiness check",
    provider: "FreeFellow",
    url: "https://freefellow.org/free/cfa-level-1/diagnostic/",
    kind: "question-bank",
    topics: "all",
    cost: "Free, no sign-up",
    when: "Before you start, then again after each 3 topics, to see the gap closing",
    notes: "A quick mixed-topic quiz with an instant readiness score. Too short to mean much on its own; useful as a repeatable 5-minute benchmark.",
  },
  {
    id: "freefellow-glossary",
    name: "FreeFellow Level I glossary",
    provider: "FreeFellow",
    url: "https://freefellow.org/free/cfa-level-1/glossary/",
    kind: "notes",
    topics: "all",
    cost: "Free, no sign-up",
    when: "When a term in a lesson still feels fuzzy after the app's definition",
    notes: "34 key terms in plain language, labelled 2026. Short, so treat it as a second explanation, not a reference.",
  },
  {
    id: "300hours-ba2plus",
    name: "BA II Plus calculator guide",
    provider: "300Hours",
    url: "https://300hours.com/ba-ii-plus-guide/",
    kind: "notes",
    topics: ["quant", "fixed-income", "corpfin"],
    cost: "Free, no sign-up",
    when: "Your first week, before any time-value-of-money practice",
    notes: "Settings to change on day one (decimal places, P/Y = 1, the AOS calculation method) and keystrokes for TVM, cash flows, NPV/IRR and statistics. The app's worked examples use the same keystrokes.",
  },
  {
    id: "300hours-prob-tables",
    name: "Probability distribution tables (PDF)",
    provider: "300Hours",
    url: "https://3h.rs/probabilitytables",
    kind: "notes",
    topics: ["quant"],
    cost: "Free PDF, no sign-up",
    when: "Quant: distributions and hypothesis testing",
    notes: "z, t, F, chi-squared and Durbin-Watson tables plus the six z-values worth memorising. The exam gives you any table excerpt you need, so use these for practice, not memorising.",
  },
  {
    id: "schweser-free",
    name: "Kaplan Schweser free Level I tools",
    provider: "Kaplan Schweser",
    url: "https://www.schweser.com/cfa/level-1/free-study-materials",
    kind: "question-bank",
    topics: "all",
    cost: "Free with your email",
    when: "Diagnostic early on; the daily question all the way through",
    notes: "A 60-question diagnostic exam, a question of the day by email until exam day, free flashcards and a formula-sheet eBook. Sign up yourself; the page blocks automated checks, so this listing comes from search results (2026-10-27).",
  },
  {
    id: "fintree-youtube",
    name: "FinTree lectures",
    provider: "FinTree (YouTube)",
    url: "https://www.youtube.com/@fintreeindia",
    kind: "video",
    topics: "all",
    cost: "Free",
    when: "When a module's own lecture didn't land and you want a second teacher",
    notes: "About 880 videos; full Level I crash-course sessions by topic dated 2026 and a November 2026 review session. Indian provider, clear and exam-focused; check each video's date against the curriculum year.",
  },
  {
    id: "analystprep-youtube",
    name: "AnalystPrep mock walkthroughs",
    provider: "AnalystPrep (YouTube)",
    url: "https://www.youtube.com/playlist?list=PLIYnk9FMYckv5FKFRDVTAYdt5D6JuX88k",
    kind: "video",
    topics: "all",
    cost: "Free",
    when: "After your first mock, to see how an instructor works through exam questions",
    notes: "Playlist working through a full Level I mock question by question. Their channel (about 890 videos) also has topic lectures.",
  },
  {
    id: "meldrum-youtube",
    name: "Mark Meldrum on YouTube",
    provider: "Mark Meldrum (YouTube)",
    url: "https://www.youtube.com/@markmeldrum",
    kind: "video",
    topics: "all",
    cost: "Free videos; the full course is paid ($300–500)",
    when: "For a topic you find hard, after the app's lesson",
    notes: "The most-recommended paid Level I instructor; about 970 videos on the free channel, often from earlier curriculum years, so check dates. The paid course isn't needed for this plan.",
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
  notes: "Notes & formulas",
};

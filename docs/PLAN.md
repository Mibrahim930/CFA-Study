# CFA Level I Study App: Build Plan + Content Strategy

## Context
The user is a total finance beginner. They have no study materials and **will not register for now**, so the official
CFA curriculum and question bank are not available. They study 10–15 hrs/week on laptop and phone. Claude API
credits are fine to spend, but study materials should be free. The exam fee is reimbursed by their employer and the
date will be decided later, so this plan is date-agnostic. The planner takes a target date whenever one is chosen.
**The biggest hurdle is getting trustworthy study content.** This plan solves that with a grounded, verified
content pipeline, then builds the app around it. The project dir `/Users/wagdyiibrahim/code/CFA-Prep` is empty (greenfield).

Two Sonnet research agents reported back and I audited them. Everything marked ✅ I verified myself against primary sources.

---

## 1. Key verified facts that shape the design
- ✅ **2027 curriculum** (all exams from Feb 2027): 180 standalone 3-option MCQs in 2×135 min, and **102 learning modules
  with 340 learning outcome statements (LOS)**, which I extracted from the free official topic-outline PDF.
- ✅ 2027 weights: Ethics 10–15 · Quant 11–14 · Econ 6–9 · FSA 11–14 · Corporate Finance 6–9 · Equities 11–14 ·
  Fixed Income 11–14 · Derivatives & Risk Mgmt 6–9 · Alternatives 6–9 · Portfolio Construction 8–12.
  Several prep sites wrongly say the weights are unchanged from 2026.
- ✅ Pass mark: scale 1000–1900 with a minimum passing score of 1600; the score report draws 50%/70% lines per topic. Pass rate was 43% (Aug 2026).
- ✅ The outline PDF is marked "For candidate use only. Not for distribution", so the **app and repo must be private**.
- ✅ r/CFA has many threads of ChatGPT getting CFA reasoning and maths wrong ("Chat GPT isn't a calculator"),
  so **no AI-generated answer is trusted without verification.**
- Evidence base: practice testing and spaced repetition are the highest-utility techniques (Dunlosky 2013, Roediger 2006,
  Cepeda 2006). FSRS scheduling via `ts-fsrs` (MIT, ✅ 810★, active).

**Audit log:**
- I rejected the prep sites' "weights unchanged" claim.
- I sent the ecosystem agent back twice: first for missing Reddit evidence and free resources, then (via archived Wayback copies) it found 17 real threads, 4 of which I checked word for word.
- I challenged the OpenStax licence claim and the agent was right.
- I rejected scraping or bulk-saving of trial content.

---

## 2. Where the study content comes from (the core problem)

### 2.0 Reliability framework
No single source is trusted on its own. Reliability comes from layering sources and cross-checking them:
1. **Math is verified by code, never by AI.** The finance engine is golden-tested against the official calculator guide; any calc item that disagrees with it is rejected.
2. **Source trust tiers.**
   - **T1 authoritative:** CFA Institute free docs (outline, Standards Handbook, sample Qs), CFA Institute Research Foundation, IFRS standards, SEC and Treasury.
   - **T2 textbook:** OpenStax, MIT OCW, Yale OYC.
   - **T3 explanatory:** YouTube lectures (good for intuition; curriculum-year drift and caption errors).
   - **T4:** Claude's own knowledge (gap-filler only).
   - A claim is **Verified** if a T1/T2 source supports it, or if two independent sources agree (e.g., a lecture plus a textbook).
3. **Everything is cited.** Every lesson and question shows its sources: a book section, a Handbook passage, or a video link at the exact timestamp.
4. **Multi-check:** schema lint → calc engine → blind solve by a second model → grounding critic → copy guard.
5. **External calibration.** The app's question style is tuned on CFA's 30 free sample Qs. App scores are compared with free mocks and trials (UWorld, Kinnu): if the app scores far higher than outside questions, the app is too easy.
6. **Human in the loop.** Pilot gate on Quant, a report button that quarantines instantly, and periodic review of flagged items in Claude Code sessions.
7. **2027 currency.** The rewritten Quant, Equities and Ethics modules get the strictest checks. Older sources are labeled with their curriculum year.
8. **Final safety net:** the official curriculum and mocks after registration ("reconcile" mode).

**Usage rule for sources:** open-licensed and public-domain sources (OpenStax, MIT, Yale, SEC, Fed) may be adapted with
attribution. "All rights reserved" sources (Research Foundation, EY/RSM, CFA docs, videos) are read **privately as
grounding only**: Claude writes original wording, the copy guard enforces it, and the app links back to the source. They are never reproduced.

### 2a. Legal, free source corpora (✅ verified)
| Source | Licence | How the app gets it | Role |
|---|---|---|---|
| Official 2027 topic outline: 102 modules, 340 LOS | © CFA Institute, candidate use | Parse PDF locally with macOS PDFKit (proven this session) | **The syllabus map**: every piece of content hangs off an LOS |
| OpenStax *Principles of Finance 2e*, *Principles of Accounting Vol 1*, *Principles of Economics 3e*, *Introductory Business Statistics 2e* | CC BY-NC-SA 4.0 (✅ LICENSE file in repo) | `git clone` of `github.com/openstax/osbooks-*` (CNXML source), chunked by section | Grounding text and the Foundations track (with attribution) |
| CFA Institute *Standards of Practice Handbook* 12th ed. + *Code & Standards* (✅ free public PDFs) | © CFA Institute, personal use | Download once and extract text locally; private DB only | Grounding for **all of Ethics** (the primary source) |
| ✅ CFA Institute Research Foundation: *Alternative Investments: A Primer* (2018, 183 pp), Statman *Behavioral Finance* (2019), *Elements of an IPS* (2010); also Factor Investing, Cryptoassets briefs | All rights reserved (free public PDFs) | Download once, extract text locally | T1 grounding: Alternatives, behavioural biases, IPS, factor models |
| ✅ MIT OCW 15.401 Finance Theory I (fixed income, equities, forwards/futures, options, portfolio theory, CAPM; video + notes + exams), 15.433 Investments | CC BY-NC-SA 4.0 | Download course ZIPs (OCW offers them) | T2: Fixed Income, Derivatives, Portfolio |
| Yale OYC ECON 252 Financial Markets (Shiller) | CC BY-NC-SA 3.0 | Course pages | T2: market structure, derivatives, behavioural finance |
| ✅ SEC (public information, copyable with citation), TreasuryDirect (FRNs, TIPS), Treasury yield-curve data, Federal Reserve (public domain) | Public | Fetch pages | T1: instrument features, real yield-curve data for term-structure examples |
| ✅ EY "US GAAP vs IFRS: The basics" (Jan 2026), RSM comparisons (Apr 2026); IFRS standards (free registration) | All rights reserved | Download PDFs | T1: IFRS vs US GAAP, deferred taxes, inventories, leases |
| Damodaran (NYU Stern) free classes and spreadsheets | No reuse licence | Links | T2 explanatory: equity valuation |
| ~~Wikipedia~~ | — | — | **Dropped** per user (not reliable enough) |
| Free videos: Let Me Explain, FinTree, IFT, AnalystPrep YouTube | Proprietary | Links only, mapped per module | Watch-along lessons |

### 2b. Coverage map: written sources (✅ OpenStax chapter lists + audited gap-source report)
| Topic (weight) | Coverage | Best free sources |
|---|---|---|
| Quant (11–14) | **Strong**. Gaps: simulation, data science/AI | OpenStax Finance ch 7–9, 12–14; Business Statistics |
| Economics (6–9) | **Strong**. Gaps: geopolitics, FX cross-rate maths | OpenStax Economics 3e |
| Ethics (10–15) | **Strong** | Standards of Practice Handbook + Code |
| FSA (11–14) | **Medium-high**. Gap: financial reporting quality | OpenStax Accounting; SEC Beginners' Guide; EY/RSM IFRS-vs-GAAP; IFRS standards |
| Corporate Finance (6–9) | **Medium** | OpenStax Finance ch 2, 16, 17, 19; MIT 15.401 capital budgeting |
| Portfolio Construction (8–12) | **Medium-high** | MIT 15.401/15.433; Research Foundation IPS paper; Statman |
| Alternatives (6–9) | **Medium-high** (was none) | Research Foundation Alternatives Primer; Cryptoassets brief; SEC hedge-fund bulletin |
| Equities (11–14) | **Medium**. Gaps: industry/company analysis, voting/jurisdiction | OpenStax ch 11, 18; MIT 15.401; Damodaran; Research Foundation Factor Investing |
| Derivatives (6–9) | **Low-medium** | MIT 15.401 forwards/futures/options; Yale; plus the finance engine |
| Fixed Income (11–14) | **Low-medium**. Weakest: ABS/MBS, credit analysis | MIT 15.401; TreasuryDirect/Treasury curve data; FINRA (link only); plus the finance engine |

Mitigations for what's still thin (FI securitisation/credit, derivatives pricing, equity industry analysis, the 2027-new data-science module):
- **Most FI and Derivatives content is mathematical** (bond pricing, YTM, spot/forward curves, duration, convexity, forwards, put–call parity, binomial, swaps), so the finance engine verifies it in code.
- **Video lectures (§2d) fill the explanatory gap.** Free CFA-specific lectures cover exactly these modules.
- **Remaining qualitative items** get the strictest checks and a "model-verified" badge, plus an external cross-check by
  scheduling the free trials (UWorld, Kinnu) for those weeks.

### 2d. Video lectures as the teacher: the "watch-along" model (✅ verified)
**Why we are not using transcripts:**
- ✅ YouTube's ToS bans "automated means (such as robots, botnets or scrapers)" and downloading. It **permits** personal
  viewing and "the embeddable YouTube player".
- ✅ Transcript tools are being blocked anyway. youtube-transcript-api issue #592 (open since Apr 2026) reports protected
  caption tracks return an empty body with "no workaround available"; every CFA channel sampled had them.
- So claude-watch, yt-dlp and the transcript MCP servers are **out**. I audited devinilabs/claude-watch too: its code is clean,
  but it is unmaintained and its plugin install is broken.

**What we do instead:**
- **Primary course: Let Me Explain** (free, most recommended on r/CFA). 417 videos, ~168 h, all 10 topics, with
  **Quant and Equities labelled 2027** (the rewritten modules).
  - Per-topic hours: FI 42, FSA 24, Econ 16, Derivatives 16, Quant 14, Alternatives 13, Equities 13, Portfolio 13, CorpFin 11, Ethics 7.
  - Supplements: AnalystPrep (22 h series), IFT "Demystified" (2021, concepts only), Wall Street Notes (Quant).
- **Video map:** the official YouTube Data API (free key, metadata only, which is permitted) pulls playlist titles and
  durations. Claude maps each video to its 2027 module(s), and the user can correct the mapping.
- **Watch-along loop per video:**
  1. Watch it embedded in the app (official IFrame player, speed control, resume position).
  2. Take timestamped notes in your own words.
  3. Answer an immediate 5-question check from the verified QBank for that module.
  4. Missed items become flashcards.
  5. Claude can turn *your notes* into a clean summary.
  - The video teaches; the app makes it stick and verifies it.
- **Time budget:** ~168 h of video at 1.25–1.5× is ~115–135 h. Add ~150 h of practice and flashcards and ~60 h of review and mocks,
  for **~330–350 h total**. The planner schedules this.
- **Optional, clean route to transcripts:** ask the creators (Let Me Explain, IFT) for permission or transcripts. I can
  draft the emails; the user sends them. If they grant it, their transcripts become T3 grounding.

### 2c. The generation pipeline (scripts in repo, run per topic, results stored in DB)
1. **Ingest:** load LOS + source chunks into Postgres with full-text search. No embeddings provider is needed.
2. **Retrieve:** for each LOS, use full-text search to find candidate chunks, then Claude picks the relevant ones (with citations).
3. **Generate:** Claude Sonnet via the **Batch API** + prompt caching. Strict JSON, Zod-validated. Original wording only. For each LOS it produces:
   - **Lesson block:** a beginner-level explanation, intuition, a worked example, formulas (KaTeX), common exam traps, and "builds on / leads to" links.
   - **6–8 MCQs:** 3 options each, a mix of concept and calculation questions, an explanation for every option, and cited chunk ids.
   - **3–5 flashcards.**
4. **Verify.** Every item must pass each gate in turn:
   a. Lint gates: exactly 3 options, one key, no "all of the above", distractors distinct.
   b. **Calculation items:** the item carries a `calc_spec` {fn, inputs}. The finance engine recomputes it, and the item is **rejected unless the key matches (±0.5%)** and no distractor equals the key.
   c. **Blind solve:** a separate Claude Opus call answers the question without seeing the key. If it disagrees, regenerate once, then quarantine.
   d. **Grounding critic:** checks every factual claim against the cited chunks and flags anything unsupported.
   e. **Copy guard:** an n-gram overlap check against LOS and Handbook text, so nothing is copied verbatim.
   f. **Badge:** Grounded+Verified / Verified / Model-only, shown in the UI.
5. **Pilot first:** run the pipeline on **Quant (11 modules)** and the Foundations track. Then:
   - The user and I review ~30 sampled items.
   - Prompts and rubrics are tuned.
   - Only then do the other topics run, each generated a couple of weeks ahead of when it's studied.
6. **Feedback loop:**
   - A "Report error" button quarantines an item instantly.
   - Flagged items get reviewed in later Claude Code sessions.
   - "Generate more like this" reuses the same pipeline.
7. **Later, if the user registers:** a reconcile mode lets them mark lessons checked against the official curriculum.

Spend control: estimate the cost at the pilot using the `claude-api` skill (current pricing). There is a budget cap
env var, and a spend meter in the app. Content is generated once and stored; only tutor chat costs per use.

---

## 3. How we build it

### Stack
- **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui**, as an installable **PWA** for phone use (flashcards work offline).
- **Supabase** (free tier): Postgres (content, full-text search, progress) + Auth (magic link, **allowlisted to the user's email**).
- **Vercel Hobby** hosting. **Private GitHub repo.** The Claude API is called server-side only, with the key in env vars.
- Libraries: `@anthropic-ai/sdk`, `ts-fsrs`, `katex`, `zod`, `recharts`; YouTube IFrame Player API + Data API v3 (metadata only); `vitest` + `playwright` for tests.
- Source-ingest scripts download only free public PDFs, OpenStax/MIT course files and public pages. Nothing is downloaded from YouTube.
- The app name must not include "CFA" (trademark). The footer says "Not affiliated with CFA Institute."

### Repo layout (planned)
```
/app                 Next.js routes: today, learn/[module], practice, review, mock, progress, resources, tutor
/lib/finance         pure-TS finance engine (TVM, NPV/IRR, bonds, duration/convexity, returns, stats/regression,
                     forwards/futures, put–call parity, binomial, swaps, WACC, ratios), with golden tests
/lib/srs             ts-fsrs wrapper (90% target retention, daily new-card cap)
/content-pipeline    ingest-outline.ts, ingest-openstax.ts, ingest-pdfs.ts (Handbook, Research Foundation,
                     EY/RSM), ingest-mit-ocw.ts, ingest-gov.ts (SEC/Treasury), video-map.ts (YouTube metadata),
                     generate.ts (Batch API), verify.ts (gates a–f), prompts/, rubrics/
/supabase            migrations: topics, modules, los, source_chunks, lessons, questions, cards, review_logs,
                     attempts, mocks, plan, resources, trials, flags
```

### Milestones
- **M1: Skeleton + syllabus + video map + calculator.**
  - Scaffold, auth, and PWA.
  - Ingest the outline: assert 10 topics / 102 modules / 340 LOS.
  - YouTube Data API video map (Let Me Explain + supplements → modules).
  - Embedded watch-along player with timestamped notes. **You can start learning from videos on day 1.**
  - **Finance engine with golden tests**, plus a BA II Plus keystroke drill.
  - Usable on day 1 alongside free videos.
- **M2: Content pipeline pilot.** Ingest the OpenStax repos and Handbook. Run generation and verification on Foundations + Quant. User review session; tune.
- **M2.5: "L1 expert" Claude skill + knowledge base.** The pipeline's verified per-LOS notes (formulas, worked examples,
  traps, citations) become a searchable knowledge base (`kb/` + a `kb search` CLI/MCP tool). A custom skill
  (`.claude/skills/l1-expert/SKILL.md`) makes Claude:
  - search the knowledge base first and cite it;
  - compute every number with the finance engine;
  - flag pre-2027 material;
  - say "not in verified notes" instead of guessing.
  The same instructions drive the in-app tutor. Teaching-style ideas are borrowed from lyra81604/CFA-skill_cfa-level1-tutor
  (MIT; it contains no CFA content itself).
- **M3: Study loop.** Today view (lesson → questions → flashcards), QBank with error-type tagging, mistake-to-flashcard flow, FSRS reviews.
- **M4: Scale content.** Run the remaining 9 topics through the pipeline, in study order: FSA → Corporate Finance → Equities → Fixed Income →
  Derivatives → Alternatives → Portfolio Construction → Economics → Ethics. Ethics also runs alongside as 1 hr/week.
- **M5: Exam simulation and insight.**
  - Mock engine: 2×90 questions, 135-min timers, topic mix drawn from the 2027 weights.
  - A score report with 50%/70% lines.
  - Readiness dashboard.
  - Planner that takes a target date when the user picks one.
  - AI tutor chat grounded on the current lesson.
  - Spend meter.

### Study approach baked into the app
- Beginner Foundations track first (~35 hrs): accounting basics, TVM + calculator, statistics, economics. It is built from OpenStax, so it's highly grounded.
- Then topics in the order above, budgeting ~330–350 hrs total and allocating hours by 2027 weight (FSA and Fixed Income +20% for difficulty).
- Retrieval-first: every session is questions + flashcards, and lessons are short. The new-card cap prevents review overload.

### Free supplements (✅ = terms verified on the provider's page; use inside their sites only, one account each)
| Supplement | Terms | When to use it |
|---|---|---|
| CFA Institute 30 sample questions | Free | Calibrate the app's question style and difficulty |
| ✅ AnalystPrep | No card, no time limit | Always on |
| ✅ Salt Solutions | No card, 14 days | Quant |
| ✅ UWorld | No card, 7 days, ~100 questions | Fixed Income week |
| ✅ Kinnu | No card, 7 days, includes mocks | Late-stage mocks |
| Free mocks: 300Hours (90 questions), FinQuiz (180 questions) | Free | Late-stage mocks |

The app's trial tracker records each trial's start and end dates.

---

## 4. Verification (how we'll know it works)
- `vitest`:
  - Finance engine golden values, taken from the official "Mastering your calculator" guide examples and OpenStax worked examples.
  - Ingest asserts: 102 modules / 340 LOS, weights table.
  - Pipeline gate tests: a deliberately wrong calc key must be rejected; a near-verbatim LOS copy must be rejected; a duplicate distractor must be rejected.
- Pilot quality bar before scaling:
  - ≥95% of sampled calc items correct.
  - 0 copied passages.
  - The user rates ≥80% of sampled lessons "clear for a beginner".
- `playwright` smoke test: log in → Today → answer question → review flashcard → finish a mini mock.
- Manual checks:
  - `npm run dev`, previewed in the browser pane at desktop and mobile widths.
  - Deploy to Vercel; install the PWA on the phone.

# CFA Level I resource search (2026-10-27)

A sweep of the platforms that carry Level I study material, run with Agent-Reach (GitHub channel), the YouTube Data API (official, no scraping), web search and direct page checks. Every item marked **verified** was opened and read on 2026-10-27; items marked *from search* come from search snippets only because the site blocks automated reads.

The good free finds were added to `lib/resources.ts` (the app's Resources page). The rest is here for reference.

## What was covered, and what wasn't

| Platform | How | Result |
|---|---|---|
| Web | WebSearch + page reads | Done |
| YouTube | Official Data API with the project key | Done (channels and playlists below) |
| GitHub | Agent-Reach `github search` | Done |
| Reddit (r/CFA) | — | **Not searchable from this environment**: reddit.com is blocked for both the fetch tool and the browser pane, and Agent-Reach's Reddit channel needs its browser install (`agent-reach add reddit`), which was out of scope ("public channels only"). r/CFA's wiki and "free resources" threads remain worth reading by hand. |
| Twitter/X, LinkedIn, Facebook, Instagram | — | Need a login in Agent-Reach; skipped by decision. Nothing Level I-specific expected there anyway. |
| Bilibili, Xiaohongshu, V2EX, Xueqiu, Boss | — | Chinese platforms; removed from Agent-Reach as irrelevant. |
| Agent-Reach web channel | — | Its Exa backend failed on the first call and paused itself (`UPSTREAM_BROKEN`); web search was done with the built-in tool instead. |

## Free resources, verified

### Official (CFA Institute)
- **Level I sample questions** — already in the app.
- **Learning Ecosystem** (with registration): 1,000+ practice questions, two official mocks about 60 days before the window, study plans, flashcards. The **Practice Pack** (five more mocks, 1,000 more questions, a Prometric mock) is a **paid** add-on, USD 299 — not free. Source: cfainstitute.org candidate-resources pages.

### Mocks and question banks
- **300Hours free Level I mock** — 90 questions, 2 h 15 min, exam-weighted, explanations and a percentile; PDF needs no sign-up, scoring needs an email. Page says it follows the 2026 curriculum. https://300hours.com/free-cfa-level-1-mock-exam/ · PDF https://3h.rs/L1MockPDF — **verified, added to app**.
- **FreeFellow** — already in the app. Also verified: a free 12-question diagnostic (no sign-up) at /free/cfa-level-1/diagnostic/ and a glossary.
- **Kaplan Schweser free tools** — 60-question diagnostic, question of the day by email, free flashcards, formula-sheet eBook; all need an email. https://www.schweser.com/cfa/level-1/free-study-materials — *from search* (site returns 403 to automated reads) — **added to app with that caveat**.
- **FinQuiz free mock** — one free mock with sign-up; FinQuiz is already in the app.
- **CFA Society Hong Kong** runs free in-person mock sessions — not useful from here.

### Notes, cheat sheets, formula sheets
- **300Hours topic cheat sheets** — one web page per topic, all 10, labelled 2026, with formulas, decision tables and calculator tips; reader comments flag errors that get corrected. Quant: https://300hours.com/cfa-level-1-quantitative-methods-cheat-sheet/ (links to the other nine) — **verified, added to app**.
- **FreeFellow formula sheet** — 97 formulas across 9 topics, "calibrated to the 2026 syllabus", web + PDF, no sign-up. https://freefellow.org/free/cfa-level-1/formula-sheet/ — **verified, added to app**.
- **300Hours probability tables PDF** (z, t, F, chi-squared, Durbin-Watson): https://3h.rs/probabilitytables.
- **300Hours study planner** (email): https://300hours.com/cfa-study-planner/. The app's Today plan covers this; listed for completeness.
- **IFT free stuff** — already in the app. Note: the full lecture series on the free page is from the **2021** curriculum; the sample notes, Ethics quiz, mock sample and TVM Q-bank have no year stated. https://ift.world/freestuff/

### Video (YouTube, via the official API)
Channel stats on 2026-10-27:

| Channel | Subscribers | Videos | Notes |
|---|---|---|---|
| Let me explain (@letmeexplaincfa) | 112k | 943 | Already mapped module-by-module in the app (425 videos) |
| Mark Meldrum (@markmeldrum) | 234k | 969 | Most-recommended paid instructor; many free videos, often older curriculum years — **added** |
| FinTree (@fintreeindia) | 187k | 882 | 2026 Level I crash-course sessions by topic; Nov-2026 review session — **added** |
| IFT (@ift-cfa) | 143k | 797 | Already in app via ift.world |
| AnalystPrep (@analystprep) | 127k | 886 | Mock walkthrough playlist PLIYnk9FMYckv5FKFRDVTAYdt5D6JuX88k — **added** |
| Kaplan Schweser (@kaplanschweser) | 28k | 203 | Webinars and tips |
| FinQuiz Pro (@finquizpro) | 25k | 113 | Crash-course playlist already in the app |
| PrepNuggets (@prepnuggets) | 39k | 126 | Paid platform; channel has samples |
| The Valuation School (@thevaluationschool) | 918k | 554 | General finance/CFA roadmap videos (Indian); not module teaching |

Other playlists seen: CFA with Kamesh Bhatt (mock solving, question series), Kunal Doshi "Top 500" questions, FTC Global curriculum questions, Parth Verma live mock solving, PW "CFA Level-1 Feb 2026 Marathons". Not verified for quality.

### Anki / flashcards
- **No current free Level I Anki deck found.** The one public AnkiWeb deck (453127574) was last updated January 2021 per FreeFellow's blog; the AnkiWeb page itself didn't load. Decks on Gumroad are paid ($5 to CHF 80). The app's own flashcards (primers + lessons, FSRS scheduling) cover this.

## GitHub (Agent-Reach)
Mostly personal note repos; two are worth a developer's look, none are for the student directly:

- **marfa77/cfa-frm-formula-sheets** — open formula reference: 44 Level I formulas as JSON/CSV with LaTeX, variables and notes, plus 2026 and 2027 topic weights; data CC BY 4.0, code MIT, validation scripts. Maintainer UniPrep2Go; authorship method not stated. **Useful as a cross-check against `lib/finance` and the app's formula lists** (not as a source for lesson text).
- **aditano/cfa-l1-practice** — 1,220 three-option questions "version 2026.2", GPL-3.0, generated by scripts; the README claims structural validation only, **no answer verification**. Don't ingest.
- **HBarma/CFA-Level-I** — LaTeX notes for the 2025 syllabus, "not exhaustive"; license not visible.
- **BDFD-Learning-Ground/Certificate_Charateered-Financial-Analyst_CFA** — notes, formula sheet, mock; MIT; last pushed 2024.
- Tools: smrik/cfa-quiz-to-anki (userscript exporting CFA Institute practice-quiz review pages to Anki TSV), DannySu09/CFA-Learning-Mate (Chrome extension, same idea). Both act on the official site; use at your own risk under its terms.
- Several 2026 flashcard/notes repos with 0 stars (catalinbondari, thales1020, amishah1998, abdulazizhhalabi): unverified personal projects.

## Paid, for reference only
Mark Meldrum ($300–500), Kaplan Schweser packages ($799–1,099), PrepNuggets L1 Essentials, UWorld full QBank, Gumroad Anki decks, the CFA Institute Practice Pack ($299). None are needed for the current plan.

## Agent-Reach itself
Installed 2026-10-27 at user level via `uv` (program under `~/.agent-reach/`, skill linked for Claude Code). Channels kept: **github, web** (web's Exa backend was down at the time). Removed: youtube (project rule: no YouTube scraping), bilibili, v2ex. Not added: reddit and the login channels. Uninstall: `agent-reach uninstall --dry-run`, then `agent-reach uninstall`.

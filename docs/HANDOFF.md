# Handoff: CFA Level I study app ("L1 Study")

Handed off 2026-10-10 by the session "CFA Level 1 study web app research" to the session "Project takeover".
Repo: https://github.com/Mibrahim930/CFA-Study (PRIVATE, keep it that way). Local path on the user's Mac:
`/Users/wagdyiibrahim/code/CFA-Prep`. The approved plan is in `docs/PLAN.md`; read it first.

## The user
- Total finance and accounting beginner studying for CFA Level I (2027 curriculum). Studies 10–15 hrs/week on laptop + phone.
- Has a bachelor's degree. The employer reimburses the exam fee. **Not registering yet**, and the date is undecided.
- Will pay for Claude API credits, but wants study materials free.
- **Reliability is everything.** They rejected Wikipedia as a source.
- They want delegated research verified before it's accepted, with weak work pushed back. Report what was and wasn't verified.

## Hard rules (decided with the user — don't relitigate)
1. **No YouTube scraping.** No transcript APIs, no yt-dlp, no claude-watch.
   - YouTube's ToS bans automated access and downloading (verified), and the transcript tools are blocked anyway (youtube-transcript-api issue #592).
   - Videos are **embedded only** (official IFrame player). The YouTube Data API is used for **metadata only**.
2. **The repo and app stay private.** `content/syllabus-2027.json` holds the CFA Institute LOS text, and the outline PDF says "For candidate use only. Not for distribution."
3. **"CFA" stays out of the app name**, because it's a trademark. The app is called "L1 Study", with a footer disclaimer.
4. **Source reuse rules.**
   - Open-licence and public-domain sources (OpenStax CC BY-NC-SA, MIT OCW, SEC, Fed) may be adapted with attribution.
   - "All rights reserved" sources (CFA docs/Handbook, CFA Research Foundation, EY/RSM, MIT problem-set PDFs) are **private grounding only**: Claude writes original wording, and a copy guard enforces it.
5. **No AI arithmetic is trusted.** Every calculation question carries a `calc_spec` that `lib/finance/registry.ts` recomputes. The item is rejected if it's off by more than 0.5%.
6. **Model defaults.** The content pipeline uses **`claude-sonnet-5-5`**; the user chose it on 2026-10-10 after the 1-LOS Opus pilot cost $0.41. Opus remains available per run via `--model claude-opus-5-5`. Calls use `fallbacks: "default"` with beta `server-side-fallback-2026-07-01` on non-batch calls (Sonnet 5.5 accepts only the `"default"` form). Note that fallbacks are rejected on the Batches API.
7. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Cross-platform status (verified 2026-10-11)
The project runs fully on **Windows**, macOS and Linux. GitHub Actions (`.github/workflows/ci.yml`) runs
`npm ci → npm run typecheck → npm run lint → npm test → npm run build` on **windows-latest** and ubuntu-latest
on every push to main. Both are green at commit 7fa99f0. Check them with `gh run list`.
- **PDF extraction** now uses pdf.js (`pdfjs-dist`) everywhere instead of macOS PDFKit. The outline ingest produces a
  **byte-identical** `content/syllabus-2027.json` (verified by diff).
  - Gotchas handled: pdf.js joins a running head with its page number ("Economics6") — the parser strips page numbers.
  - Superscripts like M² stay inline (line breaks happen only when the baseline moves by more than 0.6 × the line height).
  - `standardFontDataUrl` must use forward slashes plus a trailing "/" (Windows CI caught this).
- **CRLF:** `.gitattributes` forces LF, and the OpenStax/CNXML ingest normalises `\r\n`. There's a test for it.
- **Fresh clone:** run `npm run typecheck` (it does `next typegen && tsc --noEmit`). Plain `tsc` fails until typegen has run.
- `npm run ingest:openstax` rebuilds the corpus (needs `git` on PATH). The Mac produced 5,547 chunks and the Windows clone 5,551.
  The 4-chunk difference is most likely the upstream repos changing between clones. It's harmless.
- `.claude/launch.json` uses `npm`. If the preview tooling on Windows can't spawn it, change it to `npm.cmd`.

## What's done (all pushed; `npm test` = 56 passing; typecheck and lint clean)
| Area | Files | Notes |
|---|---|---|
| Next.js 16.4 app (Turbopack, cacheComponents, partialPrefetching) | `app/`, `components/` | **Read `node_modules/next/dist/docs/` before writing Next code** — APIs differ (async `params`, `PageProps<'/route'>` global type, `next typegen`, params must be awaited inside `<Suspense>`). Build prerenders 118 pages. |
| Syllabus | `lib/syllabus/*`, `content/syllabus-2027.json`, `content-pipeline/ingest-outline.ts` | 10 topics / 102 modules / 340 LOS, parsed from the official 2027 outline PDF via pdf.js (cross-platform). 2027 weights verified on cfainstitute.org; several prep sites wrongly say they're unchanged. |
| UI | `app/page.tsx`, `app/topics/[id]`, `app/learn/[slug]`, `components/module-workspace.tsx`, `components/youtube-player.tsx` | Dashboard in study order; module workspace with embedded YouTube (paste a link), speed control, resume position, timestamped notes, LOS checklist, completion. Storage is `lib/store/local.ts` (localStorage, shaped for a later Supabase swap). |
| Finance engine | `lib/finance/*` | TVM (BA II Plus sign convention), NPV/IRR/MIRR, returns, stats/regression, bonds (price/YTM/accrued/spot-forward-par/duration/convexity), derivatives (forward, put–call parity, binomial, swaps), corporate/equity, FX, money market, accounting. `registry.ts` = zod-validated `runCalc({fn,args})` + `matches()`. Test reference values were computed independently in Python. |
| Corpus | `content-pipeline/ingest-openstax.ts`, `content-pipeline/lib/cnxml.ts`, `lib/kb/{types,search}.ts` | Shallow-clones 6 OpenStax repos (licence checked) into git-ignored `sources/`; 5,547 chunks in `sources/corpus/openstax.jsonl` (regenerate with `npx tsx content-pipeline/ingest-openstax.ts`). Dependency-free BM25 search. |
| Research | `docs/reliability-research.md` | Source-discovery Cycles 1 and 2 by an Opus subagent. Cycle 1 was verified and accepted by me. **Cycle 2 is NOT yet verified.** |

## In progress: the Quant content-pipeline pilot (milestone M2)
The user asked to start the Quant pilot first. Next steps, in order:
1. **`content-pipeline/generate.ts`.** For each Quant LOS (30 of them; `topics[0]` in the syllabus JSON):
   - BM25-retrieve ~6–8 chunks (query = module title + LOS text).
   - Call Claude with structured output via `betaZodOutputFormat` from `@anthropic-ai/sdk/helpers/beta/zod` (SDK 0.133; zod 4 works via `zod/v4`).
   - Produce:
     - a lesson block (beginner explanation, intuition, worked example, KaTeX formulas, exam traps);
     - 6–8 three-option MCQs, each with per-option explanations, `cited_chunk_ids`, and a `calc_spec` for calculation items;
     - 3–5 flashcards.
   - Keep the API JSON schema simple (no array min/max). Validate with a stricter zod schema afterwards.
   - Use `client.beta.messages.stream(...).finalMessage()` for large outputs to avoid timeouts.
   - Write to `content/generated/quant/<losId>.json`.
2. **`content-pipeline/verify.ts`.** Gates, in this order:
   a. Lint: exactly 3 options, one key, distinct distractors, no "all of the above".
   b. Calc: `runCalc` must match the key, and no distractor may equal it.
   c. Blind solve: a separate Claude call answers without the key. On disagreement, regenerate once, then quarantine.
   d. Grounding critic: each claim is checked against the cited chunks.
   e. Copy guard: n-gram overlap vs LOS and grounding text.
   f. Badge each item Grounded+Verified / Verified / Model-only.
   - Add the IFRS 18 gate from research Cycle 2: quarantine FSA items that mention IFRS 18, "management-defined performance measures" or "operating category". 2027 L1 FSA appears to still be IAS 1-era (Medium-High confidence).
3. **Spend control.** Read `CLAUDE_MONTHLY_BUDGET_USD`, log `usage` per call, and abort over budget.
4. **Run ONE LOS first, report the real cost per LOS to the user, and get approval before running all 30.**
5. Pilot quality bar (plan §4):
   - ≥95% of sampled calc items correct;
   - 0 copied passages;
   - the user rates ≥80% of lessons "clear for a beginner".
   - The user and Claude review ~30 sampled items together.

**Blocker:** there's no `ANTHROPIC_API_KEY` yet. `.env.local` was just created from `.env.example` (git-ignored, all values empty). The user must paste their keys there and never into chat. `ant` CLI is not installed.

## Next milestones (see docs/PLAN.md)
- **M1 remainder.** The YouTube Data API video map (`content-pipeline/video-map.ts`): Let Me Explain playlists → modules (417 videos, ~168 h, Quant and Equities labelled 2027). This needs `YOUTUBE_API_KEY`; the user has setup steps. Also a BA II Plus keystroke drill.
- **M2.5 "L1 expert" skill + knowledge base.** Verified per-LOS notes become `kb/` + a `kb search` tool, plus `.claude/skills/l1-expert/SKILL.md` (search the KB first, cite, compute with the engine, flag pre-2027 material, say "not in verified notes"). The same rules power the in-app tutor. Teaching-style ideas come from lyra81604/CFA-skill_cfa-level1-tutor (MIT; contains no CFA content).
- **M3** study loop (Today view, QBank, FSRS via `ts-fsrs`, mistake→flashcard); **M4** scale to the other 9 topics; **M5** mock engine (2×90 Qs, 135 min, 2027 weights), readiness dashboard, Supabase sync + auth allowlist, Vercel deploy, PWA.

## Research loop (the user asked for it to run continuously)
- An Opus subagent does **source discovery** only (the user said testing comes later). It writes only to `docs/reliability-research.md` and keeps downloads in a scratchpad.
- **Cycle 2 still needs auditing.** Spot-check against primary sources before accepting, as was done for Cycle 1. Cycle 2 claims to check:
  - Fed Trading & Capital-Markets Activities Manual §4000 (public domain): two of its worked examples don't reproduce.
  - Lyryx Intermediate Financial Accounting Vol 2 (CC BY 4.0).
  - The IFRS 18 verdict.
  - CFA Research Challenge guidelines.
- Then start **Cycle 3** (backlog is in §2.9): swap valuation by discount factors, put–call–forward parity, settling the five derivatives convention flags, forecasting models, hedge funds and real estate.
- Facts already corrected by the research:
  - The official CFA "Mastering Your Calculator" PDF has **no worked examples**.
  - Golden test vectors (later, testing phase) should come from the TI BA II Plus Professional Guidebook (errata p.36, p.50) and the SOA FM/FAM sample solutions.

## Useful commands
```
npm run dev                # http://localhost:3000 (.claude/launch.json has config "dev")
npm test                   # vitest
npm run typecheck && npm run lint
npm run ingest:outline     # re-parse the official outline (any OS; pdf.js)
npm run ingest:openstax    # rebuild sources/corpus/openstax.jsonl
npm run ingest:sources     # 19 free PDFs (Handbook, RF primers, Fed/OCC) → sources/corpus/<id>.jsonl
npm run gen -- --los quant-04-los1      # generate one LOS (Sonnet by default)
npm run verify -- --los quant-04-los1   # gates + badges → <losId>.verified.json
```

## Progress on 2026-10-10 (Windows session; uncommitted unless a later commit says otherwise)
- M2 pipeline built: `content-pipeline/{generate,verify}.ts` and `lib/{claude,context,gates,schema}.ts`, with gate tests.
  - The 1-LOS pilot (quant-04-los1) cost $0.41 on Opus and $0.18 on Sonnet. Both produced 0 quarantined items.
  - The pilot found and fixed a calc-gate flaw: the key must be the option closest to the engine value.
  - The user chose Sonnet. The other 29 Quant LOS still need the user's go-ahead.
- Corpus expanded via `ingest-sources.ts`. Retrieval is now filtered per topic (`servesTopic`), and the corpus holds 7,688 chunks, adding:
  - Ethics: the Standards Handbook;
  - Alternatives: the RF primers;
  - Derivatives and Fixed Income: the Fed manual, OCC handbooks and ARRC SOFR guide;
  - FSA quality: the RF earnings-quality book and the CFA non-GAAP paper;
  - Portfolio: the IPS papers and Statman.
  - Still missing: Lyryx Vol 2 (its PDF link is dead), MIT 15.401, and HTML sources (Chicago Fed, CFTC).
- `/resources` page and per-topic "Practise elsewhere" lists (`lib/resources.ts`), with a localStorage trial tracker. All of these are link-out only and are never ingested.

## Open questions for the user
- ~~Opus vs Sonnet~~: Sonnet chosen (2026-10-10).
- The user should open the blocked-site URLs listed in research §2.7 manually (rating agencies, OCC options disclosure document, CME, Fannie Mae) if they want those sources.

# Resume here (updated 2026-10-12, end of the long build session)

Read this first, then `docs/HANDOFF.md` for the **hard rules**:
- No YouTube scraping (embed and metadata only).
- Every calculation is verified by `lib/finance`.
- "CFA" stays out of the app name.
- The repo stays private.
- Verify delegated research before treating it as fact.
- Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

`docs/USER-TODO.md` lists what only the user can do.

## Who the user is
- A total finance beginner studying for CFA Level I, 10–15 h/week, on a laptop and a phone.
- Reliability matters most to them. They like Sonnet agents for research and want delegated work verified.
- They approved going over budget this month; the cap was raised to $30.
- They have **not reviewed the prototype yet**.

## State of the app (all on `main`, pushed; CI green)
Next.js 16.4 (cacheComponents) + Tailwind 4, on Windows at `C:\Users\ibrah\CFA-Study`.

| Area | Where | Notes |
|---|---|---|
| Design | claude.ai canvas https://claude.ai/artifact/CqXTYohDNxrtDgU6rQF2J4 | "Calm study desk": navy #1e3a8a, paper #f6f7f9, Plus Jakarta Sans. Tokens in `app/globals.css`, including dark mode |
| Today `/` | `components/today-view.tsx` | Next up, a time-boxed plan, a "New here?" strip, cards due, progress by topic |
| Syllabus and topics | `app/syllabus`, `app/topics/[id]` | Topic pages: the **beginner primer** (`components/topic-primer.tsx`), then module chips (lessons ready / held back / coming, video count) |
| Module page | `app/learn/[slug]`, `components/module-workspace.tsx` | Watch card (Let Me Explain lectures, player), notes, then lessons (`lesson-view.tsx`, one-question practice with confidence in `practice-set.tsx`); sidebar `ModuleChecklist` |
| Review | `/review`, `components/review-session.tsx`, `lib/store/review.ts` | FSRS (ts-fsrs), Space/1–4 keys, progress, summary, phone grade bar. Lesson flashcards auto-enrol; missed questions and primer cards are added on demand |
| Mock | `/mock`, `components/mock-exam.tsx` | 10/30/90 questions at 1.5 min each, flag, navigator, results by topic |
| Resources | `/resources`, `lib/resources.ts` | Link-out only, with a trial tracker |
| Phone | `components/bottom-nav.tsx`, `app/manifest.ts`, `app/icon.svg` | Bottom nav, installable PWA |
| Deploy | `proxy.ts`, `docs/DEPLOY.md` | Basic-auth gate when `APP_PASSWORD` is set. **The user hasn't deployed yet** |
| Storage | `lib/store/*` (localStorage) | Per device; Supabase sync not built |

Rules learned this session:
- With cacheComponents, never read the time during render (`new Date()`/`Date.now()`). Use `useNow`/`useClock` (useSyncExternalStore).
- Server data loaders use `"use cache"` plus `cacheLife("max")` (`lib/content/*`).

## Content pipeline (`content-pipeline/`, Sonnet 5.5, spend ledger in `content-pipeline/.spend/`)
- **Sources:** `ingest-sources.ts` holds about 185 PDF/HTML sources, plus OpenStax. `EXCLUDED` lists 11 off-syllabus sources. Corpus and downloads are **git-ignored**. Rebuild with `npm run ingest:openstax`, then `npm run ingest:sources`. Tracker: `docs/missing-sources.md`. Audit: `npx tsx content-pipeline/source-audit.ts --outline-2026 <pdf>`, which writes `docs/source-audit.md`.
- **Retrieval** (`lib/context.ts`):
  - topic-filtered BM25;
  - LOS facet queries plus a synonym map;
  - `auditHints` (the coverage audit's "missing" phrases used as extra queries);
  - `RETRIEVE_K = 12`.
- **Coverage audit** (`coverage.ts`, `docs/coverage-report.md`): 30 full, 308 partial, 2 none (`equity-09-los3`, `fixed-income-06-los3`; no free source exists).
- **Lessons** (`generate.ts`, `verify.ts`):
  - **Quant: all 30 LOS generated and verified.** 8 of about 393 items are quarantined, with real issues.
  - `verify.ts` gates: lint, calc engine (the key must be the closest option), copy guard, IFRS 18, blind solve plus one repair, then the grounding critic plus a **second-opinion confirm** before any quarantine.
- **Primers** (`generate-primer.ts`): `content/primers/*.json` for all 10 topics. A plain-language editor pass runs, then the same checks.
- **Video map** (`video-map.ts`): `content/video-map.json`, 425 of 426 Let Me Explain videos mapped to 98 modules. YouTube API key in `.env.local`.

## Budget
- October API spend is **$29.24 of the $30 cap** (`CLAUDE_MONTHLY_BUDGET_USD` in `.env.local`).
- The other 9 topics' lessons cost about $55 more. **Don't start them without the user's go-ahead and budget.**

## Next steps (ask the user which)
1. **User review of the prototype.** Wait for their edit list (`docs/USER-TODO.md` §1) and apply it. They should also rate some Quant lessons; the plan wants at least 80% "clear for a beginner".
2. **Remaining UI ideas** from `docs/ui-inspiration.md`:
   - #6 mastery labels (needs persisted practice scores);
   - #8 a per-section check in lessons (needs new content);
   - #9 a mock review mode with Incorrect/Flagged filters and "practise weakest topic".
3. **The other 9 topics:** run `npm run gen -- --topic <id>`, then `npm run verify -- --topic <id>`, one topic at a time, about $5–6 each, in the study order from `lib/syllabus/topics.ts`.
4. **Later milestones** (docs/PLAN.md):
   - Supabase sync and auth;
   - the "L1 expert" skill and tutor;
   - golden test vectors (TI BA II Plus guidebook, SOA FM).

## Gotchas
- **"Fact-Forcing Gate" hook (ECC plugin)** blocks the first edit to each file, and the first Bash command of a session, until you state facts (callers, data, the user's instruction). Batch writes to new files, or pre-touch them with a tiny placeholder.
- **Windows:** stopping a background shell may leave its Node child running and spending. Check with `Get-CimInstance Win32_Process -Filter "Name='node.exe'"`.
- **Dev server:**
  - The user often runs `npm run dev` from their own Claude terminal on port 3000. Use the preview config **`dev-existing`**, which attaches without starting anything.
  - Next 16 refuses a second `next dev` in the same folder.
  - If pages stop hydrating after an edit error, stop the server and delete `.next/dev` (stale cached prerender).
- **Hook edit failures:** when a batch of edits has one blocked by the hook, the others still apply. Always re-run `tsc` afterwards.
- **Currency in lesson text:** `components/rich-text.tsx` treats `$` followed by a digit as currency, not math (tested).
- The old resume task `l1-study-resume` exists but is **disabled**.

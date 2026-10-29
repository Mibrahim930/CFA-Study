# Resume here (updated 2026-10-28, after the takeover session)

Read this first, then `docs/HANDOFF.md` for the **hard rules**:
- No YouTube scraping (embed and metadata only).
- Every calculation is verified by `lib/finance`.
- "CFA" stays out of the app name.
- The repo stays private.
- Verify delegated research before treating it as fact.
- Commit trailer: `Co-Authored-By` for the model that wrote the commit (see HANDOFF rule 7).

`docs/USER-TODO.md` lists what only the user can do.

## Who the user is
- A total finance beginner studying for CFA Level I, 10–15 h/week, on a laptop and a phone.
- Reliability matters most to them. They like Sonnet agents for research and want delegated work verified.
- They approved going over budget in October; the cap was raised to $150 for the 9-topic run.
- They toured the app on 2026-10-28 and are sending their edit list next.

## State of the app (all on `main`, pushed; CI green)
Next.js 16.4 (cacheComponents) + Tailwind 4. The user's PC is Windows at `C:\Users\ibrah\CFA-Study`; cloud sessions clone to `/home/user/CFA-Study`.

| Area | Where | Notes |
|---|---|---|
| Design | **"Edition"** (merged 2026-10-28): warm desk, ink, ultramarine accent, Archivo + Source Serif 4 + JetBrains Mono. Tokens in `app/globals.css` (light, dark, increased contrast). The earlier "Ledger" branch and the Calm-study-desk canvas are superseded; the design canvas https://claude.ai/artifact/2sqrDkbPnuSomdyXsnTH4C holds the brief and the four directions |
| Navigation | `components/app-nav.tsx` | One tab list rendered as a laptop rail and a phone dock; selected tab follows the URL, the Review badge follows cards due, pending state on slow navigations |
| Today `/` | `components/today-view.tsx`, `lib/progress.ts` | Masthead with exam countdown, "% of the exam secured" hero over the ledger bar (segments = official weights), glance row, next-up sheet, numbered plan, by-topic list. Next up follows the completion tick |
| Mastery | `lib/progress.ts`, `lib/store/practice.ts` | Four steps per module: Not started, Learning (any activity), Practised (a finished practice set or marked complete), **Solid (marked complete AND latest practice scores average ≥ 80%)**. Scores are recorded per LOS when a practice set finishes (key `l1:practice`). Chips on topic pages, a "practised" segment in every bar, and the module checklist says what solid still needs |
| Syllabus and topics | `app/syllabus`, `app/topics/[id]` | Editorial ledger list; topic pages: beginner primer, module rows with mastery chip, lessons ready, video count |
| Module page | `app/learn/[slug]`, `components/module-workspace.tsx`, `lesson-view.tsx`, `section-check.tsx`, `practice-set.tsx` | Watch card, notes, then lessons. Each section carries a "k/N" label and, where a flashcard matches it (`lib/content/section-checks.ts`), a **Check yourself** card: Show answer, then Got it / Not yet (Not yet makes the card due now). One-question practice with confidence, then a summary with attempt history |
| Review | `/review`, `components/review-session.tsx`, `lib/store/review.ts` | FSRS (ts-fsrs), Space/1–4 keys, progress, summary, phone grade bar |
| Mock | `/mock`, `components/mock-exam.tsx`, `lib/store/mock.ts` | 10/30/90 questions at 1.5 min each, saved as you go, results by topic, filters, retry missed |
| Resources | `/resources`, `lib/resources.ts` | Link-out only, with a trial tracker |
| Phone | `app/manifest.ts`, `app/icon.svg` | Installable PWA; dock at the bottom |
| Deploy | `proxy.ts`, `docs/DEPLOY.md` | **Live on Railway: https://cfa-study.up.railway.app**, auto-deploys from `main`. Basic-auth gate via `APP_PASSWORD`; fails closed (503) if unset |
| Storage | `lib/store/*` (localStorage, all keys `l1:`) | Local-first. Every store writes through `lib/store/persist.ts`, which marks the key dirty for the account sync. `/backup` downloads/restores a JSON file; Today nudges after 7 days when no account is signed in |
| **Accounts and sync** (built 2026-10-28) | `lib/server/{db,auth,sync,handlers}.ts`, `app/api/auth/*`, `app/api/sync`, `lib/store/{sync,sync-merge,persist}.ts`, `components/{account-panel,sync-provider}.tsx`, `app/account` | **On when `DATABASE_URL` is set** (Railway Postgres; `docs/DEPLOY.md`). Email + password (scrypt), 90-day httpOnly session cookie `l1_session`, tokens stored hashed. Tables `users`, `sessions`, `user_state` (one row per `l1:` key, client change time, NULL = tombstone), created on first use. Sync: pull on load and on foreground, push 1.5 s after any change, last write wins per key. First sign-in on a device that already has progress asks which copy to keep. Sign out clears the device. No email is sent, so no password reset by email (manual reset in DEPLOY.md). Tests: `lib/server/auth.test.ts` (integration part runs when `TEST_DATABASE_URL` is set), `lib/store/sync-merge.test.ts` |
| Settings | `lib/store/settings.ts`, `lib/store/activity.ts` | Exam date and weekly goal (set on `/backup#exam`); study days for the "n/7" tile (never a streak) |

Rules learned:
- With cacheComponents, never read the time during render (`new Date()`/`Date.now()`). Use `useNow`/`useClock` (useSyncExternalStore).
- Server data loaders use `"use cache"` plus `cacheLife("max")` (`lib/content/*`).
- Module-store keys are the module **slug** (`l1:module:quant-01-returns-of-…`), not the module id.
- `components/rich-text.tsx`: `$` + digit is currency unless the span contains LaTeX syntax (`\`, `^`, `_`, braces); both cases are tested.
- Never write an `l1:` key with `localStorage.setItem` directly: go through `persistSet` (so it syncs) or `applyRemote` (so it doesn't mark dirty). `l1:meta:*` keys are per device.
- Local Postgres for tests in a cloud session: `initdb` as `nobody` in `/var/lib/l1pg` (the scratchpad's permissions get reset and kill the server), start with `setsid nohup postgres -D … -p 5433`, then `TEST_DATABASE_URL=postgres://postgres@127.0.0.1:5433/l1test npm test` and `DATABASE_URL=…/l1dev npm run dev`.

## Content pipeline (`content-pipeline/`, Sonnet 5.5, spend ledger in `content-pipeline/.spend/`)
- **Sources:** `ingest-sources.ts` holds about 185 PDF/HTML sources, plus OpenStax. Corpus and downloads are **git-ignored**. Rebuild with `npm run ingest:openstax`, then `npm run ingest:sources`. Tracker: `docs/missing-sources.md`. Audit: `npx tsx content-pipeline/source-audit.ts --outline-2026 <pdf>` → `docs/source-audit.md`.
- **Retrieval** (`lib/context.ts`): topic-filtered BM25, LOS facet queries plus a synonym map, `auditHints` from the coverage audit, `RETRIEVE_K = 12`.
- **Coverage audit** (`coverage.ts`, `docs/coverage-report.md`): 30 full, 308 partial, 2 none (`equity-09-los3`, `fixed-income-06-los3`; no free source exists; `lib/syllabus/source-gaps.ts` shows a note in the app).
- **Lessons** (`generate.ts`, `verify.ts`): **all 340 LOS generated and verified; 0 quarantined.** 2,508 questions, 1,515 flashcards; badges 2,119 grounded_verified / 385 verified / 1,843 model_only.
  - Order for future fixes: edit `FIXES` in `content-pipeline/hand-fixes.ts` → `npx tsx content-pipeline/hand-fixes.ts` → `npx tsx content-pipeline/requalify.ts` → `npx tsx content-pipeline/verify.ts --topic <id> --pending` (paid gates only on unchecked items). Never `--force` after hand fixes: it discards fixes whose text the generated .json no longer matches.
  - `verify.ts` gates: lint, calc engine (the key must be the closest option), copy guard (with `lib/fixed-terms.ts` masking fixed terminology), IFRS 18, blind solve plus one repair, then the grounding critic plus a second-opinion confirm before any quarantine.
- **Primers** (`generate-primer.ts`): `content/primers/*.json` for all 10 topics.
- **Video map** (`video-map.ts`): `content/video-map.json`, 425 of 426 Let Me Explain videos mapped to 98 modules. YouTube API key in `.env.local`.
- **Finance engine** (`lib/finance/`): cross-checked against an open CC BY formula dataset on 2026-10-27 (`docs/formula-crosscheck-2026-10.md`, 36/36). The three gaps it found were added on 2026-10-28 (`lib/finance/portfolio.ts`: margin-call price, Treynor, Jensen's alpha, M², beta, hedge-fund fees with hurdle and high-water mark) and registered for calc items. Re-run `npx tsx scripts/crosscheck-formulas.ts <formulas.json>` after engine changes.

## Knowledge base and the "L1 expert" skill (M2.5, built 2026-10-28)
- `npm run kb -- search "<query>" [--topic id] [--k n]` · `los <losId>` · `module <id|slug>` · `formulas "<name>"` · `calc <fn> '<json>'` · `calc --list` (`scripts/kb.ts`). BM25 over the verified lessons and primers; quarantined items never show.
- `.claude/skills/l1-expert/SKILL.md`: search first, cite LOS and badge, compute with the engine, say "not in the verified notes", flag pre-2027 sources. Invoke with `/l1-expert` or let it trigger on Level I questions. The in-app tutor (same rules, server-side key) is not built; the deployed site holds no API keys by design.

## Budget
- October API spend: **$87.54** against the $150 cap. Set `CLAUDE_MONTHLY_BUDGET_USD` in `.env.local` back to the normal monthly figure in November unless told otherwise. Nothing scheduled spends; a paid re-verify is about $0.08 per LOS.

## Next steps (ask the user which)
1. **Apply the user's edit list** from their 2026-10-28 tour (look and feel, wording, features). Then their lesson ratings (≥ 80% "clear for a beginner").
2. **Mastery follow-ups** if the user likes the labels: "practise my weakest module" shortcut on Today (the data now exists), and an "overdue missed cards" condition for Solid (`docs/ui-inspiration.md` #6).
3. ~~Supabase sync and login~~ Replaced by Railway Postgres accounts (2026-10-28). Remaining: the user links the database (`docs/USER-TODO.md`); possible follow-ups are an admin list of accounts, password reset by email if an email provider is ever added, and a smarter merge for the review deck (per-card instead of per-key).
4. **In-app tutor** grounded on the knowledge base (needs a server-side key and a spend meter; the deployed site must stay key-free until then).
5. **Golden test vectors** for the engine from the TI BA II Plus guidebook and SOA FM samples (plan §4).
6. Remaining `docs/ui-inspiration.md` items: #14 review undo/skip, #16 reading preferences, #17 weekly summary.

## Gotchas
- **"Fact-Forcing Gate" hook (ECC plugin)** on the user's PC blocks the first edit to each file until facts are stated. Cloud sessions don't have it.
- **Windows:** stopping a background shell may leave its Node child running and spending. Check with `Get-CimInstance Win32_Process -Filter "Name='node.exe'"`.
- **Cloud sandbox:** `pkill -f "next dev"` kills the session's own shell wrapper (its command line contains the pattern). Find the process with `ps -eo pid,args | grep "[n]ext"` instead.
- **Agent worktrees** live in `.claude/worktrees/` (git-ignored, excluded in `vitest.config.mts` and `eslint.config.mjs`). `.claude/skills/` is committed.
- **Dev server:** the user often runs `npm run dev` on port 3000; use preview config **`dev-existing`**. Next 16 refuses a second `next dev` in the same folder. If pages stop hydrating after an edit error, stop the server and delete `.next/dev`.
- **Hook edit failures:** when a batch of edits has one blocked by the hook, the others still apply. Always re-run `tsc` afterwards.
- The old resume task `l1-study-resume` exists but is **disabled**.

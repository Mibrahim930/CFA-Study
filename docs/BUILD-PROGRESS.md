# Prototype build: plan and progress

**Goal (user, 2026-10-12):** work through all the steps, design the product myself (a Claude Design canvas), and build a polished, professional prototype the user can review and request edits on. Do everything that doesn't need the user. Keep `docs/USER-TODO.md` updated with what they must do.

**Resume rules (for a fresh session):**
- Read this file, `docs/NEXT-SESSION.md` and `docs/HANDOFF.md` first.
- Continue at the first step that isn't ✅.
- Update this file after every step, then commit and push.
- Check usage with `mcp__ccd_session_mgmt__get_usage`. At about 95% of either limit, write the handoff note below and re-arm the `l1-study-resume` scheduled task for the reset time. If the weekly limit is the binding one, use the weekly reset.

**Lock:** `Active session: <none>`. While working, set this to `Active session: <ISO time>` and refresh it at every step. A resumed session that finds a lock less than 45 minutes old must exit without working.

## Steps
| # | Step | Status | Notes |
|---|---|---|---|
| 1 | Design canvas on claude.ai: style tile, Today, Lesson+practice, Phone (Today + flashcards), Mock exam | ✅ | https://claude.ai/artifact/CqXTYohDNxrtDgU6rQF2J4 (private). Look: navy #1E3A8A, paper #F6F7F9, Plus Jakarta Sans, badge colours green/blue/amber |
| 2 | Design tokens and base components in the app | ✅ | globals.css tokens (navy, paper, info, warn), Plus Jakarta Sans and JetBrains Mono, new header | |
| 3 | Lesson page polish, tested in the browser on desktop and phone | ✅ | Two-column layout with a sticky module outline; fixed currency $ being parsed as math (rich-text.test.ts) |
| 4 | Generate and verify all 30 Quant LOS (Sonnet, about $5) | ⏳ running in background (logs: $TEMP/quant-gen.log, quant-verify.log) | `npm run gen -- --topic quant`, then `npm run verify -- --topic quant` |
| 5 | Video map: Let Me Explain playlists mapped to modules | ✅ | content-pipeline/video-map.ts → content/video-map.json: 425 of 426 videos, 98 of 102 modules, about 170 h; shown as 'Lectures for this module' with the first loaded |
| 6 | Study loop: Today page, FSRS review, missed questions become cards | ✅ | / = Today (next up, plan, cards due, progress by topic); /review = FSRS flip-and-rate; opening a lesson enrols its flashcards; a wrong answer adds a 'missed' card (lib/store/review.ts). The syllabus moved to /syllabus |
| 7 | Mock exam basics | ✅ | /mock: 10/30/90-question timed sets at 1.5 min per question; flag; navigator; score by topic; answer review; missed questions join the deck |
| 8 | Phone layout, PWA and deploy prep | ✅ | app/manifest.ts plus app/icon.svg (installable); proxy.ts Basic-auth gate when APP_PASSWORD is set; docs/DEPLOY.md lists the user's Vercel steps. Phone layout checked on the lesson page |
| 9 | Accessibility and quality pass | ✅ | Typecheck, lint, 88 tests and the production build (124 pages) pass. Skip link, labelled navs, aria on the flag and navigator, focus rings, tokens at 4.5:1 or better. Screens checked in the browser on desktop and phone |
| 10 | Prototype hand-off | ✅ | USER-TODO.md rewritten as a review tour plus account and budget steps |

## Progress log
- 2026-10-12: Plan written. Usage at start: 5-hour 36%, weekly 66% (weekly resets 2026-10-15 04:59 UTC).
- 2026-10-12: Steps 1–3 and 5–10 done in one session. The 5-hour window ended around 72%.

## Handoff note (2026-10-12, end of the build session)
The prototype is complete apart from step 4. The next session should:
1. **Check the Quant pipeline.** It was started from the build session as a background shell job; the logs are `%TEMP%\quant-gen.log` and `%TEMP%\quant-verify.log`. Check whether it's still running with `Get-CimInstance Win32_Process -Filter "Name='node.exe'"`. If it died, rerun `npm run gen -- --topic quant`, then `npm run verify -- --topic quant`; both skip work that's already done. The budget guard stops at the $25 cap, so 1–3 LOS may be left for next month.
2. **Commit `content/generated/quant/*`**, then rebuild and spot-check 2–3 lessons in the browser. Watch for render issues (math, currency, long tables).
3. **Then wait for the user's review edits** (USER-TODO.md section 1). Do not start other topics without the user's go-ahead and budget.

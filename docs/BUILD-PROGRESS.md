# Prototype build: plan and progress

**Goal (user, 2026-10-12):** work through all the steps, design the product myself (a Claude Design canvas), and build a polished, professional prototype the user can review and request edits on. Do everything that doesn't need the user. Keep `docs/USER-TODO.md` updated with what they must do.

**Resume rules (for a fresh session):**
- Read this file, `docs/NEXT-SESSION.md` and `docs/HANDOFF.md` first.
- Continue at the first step that isn't ✅.
- Update this file after every step, then commit and push.
- Check usage with `mcp__ccd_session_mgmt__get_usage`. At about 95% of either limit, write the handoff note below and re-arm the `l1-study-resume` scheduled task for the reset time. If the weekly limit is the binding one, use the weekly reset.

**Lock:** `Active session: 2026-10-12T06:21Z`. While working, set this to `Active session: <ISO time>` and refresh it at every step. A resumed session that finds a lock less than 45 minutes old must exit without working.

## Steps
| # | Step | Status | Notes |
|---|---|---|---|
| 1 | Design canvas on claude.ai: style tile, Today, Lesson+practice, Phone (Today + flashcards), Mock exam | ✅ | https://claude.ai/artifact/CqXTYohDNxrtDgU6rQF2J4 (private). Look: navy #1E3A8A, paper #F6F7F9, Plus Jakarta Sans, badge colours green/blue/amber |
| 2 | Design tokens and base components in the app | ✅ | globals.css tokens (navy, paper, info, warn), Plus Jakarta Sans and JetBrains Mono, new header | |
| 3 | Lesson page polish, tested in the browser on desktop and phone | ✅ | Two-column layout with a sticky module outline; fixed currency $ being parsed as math (rich-text.test.ts) |
| 4 | Generate and verify all 30 Quant LOS (Sonnet, about $5) | ⏳ running in background (logs: $TEMP/quant-gen.log, quant-verify.log) | `npm run gen -- --topic quant`, then `npm run verify -- --topic quant` |
| 5 | Video map: Let Me Explain playlists mapped to modules | ✅ | content-pipeline/video-map.ts → content/video-map.json: 425 of 426 videos, 98 of 102 modules, about 170 h; shown as 'Lectures for this module' with the first loaded |
| 6 | Study loop: Today page, FSRS flashcards (ts-fsrs), missed questions become review cards, progress stats | ☐ | |
| 7 | Mock exam basics: timed question sets from verified items, scoring by topic | ☐ | Quant only until more topics are generated |
| 8 | Phone layout pass, PWA manifest, and deploy prep (Vercel config, auth allowlist plan); the user creates the accounts | ☐ | |
| 9 | Accessibility and quality pass (a11y review, typecheck, lint, tests, build) and a screenshot tour | ☐ | |
| 10 | Prototype hand-off: summary for the user and an updated USER-TODO | ☐ | |

## Progress log
- 2026-10-12: Plan written. Usage at start: 5-hour 36%, weekly 66% (weekly resets 2026-10-15 04:59 UTC).

## Handoff note (written when usage is near the limit)
_(empty)_

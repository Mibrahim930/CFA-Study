# Things only you can do

Claude keeps this list updated. Tick items off as you go.

## 1. Review the prototype (the main thing)
- [ ] **Open the design canvas** (private to you): https://claude.ai/artifact/CqXTYohDNxrtDgU6rQF2J4. It has five screens: the style tile, Today, Lesson + practice, Phone (Today + flashcards), and Mock exam. You can comment directly on it.
- [ ] **Try the app on this PC:** in a terminal in `C:\Users\ibrah\CFA-Study`, run `npm run dev`, then open http://localhost:3000. Tour:
  1. **Today** (`/`): next lesson, today's plan, cards due, progress by topic.
  2. **Syllabus → Quantitative Methods → any module:** the lesson, its practice questions (each wrong answer becomes a review card), flashcards, the Let Me Explain lecture list with an embedded player, notes and the LOS checklist.
  3. **Review** (`/review`): flip a card and rate it Again / Hard / Good / Easy (spaced repetition).
  4. **Mock exam** (`/mock`): a timed set, then the score by topic and an answer review.
  5. **Free resources** (`/resources`): FreeFellow, IFT, the CFA Institute Ethics Lab and others, plus trial trackers.
- [ ] **Write down the edits you want** (look and feel, wording, features), and tell Claude.
- [ ] **Rate a sample of the lessons**: are they clear for a beginner? The plan's quality bar is at least 80% "clear". All 10 topics are generated now, so a weak sample means a prompt fix and a regeneration of that topic.
- [ ] **Check the new mastery labels** (2026-10-28): a module is *Solid* only when it is marked complete and your latest practice scores for it average 80% or more. Tell Claude if the 80% bar feels wrong.

## 2. Hosting (Claude can't click in your Railway account)
- [x] Deployed privately on Railway (2026-10-13).
- [ ] **Turn on accounts:** add a PostgreSQL database to the Railway project and reference its `DATABASE_URL` from the app service (`docs/DEPLOY.md`, "Accounts" section, about two clicks). Then create your account on `/account` and sign in on the phone with the same email.

## 3. Budget
- [ ] Claude API budget: October closed at about $87.54 against the $150 cap you set for the 9-topic run (`CLAUDE_MONTHLY_BUDGET_USD` in `.env.local`). All 10 topics are generated and verified. Set the cap for November (nothing is scheduled to spend; a paid re-verify costs about $0.08 per LOS).

## Saves Claude usage (optional)
- [ ] A "Fact-Forcing Gate" hook (from the ECC plugin) blocks Claude's first edit to every file until it restates facts, which wastes a noticeable share of your usage. To relax it for this project, start Claude with `ECC_GATEGUARD=off`, or add `pre:edit-write:gateguard-fact-force` to `ECC_DISABLED_HOOKS`. It's your setting, so Claude won't change it.

## Keep in mind
- [ ] Leave the Claude desktop app **open** if you want an interrupted build to resume by itself. Scheduled runs only fire while the app is running, or on its next launch.
- [ ] Progress is saved per device until the sync milestone. Use one device for flashcard reviews for now.

## Optional
- [ ] Save the CFTC "Basics of Futures Trading" page as HTML (see `docs/missing-sources.md`).
- [ ] OpenIntro statistics PDF via Leanpub.

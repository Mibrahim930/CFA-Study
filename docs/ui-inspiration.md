# UI and UX inspiration for L1 Study

Research date: 2026-10-12. Inspiration only: patterns and principles, no copied layouts, assets or branding. No logins, no downloads.

Evidence note: web search gave strong sources for Duolingo (streak research), Anki (shortcuts), UWorld (modes and analytics), Khan Academy (mastery levels), Linear (calm UI) and learning science (confidence). Brilliant, Kinnu and Readwise Reader had thin primary documentation, so claims about them are marked secondary. I did not manage to verify details for Quizlet, RemNote, Coursera or Notion. Nothing is claimed about them.

## Pattern summary by area

### 1. Daily dashboard and "what to do next"
- Today's Next-up card plus a numbered plan is already the right shape. Duolingo's retention team found that lowering the barrier to a daily action beats raising the size of the daily target ([Duolingo blog: improving the streak](https://blog.duolingo.com/improving-the-streak)). A secondary summary reports a "commit to my goal" call to action working better than "continue" ([summary](https://videohighlight.com/v/_CCwoQZH5hI)).
- A secondary write-up says asking the user to pick a goal creates commitment even when the value is not used afterwards ([Lazyweb](https://lazyweb.com/research/duolingo-streak-goals-retention)). This is a hypothesis, not established fact.
- Kinnu's exam edition shows a single "readiness" number and "weak topics" up front (secondary: [App Store listing](https://apps.apple.com/app/id6744058329)).
- Principle: one dominant action, time-boxed ("about 25 min"), and a visible finish line for the day.

### 2. Progress and motivation
- Khan Academy uses five named mastery levels (Not started, Attempted, Familiar, Proficient, Mastered), with Mastered only unlocked by a later mixed-skill check ([Khan help](https://support.khanacademy.org/hc/bg/articles/5548760867853)). This is calm, honest progress with no points needed.
- Duolingo evidence says streaks help most when they are easy to extend, and streak freezes soften the cost of a missed day (same Duolingo sources above).
- Principle for an adult beginner: mastery labels and a weekly-hours goal, not XP, leagues or mascots. A gentle streak is fine if it forgives (weekly rather than strict daily).

### 3. Lesson reading experience
- Reading apps converge on 45 to 75 characters per line ([line-length literature review](https://journals.uc.edu/index.php/vl/article/view/5765)), generous margins and user-adjustable size and theme (secondary: [Reader design breakdown](https://blakecrosley.com/de/guides/design/readwise-reader)).
- Brilliant's stated philosophy is active problem-solving in small steps with room to make mistakes ([Brilliant design VP essay](https://uxdesign.cc/the-key-to-learning-math-and-science-online-is-interactive-play-6ea68ce167fe)). Kinnu uses short reading chunks, each followed by MCQs (secondary: [review](https://nibble-app.com/blog/kinnu-app-review)).
- Principle: chunk, then check. A small "check yourself" after each section, and a visible "section 3 of 7" position.

### 4. Practice questions and feedback
- UWorld offers tutor mode (explanation after each question) versus timed mode, and test creation by unused / incorrect / marked questions ([UWorld features](https://medical.uworld.com/usmle/features/)). It also shows what percent of peers chose each option.
- Confidence ratings help. Errors made with high confidence are corrected more reliably once feedback is shown (the hypercorrection effect: [classroom study](https://pubmed.ncbi.nlm.nih.gov/29781391/)). Calibration (confidence versus accuracy) can be trained ([overview](https://structural-learning.com/post/illusion-of-knowing-calibration)). Evidence is mostly lab-based, so keep the UI to one optional tap.

### 5. Flashcard review flow
- Anki: Space reveals, 1 to 4 grade (Again, Hard, Good, Easy), Space or Enter also means Good, S returns to the overview ([Anki manual](https://docs.ankiweb.net/manual/studying)). Interval previews sit on the buttons (already done in L1 Study).
- Principle: keyboard-first on laptop, thumb-sized grade buttons at the bottom on phone, a visible count remaining, and a short summary at the end.

### 6. Exam and QBank interface
- UWorld: Performance split into Overall, Reports by subject and topic, and Graphs over time; a Previous Tests list to resume or review; self-assessments with a score estimate ([UWorld features](https://medical.uworld.com/usmle/features/), [Case Western guide PDF](https://case.edu/medicine/sites/default/files/2025-01/Using%20Your%20UWorld%20QBank.pdf)).
- Principle: after any exam, show where marks were lost (topic, and time per question), then a one-click "practise my weakest topic".

### 7. Mobile ergonomics
- Bottom navigation with 3 to 5 equal destinations is the standard on compact screens ([Android Compose docs](https://developer.android.google.cn/develop/ui/compose/components/navigation-bar?hl=ca)). The thumb zone favours the bottom of the screen ([Smashing Magazine](https://smashingmagazine.com/2016/11/the-golden-rules-of-mobile-navigation-design), [UX Movement](https://uxmovement.com/?p=10349)). Touch targets should be at least 44 to 48 px.

### 8. Calm professional UI, empty states, onboarding
- Linear: the main task stays in focus while navigation recedes; softened borders; reduced icon use ([Linear: behind the design refresh](https://linear.app/now/behind-the-latest-design-refresh), [redesign post](https://linear.app/now/how-we-redesigned-the-linear-ui)).
- Onboarding: a one-time goal pick (exam date, hours per week) gives the Today screen something concrete to plan against. Empty states should say what to do next, not just "nothing here".

## Fit with the current app (what exists)
- `components/today-view.tsx`: Next-up card, three-row plan, cards due, progress by topic bars. Header text is a single static line.
- `components/review-session.tsx`: tap-to-reveal, 4 grades with interval previews, "N due · M done" text, no keyboard handling (no keydown handler found), plain "Done" empty state.
- `components/practice-set.tsx`: all MCQs listed in one long list, reveals explanations for the picked and correct option, "try again" link, no confidence step, no per-lesson summary.
- `app/layout.tsx`: single top nav that wraps (`flex-wrap`) on narrow screens; no bottom nav.
- Mock exam has timer, flag and navigator; the topic-score summary exists.

## Prioritised recommendations

Impact order. Size: **Quick win** (under 1 hour), **Medium**, **Larger**.

### Top 10 (impact order)

1. **Keyboard shortcuts in review session. Quick win.**
   Screen: Review. File: `components/review-session.tsx`. Add a keydown listener: Space or Enter reveals; 1 to 4 grade (Again, Hard, Good, Easy); show tiny `1` to `4` key hints on the buttons (desktop only, `hidden sm:inline`). Why: Anki-style speed, since 10 to 15 hours a week of reviews is mostly this screen. Ignore keys when focus is in an input.

2. **Session progress bar plus end-of-session summary in review. Quick win to Medium.**
   File: `components/review-session.tsx`. Add a thin bar under the header (`done / (done + due)`) using `bg-accent` on `bg-surface-2`. Replace the final "Done" card with a summary: cards reviewed, % rated Good or Easy, count sent back as Again, next due time, and two buttons (Back to Today, Study next lesson). Why: a visible finish line and closure without confetti. The state needed (`done`) exists; track grade counts in a small ref.

3. **Mobile bottom navigation. Medium.**
   Screen: all. File: `app/layout.tsx` (plus a new small client `components/bottom-nav.tsx`). Below `sm`, hide the wrapping top links and show a fixed bottom bar with 4 items: Today, Learn (syllabus), Review (with a due-count dot), Mock. Move Resources into a "More" or the top bar. Add `pb-[env(safe-area-inset-bottom)]` and body bottom padding. Why: thumb reach (sources above), and the top nav wraps to two rows on a phone. Token change: none; use `bg-surface` and `border-line`. Active item `text-accent` on `bg-accent-soft`.

4. **Sticky bottom grade bar on phone in review. Quick win.**
   File: `components/review-session.tsx`. On small screens, make the grade grid `fixed inset-x-0 bottom-[bottom-nav height]` (or `sticky bottom-0`) so the thumb never has to reach up. Keep the tap-to-reveal card large. Why: the four buttons currently sit under a `min-h-72` card, so they can fall below the fold on small phones.

5. **Practice: one question at a time with a confidence tap and a lesson summary. Medium.**
   File: `components/practice-set.tsx`. Show a single question with a progress label ("Question 2 of 6") and Next. Before revealing, an optional three-way "Sure / Think so / Guess" row (stored in state only at first). After the answer, show the explanation in a panel under the options (not inside the button), with a "Why this trap?" line for wrong picks. At the end, a summary: score, and "N confident errors" highlighted as the best things to review. Why: hypercorrection and calibration research; focus; avoids a 6-question wall for a beginner. Missed questions already enrol in review via `markMissed`, so say so in the summary: "2 added to your review cards".
   Also add a "Mark for later" flag (mirrors the mock exam flag) as a stretch.

6. **Mastery labels per module and topic instead of only percent. Medium.**
   Files: `components/today-view.tsx` (Progress by topic), `app/topics/[id]/page.tsx` status chips. Replace binary done with Not started, Learning, Practised, Solid (e.g. needs practice score at or above 80% and no overdue missed cards), reusing existing chips and the success/info/warn tokens. Why: Khan-style honest progress, and "100% done" is not mastery. Needs a small derived selector from `lib/store/review` and the practice results, which are not stored yet, so this depends on persisting per-LOS practice scores.

7. **Today header: goal and time-boxed plan. Medium.**
   File: `components/today-view.tsx`. Add estimated minutes to each PlanRow ("about 10 min") and a total in the header ("About 40 min today"). Optional one-time goal setter (hours per week, exam date) stored locally, with a "this week: 6 of 12 h" quiet line. Why: concrete, achievable daily commitment; matches the 10 to 15 hour a week user. Avoid streak flames. If a streak is wanted, make it a weekly "days studied this week: 4" dots row with no loss framing.

8. **Lesson reader: reading measure, section progress and checkpoints. Medium.**
   Files: `components/lesson-view.tsx`, `components/module-workspace.tsx`. Cap prose at `max-w-[68ch]`, body `text-[17px] leading-7` on mobile and desktop; a slim sticky progress line at the top (`h-0.5 bg-accent`) driven by scroll; a "Section 3 of 7" label; after each section a one-question "Check yourself" using an existing MCQ (or flashcard) rather than a wall at the end. Why: chunk-then-check is the common pattern for beginners and breaks up long scrolls. Keep KaTeX formulas in `surface-2` callouts with a label ("Formula") so a beginner can find them again.

9. **Mock exam results: weak-topic drill and time-per-question. Medium.**
   File: `components/mock-exam.tsx` (results view). Add a review mode where each question can be opened with the answer and explanation (tutor-mode on review), filters (All, Incorrect, Flagged), per-topic bars sorted weakest first, and a "Practise weakest topic" button linking to that topic. Show average seconds per question versus the target (about 1.5 minutes per question for L1 is a commonly stated pace; confirm against current CFA Institute guidance before showing it). Why: UWorld's Performance views and previous-tests review convert a mock into a study plan.

10. **Empty and first-run states for a beginner. Quick win.**
    Files: `components/today-view.tsx`, `app/topics/[id]/page.tsx`, `components/review-session.tsx`. Today with zero progress: replace "0 of N modules done" with a three-step "Start here" strip (1 Read the topic primer, 2 Watch and read your first lesson, 3 Answer practice, then cards appear). Review empty state: add a "Study a lesson to create cards" button to the first unfinished module, not only "Back to Today". Why: a total beginner should never face a blank screen; every empty state needs one next action.

### Further items

11. **Quieter chrome, Linear-style. Quick win.** `app/layout.tsx`, `app/globals.css`. Make the nav `text-sm` with the active route highlighted (`aria-current`), lighten borders (`--line` is fine), and dim inactive links. No new tokens. Why: the content stays in focus. (Need `usePathname`, so a small client component.)
12. **Badge wording for beginners. Quick win.** `components/practice-set.tsx` (`BADGE_TEXT`). "AI-only" and "Grounded + verified" are jargon; add a one-line tooltip or footnote ("Checked against the CFA curriculum text"). Keep the colour coding. Risk: if shown on every question it becomes noise, so use an info icon only.
13. **Practice option styling. Quick win.** `components/practice-set.tsx`. Increase option padding to `py-3` (48 px target), add a letter chip, and show correct and wrong with an icon plus colour (not colour alone) for accessibility.
14. **Review: Undo and Skip/Suspend. Medium.** `components/review-session.tsx`. Undo the last grade (Anki has this) and "bury for today" for a confusing card. Needs the store to support reversing `rate`.
15. **Review: show the lesson link inline after a reveal. Quick win.** Already has a link top right; make it "Open lesson" visible on the revealed face. Why: lets a beginner re-read when a card fails.
16. **Reading-preferences menu. Larger.** Font size and a sepia or dark toggle for the lesson reader (Reader-style). Low priority since dark mode already follows the system.
17. **Weekly summary card. Larger.** Weekly cards reviewed, accuracy trend by topic (UWorld Graphs idea) on Today or a new Progress page. Needs persisted history.
18. **Onboarding goal setup. Larger.** Exam date and weekly hours drive the plan and pace messages ("On track for Feb 2027 sitting"). Depends on the curriculum-year decision in memory (2026 sources OK until registered).

## What would hurt a beginner or feel childish (avoid)
- XP, leagues, leaderboards, mascots, confetti, sound effects and loss-framed streak messages ("Don't lose your streak!"). Duolingo's own team moved away from competitive pressure towards intrinsic enjoyment (anecdotal, [reader account](https://mkyu.substack.com/p/my-journey-to-a-365-day-duolingo)).
- Strict daily streaks that punish a missed day for an adult with a job; prefer weekly goals or a forgiving freeze.
- Showing peer percentile or a predicted score too early (UWorld-style) can demoralise a beginner with little data; hold it back until enough questions are answered and label it as an estimate.
- Showing everything at once: long practice lists, 4 grade buttons before the user has revealed, or dense formula walls. Reveal progressively.
- Hiding the answer-grade intervals or other honest information. Keep the "Again / Hard / Good / Easy" labels as is; they are already clear.
- Over-using the amber "AI-only" badge colour: it reads as a warning and may erode trust in content that is fine. Keep it, but explain it once.
- Colour-only correctness signals. Always pair with an icon or text.

## Token notes
No new tokens are needed. If a "mastery" colour scale is added (item 6), reuse `--warn` (learning), `--info` (practised), `--success` (solid), `--muted` (not started). Keep dark-mode parity by only using the existing variables.

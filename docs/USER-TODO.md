# Things only you can do

Claude keeps this list updated while building. Tick items off as you go.

## Before or while reviewing the prototype
- [ ] **Review the prototype** and list the edits you want. Claude will leave a short tour in `docs/BUILD-PROGRESS.md` when it's ready.
- [ ] **Rate a sample of Quant lessons**: are they clear for a beginner? The plan's quality bar is that at least 80% are clear. This decides whether we generate the other 9 topics.

## Accounts (Claude can't create accounts)
- [ ] _(added when deploy prep reaches this point)_

## Saves Claude usage (optional)
- [ ] A "Fact-Forcing Gate" hook (from the ECC plugin) blocks Claude's first edit to every file until it restates facts. That wastes a noticeable share of usage. To relax it for this project, start Claude with `ECC_GATEGUARD=off`, or add `pre:edit-write:gateguard-fact-force` to `ECC_DISABLED_HOOKS`. It's your setting, so Claude won't change it.

## Optional
- [ ] Save the CFTC "Basics of Futures Trading" page as HTML (see `docs/missing-sources.md`).
- [ ] OpenIntro statistics PDF via Leanpub (optional).
- [ ] Raise `CLAUDE_MONTHLY_BUDGET_USD` in `.env.local`, or wait for next month, before generating the other 9 topics (about $55 total).

## Keep in mind
- [ ] Leave the Claude desktop app **open** if you want the build to resume by itself after a usage limit. Scheduled runs only fire while the app is running, or on its next launch.

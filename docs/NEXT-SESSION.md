# Resume plan (written 2026-10-11)

Start here when picking this project back up. Also read `docs/HANDOFF.md` ("Hard rules" and "Progress on 2026-10-10").

## Where we stopped
- **Commits on main:** `370b6e6` (pipeline, sources, Resources page) and `761fd20` (coverage audit, retrieval, 45 more sources), plus the commit that adds this file.
  - **Not pushed yet.** Push before working on the Mac: `git push`. CI must stay green.
- **Pipeline works end to end on Sonnet 5.5:** `npm run gen` and `npm run verify`, at $0.18 per LOS.
  - Only `quant-04-los1` has been generated (`content/generated/quant/`). An Opus copy is kept for comparison.
- **The library has about 10,080 passages** across 64 source files in `sources/corpus/`. That folder is git-ignored; rebuild it with:
  - `npm run ingest:openstax`
  - `npm run ingest:sources`
- **Coverage audit of all 340 LOS:** 9 full, 252 partial, 79 none ($4.66).
  - Report: `docs/coverage-report.md`. Raw data: `content/coverage/coverage.json`.
- **Spend this month:** about $7.42 of the $25 cap (ledger: `content-pipeline/.spend/`).

## Finished after the plan was written
- A Sonnet agent researching **buyable sources under $20, published 2025 or later**, that fill the coverage gaps.
  - Done: see `docs/purchase-candidates.md`. Finding: almost nothing under $20 is DRM-free, so purchases help personal study but cannot fill corpus gaps. Prices are partly unverified; spot-check before buying.
  - Its brief: rank by coverage per dollar, propose a minimal set covering every topic, and flag DRM. Only DRM-free files can be loaded into the pipeline.

## Next steps, in order
1. **Review `docs/purchase-candidates.md` with the user.**
   - Spot-check prices and editions before the user buys. Verify delegated research before reporting it as fact.
   - The user buys; Claude never purchases.
   - DRM-free files go in `sources/docs/<id>/` and get an `ingest-sources.ts` entry with `reuse: "ground"`.
2. **Close the 79 "none" gaps.**
   - Run a research agent on the specific missing items listed per LOS in the coverage report, plus any purchases.
   - Then re-audit only the gaps: `npm run coverage -- --los <ids> --force` (about $0.014 per LOS).
3. **User review of the pilot lesson** (`quant-04-los1`).
   - Plan §4 requires the user to rate at least 80% of lessons "clear for a beginner".
   - Offer to render it as a readable page in the app.
4. **Generate the other 29 Quant LOS** (about $5): `npm run gen -- --topic quant`, then `npm run verify -- --topic quant`.
   - Review about 30 sampled items with the user before scaling to other topics.
5. **User-only items** (see `docs/missing-sources.md`):
   - save the CFTC futures page as HTML;
   - OpenIntro PDF via Leanpub (optional);
   - OECD and SEC pages are blocked to automated fetches;
   - not attempted: MIT 15.433, World Bank PPP guide.
6. **Later milestones** (docs/PLAN.md):
   - YouTube video map (the YouTube key is already in `.env.local`);
   - M2.5 "L1 expert" skill and knowledge base;
   - M3 study loop (FSRS);
   - M5 mock engine and deploy.

## Decisions already made (don't relitigate)
- **Curriculum year.** 2026-curriculum material is fine until the user registers; then reconcile against the official 2027 resources.
  - 7 of 10 topics are identical between 2026 and 2027 (verified). Quant and Equity were rewritten.
- **Sonnet 5.5** for the pipeline. Opus is available per run with `--model claude-opus-5-5`.
- **Free outside resources** (FreeFellow, IFT, Ethics Learning Lab…) are link-out only, on the `/resources` page. Never ingest them.

## Gotchas found this session
- **Background processes on Windows.** Stopping a background shell task did NOT kill the Node child, which kept spending. Check with `Get-CimInstance Win32_Process -Filter "Name='node.exe'"` and stop it by PID.
- **The calc gate's key must be the closest option** to the engine value. The pilot found a wrong key that would have passed at ±0.5%.
- **The trial tracker uses local dates.** UTC made trial end dates a day late.
- **The "Fact-Forcing Gate" hook** blocks the first write to each file until facts are stated. This is expected; state them and retry.

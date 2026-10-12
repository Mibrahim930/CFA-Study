# Missing sources tracker

Sources we identified but could not load into the corpus yet. Statuses: **todo** · **in progress** · **loaded** (in `content-pipeline/ingest-sources.ts`) · **link-only** (usable on its site, not ingestible) · **blocked** (needs the user, e.g. a site that refuses automated access) · **dropped** (with reason).

Rules (from docs/HANDOFF.md):
- Verify each licence on the source's own page.
- Never bypass 403s, logins or CAPTCHAs.
- Never scrape or transcribe YouTube.
- All-rights-reserved sources are private grounding only (`reuse: "ground"`).

S-numbers refer to docs/reliability-research.md.

## Corpus gaps (wanted for grounding)
| Source | Topics | Problem | Status | Notes |
|---|---|---|---|---|
| Lyryx *Intermediate Financial Accounting* Vol 2, 2021-A (S35) | FSA: taxes, leases, EPS, cash flows | The OTL link was dead, and lyryx.com no longer resolves in DNS | **loaded** (`lyryx-ifa-vol2`, 566 chunks, 594 pp.) | Source: the identical 2021A PDF in eCampusOntario's open library (`openlibrary-repo.ecampusontario.ca/jspui/handle/123456789/892`; record rights field "CC BY"). Licence on the book's own copyright page (p. 5): "Creative Commons License (CC BY): This text, including the art and illustrations, are available under the Creative Commons license (CC BY), allowing anyone to reuse, revise, remix and redistribute", linking to creativecommons.org/licenses/by/4.0/. ADAPT. Text is clean. IFRS/ASPE, not US GAAP. |
| Lyryx *Introduction to Financial Accounting* (Dauderis/Annand) | FSA basics (IFRS) | The 2024 edition has no openly hosted PDF found | **loaded (2021A edition)** (`lyryx-intro-fa-2021a`, 662 chunks, 847 pp.) | eCampusOntario record 123456789/890 (rights "CC BY-NC-SA"). Copyright page: "available under the Creative Commons license (CC BY-NC-SA)", linking to creativecommons.org/licenses/by-nc-sa/3.0/ (so 3.0, not 4.0). ADAPT (NC is fine for a private app). The PDF maps "ti/tt/tf" ligatures to odd letters; `ingest-sources.ts` repairs them. Older than the 2024 edition. |
| MIT OCW 15.401 *Finance Theory I* (S51; CC BY-NC-SA) | Derivatives, Fixed Income, Portfolio, Corporate | none | **loaded** (24 PDFs `mit-ocw-15401-*`, 141 chunks total) | Lectures 1, 4, 7, 8, 10, 12, 13, 18, 21; recitations 1–8; course summary; midterm and final reviews; sample midterm and final with solutions. Taken from the course's own download page (file names carry content hashes; they are listed in `OCW_FILES`). Licence: the course page metadata gives creativecommons.org/licenses/by-nc-sa/4.0/; slides say "© 2007–2008 by Andrew W. Lo". ADAPT. **Problem_Sets.pdf deliberately NOT ingested** (GROUND). Slides have little text per page, so chunks are fragmentary (pdf.js doubles some title text). Multi-lecture decks cover lectures 2–3, 5–6, 9, 11, 14–17 and 19–20. |
| MIT OCW 15.433 *Investments* | Portfolio, Equity | Not attempted | todo | |
| Chicago Fed *Understanding Derivatives* (S19) | Derivatives | Published as chapter PDFs, so the PDF path was used (no HTML needed) | **loaded** (`chicagofed-derivatives-1` to `-4`: 12+13+14+18 = 57 chunks) | GROUND. Every page is footed "Federal Reserve Bank of Chicago, © 2013" (ch. 1) or "© 2014" (ch. 2–4). Source: chicagofed.org/publications/understanding-derivatives/index. |
| CFTC "Basics of Futures Trading" (S54) | Derivatives | cftc.gov returns **403** to the pipeline's automated fetch | **blocked** | The user can open https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/FuturesMarketBasics/index.htm in a browser and save it as sources/docs/cftc-futures-basics/page-1.html; then re-add the manifest entry (see the comment in `ingest-sources.ts`). Licence (cftc.gov/WebPolicy/index.htm): "Government information at the CFTC website is in the public domain." ADAPT. |
| Fed FEDS 2006-28, Treasury yield curve paper (S16) | Fixed Income (term structure) | | **loaded** (`fed-feds-2006-28`, 28 chunks, 42 pp.) | ADAPT. Federal Reserve Board disclaimer (federalreserve.gov/disclaimer.htm): "Unless otherwise indicated, information on Board's website is in the public domain and may be copied and distributed without permission." The data files are not ingested. |
| US Treasury yield-curve methodology (S17) | Fixed Income | HTML | **loaded** (`treasury-yield-curve-method`, 1 page, 2 chunks) | ADAPT. The Treasury site states no copyright or licence wording that I could find; public domain as a U.S. federal work (17 U.S.C. §105). Page revised 2/18/2025. Medium confidence on the licence. |
| FRBNY EPR, TBA trading (S11) | Fixed Income (MBS) | | **loaded** (`nyfed-tba-trading`, 39 chunks, 18 pp.) | GROUND ("© Federal Reserve Bank of New York"; the PDF carries no licence text). |
| OpenIntro *Introduction to Modern Statistics* 2e (S4) | Quant | The only free PDF is via Leanpub (account/email required); openintro.org offers the web version and GitHub source only | **link-only** | Not ingested. The user could download the PDF from https://leanpub.com/imstat (CC BY-SA 3.0 per openintro.org/license) into sources/docs/openintro-ims/ for a later ingest. |
| Suranovic *International Finance* (S36) | Economics (FX) | | **loaded** (`suranovic-intl-finance`, 468 chunks, 523 pp.) | ADAPT. PDF from https://2012books.lardbucket.org/pdfs/policy-and-theory-of-international-finance.pdf (the Saylor/Flat World archive, linked from the Open Textbook Library record). Front matter: "This book is licensed under a Creative Commons by-nc-sa 3.0 license". 2010 data is stale (use for concepts only). |
| CFA Institute private-credit reports (S26) | Alternatives | | **loaded** (`cfa-rf-private-credit-2026` 63 chunks; `cfa-rf-private-markets-growth` 24 chunks) | GROUND. "© 2026 CFA Institute. All rights reserved." |
| CFA Institute RF *Comprehensive Guide to ETFs* (S28) | Equity, Portfolio | | **loaded** (modules 1 and 2 as separate PDFs: `cfa-rf-etf-module1` 66 chunks; `cfa-rf-etf-module2` 69 chunks) | GROUND. "© 2025/2026 CFA Institute Research Foundation. All rights reserved." The 2015 first-edition book was not loaded. |
| World Bank *PPP Reference Guide 3.0* (S29) | Alternatives (infrastructure) | Licence unconfirmed | todo | |
| IMF–World Bank LIC DSF guidance note (S70) | Fixed Income (sovereign) | | **loaded** (`imf-wb-lic-dsf-2018`, 87 chunks, 71 pp.) | GROUND. The 2018 Guidance Note ("© 2018 International Monetary Fund"), from the World Bank-hosted PDF. The 2024 Supplement has no direct PDF URL found, so it is not loaded. |
| Richmond Fed *Instruments of the Money Market* ch. 14–16 (S52) | Derivatives | | **loaded** (`richmondfed-money-market-ch14`, `-ch15`, `-ch16`: 37+20+31 = 88 chunks) | GROUND. The chapter PDFs carry no licence text and a Reserve Bank is not a federal agency. Very dated (the chapters say they were last updated in 1993). |
| ECB explainers (S48) | Economics | HTML | **loaded** (`ecb-explainers`, 7 pages, 12 chunks) | ADAPT with attribution. ECB disclaimer: "users of this website may make free use of the information obtained directly from it", provided it is reproduced accurately and the ECB is cited as the source. Pages: monetary policy, inflation, interest rates, unconventional policy, deposit facility rate, MRO, minimum reserves. Some tables are flattened to one cell per line. |
| US EIA "Energy Explained" (S30) | Alternatives (commodities) | HTML | **loaded** (`eia-energy-explained`, 5 pages, 20 chunks) | ADAPT. eia.gov/about/copyrights_reuse.php: "U.S. government publications are in the public domain and are not subject to copyright protection." Pages: oil (+ prices), natural gas (+ price factors), coal. Some footer/promo text remains in a few chunks. |
| OECD *Corporate Governance Factbook 2025* (S31) | Equity, Corporate | oecd.org returns 403 to automated fetches | blocked | The user can open it in a browser |
| SEC non-GAAP C&DIs (S65) | FSA | sec.gov blocks automated fetches | blocked | The user can open it |

## Answer-checking references (test vectors, not lesson grounding)
| Source | Use | Status |
|---|---|---|
| TI BA II Plus Professional Guidebook (S8) | Golden test vectors (errata p.36, p.50) | todo |
| SOA Exam FM sample solutions (S7), FAM (S53) | Golden test vectors | todo |

## Pages we could not reach (for the user to open)
- prepnuggets.com/2027-cfa-level-i-updates/ (403)
- The CFA Institute prep-provider directory (loads dynamically)
- The 2024 and 2025 Level I topic outlines (404 on the live site)
- The 2024 Member Guide
- finquiz.com/terms/
- 300hours.com (403; also dropped because of its wrong claim about 2027 weights)
- The Kaplan Schweser free-trial page (DNS failure); dropped as late-stage only

## Gap-closing pass (2026-10-11)
Targets: the 79 LOS the coverage audit marked "none". A corpus grep first showed which gaps were real (no text at all for "cross rate", "capital allocation line", "key rate duration", "empirical duration", "bank discount", "historical simulation", "GICS", "stablecoin"). All sources below are ingested (`npm run ingest:sources -- --only <id>`), chunk counts as reported by the ingest, and each was spot-checked for readable text. Licences were read from the file or page itself unless marked "assumed".

| Theme | Source id (chunks) | Licence and reuse | Targets |
|---|---|---|---|
| Geopolitics | `fed-gpr-ifdp1222` (60), Fed Board IFDP 1222, 2018 | Fed Board public domain, ADAPT (policy page, not in the PDF) | econ-05-los1, 4, 5, 6 |
| Geopolitics / FX | `flatworld-international-business` (816), `flatworld-policy-and-theory-of-international-economics` (1021) | "licensed under a Creative Commons by-nc-sa 3.0", read in each book's front matter. ADAPT | econ-05-los1, 5, econ-08-los1 (cross rates, found in the first book), econ-02-los3, econ-03-los3 |
| Economic indicators | `fed-g17-capacity-notes` (3, HTML) | Fed Board public domain, ADAPT | econ-02-los3 |
| Capital allocation line, risk aversion | `mit-ocw-15433-portfolio1`, `-portfolio2`, `-portfolio3`, `-capm1` (5+4+5+6) | MIT OCW 15.433 (2003); course page says CC BY-NC-SA 4.0. ADAPT. "capital allocation line" confirmed in portfolio1 | quant-08-los3, portfolio-01-los2, los3 |
| Risk management, VaR, risk budgeting | `mit-ocw-15433-riskmanagement` (11), `occ-corporate-risk-governance` (160), `sharpe-pension-risk-budget` (24, HTML, GROUND), `flatworld-enterprise-and-individual-risk-management` (1192) | OCC public domain (ADAPT); Sharpe GROUND; Flat World CC BY-NC-SA 3.0 | quant-09-los1, portfolio-06-los2, los5, los7 |
| Digital assets | `nist-ir-8202` (78, ADAPT, "not subject to copyright in the United States" per our licence note, assumed from NIST policy, not seen in the PDF), `fsb-crypto-2022` (36, GROUND, FSB © free to read) | | alternatives-07-los2, 3, 4 |
| Financial data science / AI | `fsb-ai-ml-2017` (64, GROUND) | © FSB | quant-11-los1 |
| Asset management industry, pensions, portfolio approach | `ofr-asset-management` (46, public domain, ADAPT), `flatworld-individual-finance` (534), `flatworld-finance-for-managers` (197) | | portfolio-03-los1, 2, 4, 5, portfolio-04-los4 |
| Equity indexes, industry classification, peer groups | `msci-gics-methodology` (43, GROUND, "© 2023 MSCI Inc. All rights reserved"), `census-naics` (3, HTML, ADAPT), `damodaran-valn2ed-ch17`, `ch18`, `ch19`, `ch20` (21+46+32+36, GROUND, Wiley 2002, free on the author's site), `mit-ocw-15433-equity`, `-securityanalysis`, `-active-management` | | equity-03-los4, equity-07-los3, equity-09-los2, los3, equity-10-los2, equity-12-los2 |
| Forecasting, valuation models | `damodaran-valn2ed-ch11` (45), `ch12` (25) | GROUND | equity-08-los1, fsa-12-los5 |
| Real options, capital investments | `damodaran-valn2ed-ch28` (31, "The Option to Delay"), `ch5` (24, option pricing), `flatworld-finance-for-managers` | GROUND / CC BY-NC-SA 3.0 | corpfin-05-los1, 3, 4, derivatives-10-los2 |
| Business models, Porter's five forces | `flatworld-business-strategy` (115), `flatworld-introduction-to-business` (887) | CC BY-NC-SA 3.0, ADAPT | corpfin-07-los1, 2, fsa-12-los3 |
| Dividend chronology | `finra-dividend-dates-notice` (4, NASD Notice 00-54, 2000, GROUND) | © NASD/FINRA | equity-04-los1, 2 |
| Fixed-income yields, spreads, returns | `mit-ocw-15433-fixedincome1/2/3` (7+3+14), `mit-ocw-15433-creditrisk1` (4), `occ-investment-securities` (80; 1990 text, dated), `mpra-key-rate-duration` (14, GROUND, key rate duration), `treasurydirect-securities` (4, HTML, ADAPT), `finra-bonds` (20, HTML, GROUND), `flatworld-finance-banking-and-money` (429) | | fixed-income-07-los2, 08-los1, 08-los2, 10-los1, 10-los2, 13-los3, 14-los3, 06-los3 |
| Funding, covered bonds, securitization | `occ-liquidity` (119), `occ-interest-rate-risk` (96), `treasury-covered-bonds` (32, public domain, ADAPT), `imf-wb-debt-mgmt-2002` (457, GROUND, © IMF/World Bank; copy hosted by the Czech Ministry of Finance, since imf.org returns 403) | | fixed-income-04-los1, 05-los1, 18-los1, 17-los1 |
| Hedge funds, private structures | `mit-ocw-15433-hedge-funds` (5) | CC BY-NC-SA 4.0 | alternatives-01-los3, equity-01-los2 |
| Ethics | `cfa-code-ethics-page` (3, HTML, GROUND; thin, the Standards of Practice Handbook was already loaded) | | ethics-02-los2, ethics-08-los1 |

### Not filled, or only thin
- **Empirical vs analytical duration** (fixed-income-13-los4): only the key-rate paper was found; no open source for empirical duration regression. Discount margin (fixed-income-08-los1) and matrix pricing (fixed-income-06-los3) may still be thin.
- **Bayesian updating, parametric vs non-parametric tests** (quant-06-los4, quant-07-los3): MIT 18.05 reading URLs guessed from the 2022 course 404ed, so not loaded. OpenStax statistics is already in the corpus.
- **CMBS** (fixed-income-19-los4): no open Fed/OCC source found; the OCC asset securitization handbook is already loaded.
- **FSA recognition and measurement** (fsa-01-los1, 03-los3/4, 05-los1, 07-los3, 09-los3, 10-los2/3, 11-los5, 12-*): ifrs.org standards return a login page instead of the PDF, so IFRS Foundation text was not loaded. Only the Lyryx books and OpenStax cover this; `flatworld-business-strategy` helps fsa-12-los3.
- **Fiscal policy tools** (econ-03-los3): imf.org (F&D) and cbo.gov return 403; the Flat World economics book is the only new cover.

### Blocked (for the user to open manually, not bypassed)
- imf.org (all tried URLs: GFSR 2023 ch. 3, 2014 policy paper, F&D "Back to Basics: Fiscal Policy") return 403.
- cbo.gov/publication/57967 returns 403; dol.gov retirement-plan types returns 403; sec.gov/files/behavior.pdf (SEC behavioral pitfalls report) returns 403; spglobal.com index methodology PDF returns 403.
- crsreports.congress.gov: some products worked with curl but IF11730 returned 403 and IF12894 returned 403 to the pipeline's fetch, so none were loaded (sanctions, tariffs).
- bis.org PDFs (e.g. /publ/arpdf/ar2025e3.pdf) return an HTML page rather than a PDF to the pipeline; not loaded.
- ECB "Covered bonds in the EU financial system" (2008): the guessed URL 404ed.
- investor.gov glossary pages (ex-dividend date, hedge fund, stock split) are served, but under 600 characters of text, below the pipeline's 500-character page floor after boilerplate, so skipped.

### Verified vs assumed
Verified directly: HTTP status and content type before ingest; licence wording in the Flat World front matter; MSCI, MPRA and OCC document dates from the first chunk; the "capital allocation line", "cross rate", "bank discount", "historical simulation" strings appear in the new chunks. Assumed: public-domain status of the Fed, OCC, OFR, Treasury, NIST and Census items (US federal works); MIT OCW 15.433 licence as stated on the course page (I confirmed by-nc-sa/4.0 appears in the page, not on each PDF).

## Final gap pass (2026-10-11)
Targets: the last 41 LOS that the coverage audit still marked "none". Step 1 was a corpus grep (plus a probe of the real `retrieve()` ranking) for each `missing` item. Step 2 added sources only where the material was absent. All new sources were ingested with `npm run ingest:sources -- --only <id>` and a chunk was spot-checked for readable text. Licences were read from the file or page itself. Outcome counts: **30 new source** (some only partly cover the LOS, marked "partial"), **7 retrieval miss**, **4 still missing**. A new source can still rank badly: the ranks are noted for the search fix.

New sources (chunks): `fed-feds-2001-27-historical-simulation` (50; Fed Board, public domain, ADAPT), `gips-2020-firms` (161; "© 2019 CFA Institute. All rights reserved", GROUND), `russell-us-indexes-methodology` (54; © LSEG 2026, GROUND), `nasdaq-100-methodology` (14; © Nasdaq 2026, GROUND), `occ-risk-mgmt-derivatives` (181; OCC, public domain, ADAPT), `cfa-pm-process-ips` (43; "© 2006 CFA Institute"; the file carries a "Member use only" header but is served with no login at a public `refresher-readings-free` URL, GROUND; **the user may want to drop it**), `treasury-sanctions-review-2021` (10; ADAPT), `ecb-wp1415-capital-controls` (47; © ECB 2012, GROUND), `conference-board-lei-notes` (8; GROUND), `bea-business-cycle-indicators-2010` (11; ADAPT), `census-new-residential-construction-flyer` (3; ADAPT), `libretexts-nwtc-capital-budgeting` (5; CC BY-NC 4.0 from the page footer link, ADAPT), `libretexts-aurora-capital-budgeting` (9; CC BY 4.0, ADAPT), `flatworld-creating-services-and-products` (302), `flatworld-entrepreneurship-and-sustainability` (624), `flatworld-business-accounting` (958) (all three CC BY-NC-SA 3.0 from the front matter, ADAPT), `occ-earnings-handbook` (46; ADAPT), `cfr-17-240-12b-2` (19) and `cfr-17-240-10b-18` (9) (GPO/govinfo, ADAPT), `finra-splits-and-research` (27, HTML; © FINRA, GROUND), `treasurydirect-pricing` (14, HTML; ADAPT), `treasury-tfx-yield-appendix` (5; ADAPT), `ftse-fixed-income-indices-guide` (158; © LSEG 2026, GROUND), `nyfed-sr674-mortgage-spreads` (83; GROUND), `fed-cmbs-cohen-2011` (42; author copyright, GROUND), `fed-feds-note-ebp` (3, HTML; ADAPT), `mit-ocw-18s096-risk-neutral` (6) and `mit-ocw-18366-lec12` (4) (CC BY-NC-SA 4.0 on both course pages, ADAPT), `fsoc-digital-assets-2022` (159; ADAPT).

| LOS | Outcome | Source ids / chunk ids |
|---|---|---|
| quant-02-los1 | new source (partial) | `gips-2020-firms` (rank 12). The HPR, arithmetic and geometric mean and EAR text is already in OpenStax and is a retrieval miss: `os:principles-finance-2e:m00078:0`, `:m00078:3`, `:m00093:0.1`, `:m00093:0.2`. Leveraged return and continuous compounding are still thin |
| quant-03-los1 | new source | `gips-2020-firms` (time-weighted and money-weighted definitions; fills all 12 retrieved slots) |
| quant-03-los2 | new source (partial) | `russell-us-indexes-methodology`, `nasdaq-100-methodology` (float cap weighting, rebalancing, reconstitution). Price-weighted and equal-weighted construction is still thin |
| quant-06-los4 | retrieval miss | `os:principles-data-science:m00024:2`, `:m00024:2.4`, `:m00024:2.5`, `os:principles-data-science:m00041:2.1`, `:m00041:2.2` (Bayes' theorem with worked examples) |
| quant-09-los1 | new source | `fed-feds-2001-27-historical-simulation` (historical simulation, 124 mentions); `occ-risk-mgmt-derivatives` |
| econ-02-los3 | new source | `bea-business-cycle-indicators-2010`, `conference-board-lei-notes`, `census-new-residential-construction-flyer` (indicators ranked 20 to 30) |
| econ-03-los2 | retrieval miss | `os:principles-economics-3e:m63969:0.1`, `:m64114:0` (Ricardian equivalence), `:m64137:1`, `:m64137:1.1`, `:m63975:1` (crowding out), `flatworld-policy-and-theory-of-international-economics:790:708` |
| econ-05-los5 | new source | `treasury-sanctions-review-2021` (sanctions as a tool; rank 30). Export controls, cyber and military tools are thin |
| econ-07-los3 | new source | `ecb-wp1415-capital-controls` (9 of the top 12) |
| corpfin-05-los1 | new source | `libretexts-nwtc-capital-budgeting` (replacement, expansion, new product, regulatory; independent and mutually exclusive) |
| corpfin-05-los3 | new source (partial) | `libretexts-aurora-capital-budgeting` (capital rationing, real options). Pitfalls (empire building, anchoring, post-audit) are still not found |
| corpfin-07-los1 | new source | `flatworld-creating-services-and-products` (10 of the top 12), `flatworld-entrepreneurship-and-sustainability` |
| corpfin-07-los2 | new source | same two books. Subscription and freemium are thin. OpenStax *Entrepreneurship* was NOT used because its site says the book may not be ingested into LLM offerings |
| fsa-01-los1 | still missing | The six-step framework appears in no open source found. MIT OCW 15.535 class 1 and 2 PDFs are slides with almost no text (checked, not loaded). The CFA refresher reading pages are member-only and JavaScript-rendered |
| fsa-03-los4 | retrieval miss | `lyryx-ifa-vol2:106:102` ("Explain how long-term debt is disclosed"), `lyryx-ifa-vol2:61:55`, `lyryx-ifa-vol2:349:345`, `lyryx-intro-fa-2021a:677:556` |
| fsa-05-los1 | retrieval miss (partial) | Reported cash flow statements: `lyryx-intro-fa-2021a` and `lyryx-ifa-vol2` chapters already ranked, plus new `flatworld-business-accounting:1025:896`, `:1036:906`, `:1046:914`. Common-size cash flow statements are still absent |
| fsa-06-los3 | new source | `flatworld-business-accounting:470:409`, `:473:412`, `:474:413` (LIFO liquidation; rank 15) |
| fsa-11-los5 | new source (partial) | `occ-earnings-handbook` (NIM, efficiency ratio; rank 120). Retail, airline and hotel metrics (same-store sales, RASM, RevPAR) are still not found: BTS and FFIEC return 403 |
| equity-03-los3 | new source | `cfr-17-240-12b-2` (public float definition), `cfr-17-240-10b-18` (ADTV), `russell-us-indexes-methodology` (free float) |
| equity-03-los4 | new source | `russell-us-indexes-methodology`, `nasdaq-100-methodology` |
| equity-04-los1 | new source | `finra-splits-and-research:1:0` (rank 0), `cfr-17-240-10b-18` (repurchases). Liquidating and special dividends are thin |
| equity-04-los2 | retrieval miss | `finra-dividend-dates-notice:1:0`, `:1:1`, `:2:2`; `lyryx-intro-fa-2021a:426:348`, `:428:350`; `os:principles-financial-accounting:m67919:2`, `:m67919:3` |
| equity-08-los1 | retrieval miss (partial) | `flatworld-finance-for-managers:64:45`, `:68:46` (pro forma statements), `damodaran-valn2ed-ch11:10:8`, `:20:16`, `:21:18`. Top-down and bottom-up forecasting is thin |
| equity-09-los3 | still missing | Only `flatworld-business-strategy:16:13` and `mit-ocw-15433-securityanalysis:1:0` touch it. Census concentration-ratio tables exist but only as data (not loaded) |
| equity-11-los2 | new source (partial) | `finra-splits-and-research` (FINRA Rule 2241 and research analyst rules: sell-side conflicts). A buy-side comparison is not found |
| fixed-income-03-los2 | new source | `ftse-fixed-income-indices-guide` (rank 3) |
| fixed-income-06-los3 | still missing | Only one bullet, `occ-asset-securitization:56:53`. The MSRB PDF found does not use the term |
| fixed-income-07-los2 | new source (partial) | `nyfed-sr674-mortgage-spreads` (OAS; rank 2). G-spread, I-spread and Z-spread definitions are still not found in an open source |
| fixed-income-08-los1 | new source (partial) | `treasurydirect-pricing:2:6` (glossary definition of discount margin), `:1:2`. No worked discount-margin calculation |
| fixed-income-08-los2 | new source | `treasurydirect-pricing:2:7` (discount rate vs investment rate), `:1:0`, `treasury-tfx-yield-appendix:1:0`, `:4:3`; the existing `richmondfed-money-market-ch14:7:9` has the discount yield formula. Not in the top 150 retrieved, so ranking needs a fix |
| fixed-income-13-los4 | still missing | Searched for central-bank or regulator material on empirical duration: none found, only prep-provider pages |
| fixed-income-14-los3 | new source (partial) | `fed-feds-note-ebp` (excess bond premium, broker-dealer capital; rank 136), `nyfed-sr674-mortgage-spreads` |
| fixed-income-19-los4 | new source (partial) | `fed-cmbs-cohen-2011:3:3`, `:4:4`, `:14:16` (subordination, balloon, defeasance; rank 28), `cfa-rf-alt-credit:68:87` |
| derivatives-10-los2 | new source | `mit-ocw-18s096-risk-neutral:1:0`, `:8:1`, `:17:2`; `mit-ocw-18366-lec12` (ranks 35 to 37, so ranking needs a fix) |
| alternatives-07-los2 | new source | `fsoc-digital-assets-2022` (e.g. `:49:58`, rank 8) |
| alternatives-07-los3 | new source | `fsoc-digital-assets-2022:105:131` and the ETF and futures chunks `:8:8`, `:14:14`, `:19:21` (rank 11) |
| alternatives-07-los4 | new source | `fsoc-digital-assets-2022:25:29`, `:25:30` (correlation), `:1:0` (rank 4) |
| portfolio-01-los1 | retrieval miss | `os:principles-finance-2e:m00076:0`, `:m00076:0.1` (returns and risk by asset class), `cfa-rf-alt-primer:5:2`, `:9:7`, `:10:8` (real assets, hedge funds), `cfa-rf-etf-module1:12:9` |
| portfolio-03-los2 | still missing | `cfa-pm-process-ips` was dropped (headed "Member use only") |
| portfolio-03-los3 | new source (partial) | `cfa-pm-process-ips:21:32`, `:22:33` (endowment and individual investor cases), `cfa-rf-etf-module2:30:30` (existing) |
| portfolio-06-los7 | new source | `occ-risk-mgmt-derivatives` (5 of the top 12: VaR, stress tests, hedging) |

### Tried, not loaded
- `files.stlouisfed.org/.../9911cn.pdf` (Neely, "An Introduction to Capital Controls") returns an HTML shell instead of the PDF; replaced by the ECB paper above.
- CFA Institute refresher-reading pages (`/insights/professional-learning/refresher-readings/2026/...`) hold no body text without a member login; not used. The one `refresher-readings-free` PDF was loaded (see above).
- `pressbooks.pub/introductiontofinancialanalysis` and the LibreTexts print PDF of the Bigel text return 403 or empty; `ffiec.gov` UBPR guide 403; `bts.gov` glossary 403; `census.gov/construction/nrc/about_the_surveys/*` 404; Morningstar index calculation PDF is not a PDF.
- OpenStax *Entrepreneurship*: not used (the site forbids ingestion into LLM offerings).
- Chapters 1 to 13 of the Richmond Fed *Instruments of the Money Market* have almost no yield-formula text (checked, not loaded).

### Verified vs assumed (this pass)
Verified: HTTP status, content type and PDF magic bytes before ingest; text extraction counts of the key terms in each file (for example "historical simulation" 124 times in Pritsker, "risk neutral" 17 times in 18.S096 lecture 19); the licence strings quoted above, read from the PDF text or page footer; the real `retrieve()` ranks listed in the table. Assumed: public-domain status of Treasury, OCC, BEA, Census, GPO and FSOC items (U.S. federal works) and of the Fed Board paper (Board disclaimer); the CC licence on the two LibreTexts pages comes from the footer link, not from a licence file.

## Last-5 pass (2026-10-11)
Targets: the last 5 uncovered LOS. Corpus grep first, then web search for free, reputable sources (no prep providers, no Wikipedia). Each new source was ingested with `npm run ingest:sources -- --only <id>` and a chunk spot-checked.

| LOS | Outcome | Source ids / chunk ids |
|---|---|---|
| quant-03-los1 | new source | `smu-fma-ch4-rates-of-return` (18 chunks; SMU actuarial lecture slides: IRR, dollar-weighted and time-weighted return, geometric mean; no licence stated, GROUND), `commonfund-twr-vs-irr` (7; © Commonfund, GROUND; TWR vs IRR with a quarterly example), `ib-mwr-twr-white-paper` (3; Interactive Brokers, no licence, GROUND; Modified Dietz and geometric linking worked example). The IB paper uses Modified Dietz, not IRR, for money-weighted |
| fsa-01-los1 | still missing | The six steps appear only on prep-provider pages (AnalystPrep, IFT, PrepNuggets, JK Shah) and on member-only CFA refresher pages. No open textbook or university page found |
| equity-09-los3 | retrieval miss | `os:principles-economics-3e:m63887:3` (four-firm concentration ratio and HHI), `:m63887:4`, `:m63887:5`; `flatworld-finance-banking-and-money:232:204`, `:235:206`, `:237:208` (concentration ratio and Herfindahl index definitions and calculation) |
| fixed-income-06-los3 | still missing | No free non-prep source found that uses the term. FDIC exam manual 3.3, Fed Supervision Manual 3000.1, MSRB "How Are Municipal Bonds Priced", MSRB Rule G-30 and FINRA Rule 2121 pages contain no "matrix pricing" (checked by text search, not loaded). GAO-12-265 returns 403; PwC Viewpoint redirects without content; SEC XBRL notes are on blocked sec.gov. Only `occ-asset-securitization:56:53` mentions it |
| fixed-income-13-los4 | new source (partial) | `duffee-treasury-yields-spreads` (20 chunks; Journal of Finance 1998, author-hosted, GROUND): negative relation between Treasury yields and corporate spreads, stronger for lower-rated bonds. It supplies the mechanism behind lower empirical duration for high-yield bonds but does not define "empirical duration". The CME paper returned 403 and the Kansas City Fed RWP 98-08 URL was not retrievable; Wellington, Morningstar and Columbia Threadneedle pieces are practitioner marketing, not loaded |

Verified: HTTP status, content type and PDF magic bytes for the loaded files; term counts in the extracted text; chunk counts from ingest. Assumed: none of the four loaded files states a reuse licence, so all are GROUND.

## FI/FSA depth pass (2026-10-12)
Targets: the 96 LOS rated "partial" in Fixed Income (46) and FSA (50). Method: cluster the `missing` items from `content/coverage/coverage.json`, grep `sources/corpus/*.jsonl` for each cluster's terms, add a source only where the text is absent, ingest with `npm run ingest:sources -- --only <id>`, spot-check one chunk. 39 new sources, 2,826 chunks. Licences were read from the file or page where stated; "ground" means private grounding only. Existing entries were edited only by adding four Damodaran chapters (9, 10, 14, 15, tagged `fsa` and `equity`) to the existing Damodaran list; no existing topic tags were changed. `coverage`, `gen` and `verify` were not run.

New sources (chunks). OCC Comptroller's Handbook booklets, public domain, adapt: `occ-leveraged-lending` (67), `occ-asset-based-lending` (103), `occ-accts-rec-inventory-financing` (78), `occ-residential-real-estate-lending` (256), `occ-commercial-real-estate-lending` (196), `occ-mortgage-banking` (304), `occ-credit-card-lending` (237), `occ-installment-lending` (224), `occ-country-risk-management` (50), `occ-lease-financing` (103), `occ-internal-external-audits` (202). Other public domain, adapt: `fed-risk-retention-2010` (99), `treasury-iawg-2015` (48), `treasury-joint-staff-report-2014` (71), `cfr-31-356` (101), `usc-15-trust-indenture-act` (76), `cfr-17-229-202` (12), `cfr-17-229-303` (10), `cfr-17-229-10` (15), `cfr-17-210-2-02` (6), `uscourts-bankruptcy-basics` (34, HTML, licence assumed from 17 U.S.C. 105). Ground: `philfed-credit-card-abs` (15), `slcg-cmo-primer` (16), `frbsf-mbs-letter-1996` (7), `nyfed-sr740-repo-guide` (70), `richmondfed-money-market-ch6` (21), `nyfed-sr423-cpff` (34), `fsb-reducing-reliance-cra-2010` (11), `msrb-infrastructure-primer` (26), `ritchken-measures-of-price-sensitivity` (27), `sfu-poitras-duration-convexity` (8), `oxford-winkel-duration-immunisation` (15), `utah-fcs5510-bond-market` (12), `boe-anderson-sleath-yield-curves` (36), `ey-us-gaap-vs-ifrs-2026` (90), `damodaran-valn2ed-ch9` (30), `-ch10` (28), `-ch14` (37), `-ch15` (51).

| Theme | LOS ids | Outcome | Source ids / chunk ids |
|---|---|---|---|
| Short-term funding: ABL, factoring, commercial paper, lines | fixed-income-04-los1 | new source | `occ-asset-based-lending`, `occ-accts-rec-inventory-financing`, `nyfed-sr423-cpff` |
| Leveraged / high-yield funding, covenant-lite | fixed-income-04-los3 | new source | `occ-leveraged-lending` (e.g. `:62:53` covenant-lite, maintenance vs incurrence) |
| Repo, haircut, reverse repo | fixed-income-04-los2 | new source | `nyfed-sr740-repo-guide`, `richmondfed-money-market-ch6` |
| Government vs corporate issuance, auctions, market structure, segments | fixed-income-03-los1, 03-los3, 05-los2 | new source | `cfr-31-356`, `treasury-joint-staff-report-2014`, `treasury-iawg-2015` |
| Sovereign and non-sovereign funding and credit | fixed-income-05-los1, 15-los1 | new source (partial) | `occ-country-risk-management`, `msrb-infrastructure-primer`. Supranational funding: still thin (World Bank documents not loaded) |
| Indenture, covenants, trustee, legal/regulatory | fixed-income-01-los1, 01-los2, 02-los2 | new source (partial) | `usc-15-trust-indenture-act`, `cfr-17-229-202`, `utah-fcs5510-bond-market`. Affirmative/negative covenant text already in corpus: `lyryx-ifa-vol2:66:59`, `:99:95`, `flatworld-finance-banking-and-money:176:155`, `:204:179` |
| Cash flow structures, amortizing, call types, convertibles | fixed-income-02-los1 | retrieval miss (partial) | `ftse-fixed-income-indices-guide:21:23`, `:28:30`, `fed-trading-4000-p1:24:33`, `:37:58`, `occ-residential-real-estate-lending:7:8` (amortizing, balloon). Make-whole call, Bermudan: not found in an open source |
| Price, yield, maturity, coupon relationships; pricing on/between coupon dates | fixed-income-06-los1, 06-los2 | retrieval miss | `os:principles-finance-2e:m00061:1.1`, `:m00062:3`, `flatworld-finance-banking-and-money:71:64`, `:87:77`, `treasurydirect-pricing`, `ftse-fixed-income-indices-guide:14:11`, `:97:112`; plus new `utah-fcs5510-bond-market`, `ritchken-measures-of-price-sensitivity` |
| Yield measures, EAR/BEY, money market yields, discount margin | fixed-income-07-los1, 07-los2, 08-los1, 08-los2 | retrieval miss | `os:principles-finance-2e:m00055:0`, `:m00093:0.1`, `flatworld-business-accounting:829:723`, `richmondfed-money-market-ch16:8:8`, `treasurydirect-pricing:2:6`, `:2:7`, `treasury-tfx-yield-appendix:1:0`. G-/I-/Z-spread definitions: still not found |
| Spot, forward, par curves; return decomposition | fixed-income-09-los1, 09-los2, 09-los3, 10-los1, 10-los2 | new source (partial) | `boe-anderson-sleath-yield-curves` (spot and forward rates, 34 forward-rate mentions); `oxford-winkel-duration-immunisation`; existing `fed-feds-2006-28`, `mit-ocw-15433-fixedincome3:17:6`, `mit-ocw-15401-lec04:13:3`. Worked par-rate calculation: still thin |
| Duration, convexity, money duration, PVBP | fixed-income-11-los1, 11-los2, 12-los1, 12-los2, 12-los3, 13-los1, 13-los2 | new source | `ritchken-measures-of-price-sensitivity` (modified duration, convexity, PVBP, worked), `sfu-poitras-duration-convexity` (Taylor series; slide text is sparse, 8 chunks), `oxford-winkel-duration-immunisation` |
| Credit risk components (PD, LGD, EAD, expected loss) | fixed-income-14-los1 | retrieval miss | `nyfed-securitization:28:37`, `:43:54`, `:45:58`, `occ-rating-credit-risk:8:7`, `:52:49`, `mit-ocw-15433-creditrisk1:6:1`. The Basel II final rule (Federal Register 2007-12-07) has the definitions but is 1.9M characters, so it was not loaded |
| Rating agency uses and limitations | fixed-income-14-los2 | new source | `fsb-reducing-reliance-cra-2010` (cliff effects, herding), `nyfed-sovereign-ratings` (existing) |
| Spread drivers | fixed-income-14-los3 | not filled | covered earlier by `fed-feds-note-ebp`, `duffee-treasury-yields-spreads`; no further source |
| Credit analysis ratios; seniority and priority | fixed-income-16-los1, 16-los2, 16-los3 | new source (partial) | `occ-rating-credit-risk` (existing), `uscourts-bankruptcy-basics`, `occ-leveraged-lending`, `damodaran-valn2ed-ch15:40:34` (coverage ratios). "Absolute priority rule" and "structural subordination" by name: not found in an open source |
| Securitization benefits, parties, SPE | fixed-income-17-los1, 17-los2 | new source | `fed-risk-retention-2010`; existing `nyfed-securitization`, `occ-asset-securitization` |
| Covered bonds | fixed-income-18-los1 | not filled | `treasury-covered-bonds` already loaded; European legal framework still absent (ECB URL 404ed earlier) |
| CDO / CLO structure, tests | fixed-income-18-los4 | new source (partial) | `fed-risk-retention-2010` (CLO, 62 mentions); `cfa-rf-alt-credit`; waterfall and OC/IC test mechanics still thin |
| Non-mortgage ABS (card, auto, student) | fixed-income-18-los3 | new source | `occ-credit-card-lending`, `occ-installment-lending`, `philfed-credit-card-abs` (master trust, excess spread, early amortization), `fed-risk-retention-2010` |
| Time tranching, CMO tranches | fixed-income-19-los1, 19-los3 | new source (partial) | `slcg-cmo-primer` (PAC, sequential, Z tranche), `frbsf-mbs-letter-1996`, `fed-trading-4000-p1:58:95`, `:59:96`; SMM/CPR/PSA only in `nyfed-sr674-mortgage-spreads:22:25` and `flatworld-enterprise-and-individual-risk-management:459:477` |
| Residential mortgage features | fixed-income-19-los2 | new source | `occ-residential-real-estate-lending` (lien, LTV, recourse, balloon, prepayment), `occ-mortgage-banking` |
| CMBS | fixed-income-19-los4 | new source (partial) | `occ-commercial-real-estate-lending`, `fed-risk-retention-2010` (CMBS, 31 mentions); existing `fed-cmbs-cohen-2011:3:3`, `:14:16` for defeasance and balloon |
| Roles and sources of FSA; filings; MD&A; audit | fsa-01-los2, 01-los3, 01-los5 | new source (partial) | `cfr-17-229-303`, `cfr-17-210-2-02`, `occ-internal-external-audits`; existing `flatworld-business-accounting:304:264`, `os:principles-financial-accounting:m67840:2.3`. Critical audit matters: PCAOB returns 403, not loaded |
| IFRS vs US GAAP; standards differences | fsa-01-los4, 02-los1, 02-los2, 03-los1, 03-los2, 03-los3, 03-los4, 04-los4, 06-los1, 06-los2, 06-los3, 07-los1, 07-los2, 08-los1, 08-los2, 09-los2 | new source | `ey-us-gaap-vs-ifrs-2026` (e.g. `:16:21` inventory costing, LIFO, impairment, leases, cash flow classification). The Deloitte 2019 comparison was NOT used: the only reachable copy is a restricted EU Council working document (LIMITE) carrying an IFRS Foundation "no permission granted to third parties" notice. KPMG's 2021 handbook was not loaded (3.3M characters) |
| Leases (lessor) | fsa-08-los1 | new source | `occ-lease-financing` (finance vs operating lease, residual), existing `lyryx-ifa-vol2:216:213` (IFRS 16 right-of-use) |
| Earnings, non-recurring items, R&D and lease adjustments | fsa-02-los3, 03-los1, 07-los1 | new source | `damodaran-valn2ed-ch9` |
| Income taxes: effective, statutory, cash rate | fsa-09-los2, 09-los3, 09-los4 | new source (partial) | `damodaran-valn2ed-ch10:1:1` (effective vs marginal); existing `lyryx-ifa-vol2:154:149`, `:159:154`, `:171:167` (deferred taxes, valuation allowance) |
| Cash flow statement links, direct/indirect conversion | fsa-04-los1, 04-los2, 04-los3, 05-los1 | retrieval miss | `os:principles-financial-accounting:m67929:1`, `:m67935:2`, `lyryx-ifa-vol2:331:330`, `:353:349`, `flatworld-business-accounting:1030:899`, `:1025:896` |
| FCFF / FCFE | fsa-05-los2 | new source | `damodaran-valn2ed-ch14`, `-ch15` (FCFF, 46 mentions), `-ch10` |
| Common-size, liquidity/solvency ratios, DuPont | fsa-02-los5, 03-los5, 11-los1, 11-los2, 11-los3, 11-los4 | retrieval miss | `lyryx-intro-fa-2021a:279:213`, `:305:238`, `os:principles-finance-2e:m00042:2`, `:m00045:3`, `:m00045:4.1`, `flatworld-finance-for-managers:54:39`, `:56:40`, `flatworld-business-accounting:610:531`, `:767:667`. Defensive interval ratio and five-step DuPont by name: absent |
| Industry-specific ratios (retail, airline, hotel) | fsa-11-los5 | not filled | Only `cfa-nongaap:20:14` mentions same-store sales; BTS and FFIEC block. Airline glossaries exist (MIT, company investor pages) but were not loaded (licence unclear) |
| Non-GAAP and presentation choices | fsa-10-los6 | new source (partial) | `cfr-17-229-10` (Item 10(e) non-GAAP), existing `cfa-nongaap` |
| Reporting quality spectrum, conservative vs aggressive, motivations, mechanisms, methods, warning signs | fsa-10-los1, 10-los2, 10-los3, 10-los4, 10-los5, 10-los7, 10-los8 | retrieval miss | `cfa-rf-earnings-quality:6:3`, `:8:4`, `:12:9`, `:26:26`, `:58:61` (Beneish), `os:principles-financial-accounting:m67855:0` (fraud triangle), `occ-internal-external-audits`. COSO fraud study and SEC Section 704 report: not reachable (coso.org PDF not served, sec.gov blocked) |
| Pensions, share-based pay | fsa-08-los2, 08-los3 | retrieval miss (partial) | `lyryx-ifa-vol2:13:5`, `:15:6`, `:185:180` (defined benefit and contribution), `flatworld-enterprise-and-individual-risk-management` (pension types). Share-based compensation mechanics: thin |
| Forecasting, pro forma model, Porter, behavioral, inflation, horizon | fsa-11-los6, 12-los1, 12-los2, 12-los3, 12-los4, 12-los5 | retrieval miss | `flatworld-finance-for-managers:64:45`, `:68:46`, `damodaran-valn2ed-ch11`, `-ch12`, `flatworld-business-strategy:13:9`, `:15:11`, `os:principles-management:m70646:0`, `cfa-rf-behavioral`. Inflation pass-through in forecasts: not found |

### Blocked or unusable (for the user to open manually, not bypassed)
- pcaobus.org (AS 3101 audit report, AS 2401 fraud): 403. fasb.org Concepts Statement 8 link: 403 or not a PDF.
- COSO *Fraudulent Financial Reporting 1998-2007*: coso.org and the Ole Miss eGrove link return a page, not a PDF.
- Ritchken book chapters 5 to 8 and 10 (Case Western): the PDFs are password-protected; not opened. Chapter 9 is readable.
- Deloitte DART roadmap (subscriber download); sec.gov (Section 704 report).
- Not loaded by choice: Basel II final rule (1.9M characters); KPMG IFRS-vs-GAAP handbook 2021 (3.3M); Deloitte 2019 copy on the EU Council site (restricted document, IFRS Foundation no-redistribution notice).

### Verified vs assumed (this pass)
Verified: HTTP status, content type and PDF magic bytes for every download; extracted term counts (for example "modified duration" and "convexity" in Ritchken ch. 9, "LIFO" in the EY guide, "covenant lite" in the OCC leveraged-lending glossary, "haircut" 30 times in SR 740); one chunk read per source for several sources to check readable text (pdf.js printed font warnings on three PDFs; no garbling seen in the chunks checked); ingest chunk counts. Not verified: whether the new chunks rank in the top retrieved set for each LOS (no coverage run); licence status of the university course notes (none stated, treated as ground); public domain status of OCC, Treasury, Fed Board, GPO and uscourts.gov items (U.S. federal works, assumed).

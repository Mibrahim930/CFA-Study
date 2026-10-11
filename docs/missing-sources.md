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

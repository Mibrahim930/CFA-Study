# Reliability Research (living document)

Owner: Reliability Research agent. Audited by the main engineer. Started 2026-10-10.

**Conventions**
- **Confidence:** **High** means I fetched and read the primary source (or its licence page) this session. **Medium** means a secondary source, a catalogue record, or a search snippet quoting the primary. **Low** means inference only.
- **Reuse class:**
  - **ADAPT:** open licence or public domain. We may adapt it with attribution, within the licence terms (NC = non-commercial, SA = share-alike).
  - **GROUND:** read privately as background and never reproduced. The copy guard applies.
  - **LINK:** the user reads it at the source. We store the URL and a locator only.
- **Access:**
  - "Fetched" means downloaded by a plain `curl` or WebFetch this session, and saved only in the scratchpad.
  - "403" means the site blocks automated fetches. These were not bypassed; the user can open them in a browser.
- Tier labels (T1–T4) follow the approved plan §2.0.

---

## Cycle 1 (partial; paused by user redirect on 2026-10-10): golden-vector source findings

Work on golden vectors and MCQ validation was stopped mid-cycle by a change of direction. No `content-pipeline/golden/` files were written. These findings are recorded because they change the plan.

1. **The CFA Institute "Mastering Your Calculator" PDF has no worked examples.** (High: fetched and read, 2 pages.)
   - It only lists functions and gives exam-day tips.
   - The plan's §4 assumption ("golden values taken from the official calculator guide examples") cannot be met from this document.
2. **The substitute is the TI BA II Plus / BA II Plus Professional Guidebook (English).** (High: fetched and read pp. 23–74.)
   - URL: https://education.ti.com/html/eguides/financials/baiipluspro/en/Content/Resources/PDF/BAIIPlusProfessional_Guidebook_EN.pdf (© 2011–2025 Texas Instruments).
   - It has worked examples with answers for these functions:
     - TVM, including BGN mode, P/Y ≠ C/Y, and amortization
     - Cash-flow NPV, NFV, payback, discounted payback, IRR and MIRR ("MOD")
     - Bond worksheet: price, accrued interest and modified duration
     - Straight-line depreciation with a mid-month start
     - Percent change / CAGR, NOM→EFF conversion, breakeven and profit margin
   - Reuse class: GROUND. The numbers are facts and may be used as test vectors with a citation.
   - **Two internal inconsistencies to flag:**
     - p. 36: the screen shows `INT = -27,920.72`, but the answer text says "$27,790.72".
     - p. 50: the bond example text says settlement 2004 / maturity 2005, but the keystrokes enter 2006 / 2007. Both span the same 1.5 years, so the answer is unaffected.
   - Any vector taken from these pages must be recomputed independently.
3. **SOA Exam FM sample questions and solutions** (Copyright 2026 Society of Actuaries; last update Aug 2026; about 460 items with worked solutions). (High: fetched.)
   - This is the richest free source of verifiable numeric answers for TVM, bonds, spot/forward rates, duration, convexity and immunization. See S7 below.
4. **CFA Institute's free Level I sample-question page** has 10 items on the page and 20 more behind a free download form. (High: page read via WebFetch.)
   - Numeric keys usable as anchors:
     - Q2 HPR with dividend: −10.1%
     - Q5 diluted EPS: USD 3.70
     - Q7 repo repurchase price, 45 days on a 360-day basis: USD 50,023,438
   - No curriculum year is stated on the page.

---

## Source Discovery — Cycle 1 (2026-10-10)

### A. What the 2027 changes mean for source hunting (T1, High)

Source: CFA Institute, "Curriculum Changes for 2027 CFA Program", https://www.cfainstitute.org/sites/default/files/curriculum-update-2027.pdf. © 2026, 1 page, fetched. The 2027 changes it describes, with my paraphrase of each:

- **Quant**
  - Expanded simulation, with step-by-step historical simulation, bootstrapping and Monte Carlo in **Excel and Google Sheets**.
  - Portfolio-optimization readings aligned with CFA's **Python Fundamentals** module.
  - A **new reading on financial data science, AI and LLMs**.
  - New "Equation Explorers" for TVM, inside CFA's learning platform only.
  - The Quant prerequisite reading is retired.
- **Equities**
  - Valuation built on disaggregated financial-statement forecasting, plus probability-weighted scenario analysis.
  - **Porter's Five Forces and PESTLE** tied to valuation.
  - New modules on **equity research reports**: initiating coverage, sell-side versus buy-side, and **activist short sellers**.
  - CAPM and multi-factor cost of equity estimated with real market data.
- **Ethics** now fully reflects **Standards of Practice Handbook v12**, with one module per Standard.

These changes drove the ranking below: data science/LLMs, simulation, Porter/PESTLE and research reports were moved up.

### B. Ranked new sources (by impact on the priority gaps)

Sources already in the plan are not repeated. "Modules" refers to the official 2027 module titles in `lib/syllabus/topics.ts`.

| # | Source (ID) | URL | Access | Licence (quoted) | Modules supported | Authority / date | Reuse | Conf. |
|---|---|---|---|---|---|---|---|---|
| 1 | **S41** CFA Institute "Curriculum Changes for 2027" | cfainstitute.org/sites/default/files/curriculum-update-2027.pdf | Fetched | "© 2026 CFA Institute. All rights reserved." | Scoping for Quant, Equities, Ethics | T1, 2026 | GROUND | High |
| 2 | **S1** OpenStax *Principles of Management*, ch. 8: 8.4 "A Firm's External Macro Environment: PESTEL", 8.5 "A Firm's Micro Environment: Porter's Five Forces", 8.6–8.8 internal environment, value chain, positioning | github.com/openstax/osbooks-principles-of-management-bundle | Fetched (repo LICENSE + module CNXML) | LICENSE file: "Attribution-NonCommercial-ShareAlike 4.0 International" | Industry and Competitive Analysis; Company Analysis; Business Models | T2, OpenStax | ADAPT | High |
| 3 | **S2** OpenStax *Principles of Data Science*: ML basics (classification, regression, trees, random forests), Deep Learning & AI Basics (one NLP module explicitly covers large language models and transformers), Time Series & Forecasting, Ethics in data science | github.com/openstax/osbooks-principles-data-science | Fetched (LICENSE + TOC + module keyword scan) | "Attribution-NonCommercial-ShareAlike 4.0 International" | Introduction to Financial Data Science; Simple Linear Regression; Simulation (bootstrap mentions) | T2, OpenStax (2020s; exact year not checked) | ADAPT | High (licence/TOC); Medium (depth on LLMs) |
| 4 | **S38** CFA Institute *Ethics in Practice: Ethics in Investment Management Casebook*, 2nd ed. (Oct 2019): 100 short cases, each a vignette with an A–D multiple-choice question | cfainstitute.org/-/media/documents/ethics-in-practice/ethics-in-practice-casebook-2nd-edition-web.pdf | Fetched (238 pp) | "You may copy and distribute the individual cases in this book, but not the book in its entirety, and without modification and for non-commercial purposes, provided you attribute the content to CFA Institute and retain this copyright notice." | All 10 Ethics modules | T1, 2019 (**pre-Handbook v12**, so check every case against v12; 4 options, not the exam's 3) | LINK, or quote an unmodified single case with notice; do not adapt | High |
| 5 | **S9** OCC Comptroller's Handbook, *Asset Securitization*: parties, SPVs, credit enhancement, cash-flow mechanics/waterfalls, risks | occ.gov/publications-and-resources/publications/comptrollers-handbook/files/asset-securitization/pub-ch-asset-securitization.pdf | Fetched (92 pp) | US federal agency work, so public domain under 17 U.S.C. §105 (OCC is a Treasury bureau) | Fixed-Income Securitization; ABS Instrument & Market Features; MBS (structure) | T1 regulator; **Nov 1997** (2025 strike-through edits), so market-size facts are stale | ADAPT | High (content); Medium (PD status is by statute, not a page statement) |
| 6 | **S7** SOA Exam FM: Sample Questions + Sample Solutions (updated Aug 2026); study note **FM-24-17 "Using Duration and Convexity to Approximate Change in Present Value"** (Alps, 2017); BA II Plus calculator review note | soa.org/globalassets/assets/files/edu/2018/2018-10-exam-fm-sample-solutions.pdf; …/Files/Edu/2017/fm-duration-convexity-present-value.pdf (links taken from the official Dec-2026 FM syllabus PDF) | Fetched | "Copyright 2026 by the Society of Actuaries." | TVM; Bond Valuation; Yield measures; Term Structure (spot/forward); Interest Rate Risk; Duration; Convexity | Actuarial exam body; current | GROUND (numbers usable as test vectors) | High |
| 7 | **S35** Lyryx *Intermediate Financial Accounting* Vol. 1 & 2 (Arnold & Kyle, 2021-A; IFRS + ASPE). Vol 2 covers current and long-term liabilities, complex financial instruments, **income taxes**, pensions, **leases**, equity, **EPS**, **cash flows (direct method)**, changes/errors | open.umn.edu/opentextbooks/textbooks/intermediate-financial-accounting-volume-2 (lyryx.com did not resolve from here) | Catalogue fetched; book PDF not fetched | OTL: "Attribution CC BY"; eCampusOntario record: CC BY 4.0 | Analysis of Income Taxes; LT Liabilities & Equity; Cash Flows I/II; Income Statements (EPS); Inventories and LT Assets (Vol 1) | T2 university/OER, 2021; IFRS-based (not US GAAP); a reviewer flagged dated lease content | ADAPT | Medium |
| 8 | **S13** OCC Comptroller's Handbook, *Rating Credit Risk* (2001, updated 2017) and *Commercial Loans* (1990/1998): repayment capacity, cash-flow and collateral analysis, risk-rating frameworks | occ.gov/…/rating-credit-risk/pub-ch-rating-credit-risk.pdf; …/commercial-loans/pub-ch-commercial-loans.pdf | Fetched (69 pp; 30 pp) | Public domain (US federal work) | Credit Risk; Credit Analysis for Corporate Issuers; Financial Analysis Techniques; Working Capital & Liquidity | T1 regulator; older | ADAPT | High |
| 9 | **S16** Fed Board FEDS 2006-28, Gürkaynak–Sack–Wright, "The U.S. Treasury Yield Curve: 1961 to the Present", plus the Board's daily zero-coupon, par and forward curve data (staff research product) | federalreserve.gov/pubs/feds/2006/200628/200628pap.pdf; data at federalreserve.gov/econres/feds/the-us-treasury-yield-curve-1961-to-the-present.htm | Fetched (42 pp) | Board site: "Unless otherwise indicated, information on Board's website is in the public domain and may be copied and distributed without permission." | Term Structure (spot, par, forward); Curve-Based Risk Measures; real-data examples | T1 central bank | ADAPT | High |
| 10 | **S17** US Treasury, "Treasury Yield Curve Methodology" (par yield curve, monotone convex method, bid-side quotes collected by FRBNY around 3:30 PM) | home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics/treasury-yield-curve-methodology | Fetched | US federal work, public domain | Term Structure; FI Markets for Government Issuers | T1 | ADAPT | High |
| 11 | **S10** FRBNY Staff Report 318, Ashcraft & Schuermann (2008), "Understanding the Securitization of Subprime Mortgage Credit": seven frictions, the role of rating agencies, and a worked New Century 2006 deal | newyorkfed.org/medialibrary/media/research/staff_reports/sr318.pdf | Fetched (82 pp) | Staff report disclaimer only; © FRBNY. A Reserve Bank is not a federal agency, so this is **not** public domain | Securitization; ABS; MBS; Credit Risk (ratings) | T1-adjacent, 2008 | GROUND | High |
| 12 | **S11** FRBNY Economic Policy Review, Vickery & Wright (2013), "TBA Trading and Liquidity in the Agency MBS Market" | newyorkfed.org/medialibrary/media/research/epr/2013/1212vick.pdf | Fetched (18 pp) | © FRBNY | MBS Instrument & Market Features; FI Issuance & Trading | 2013 | GROUND | High |
| 13 | **S22** Fed Board, *Money and Payments: The U.S. Dollar in the Age of Digital Transformation* (Jan 2022): stablecoins, cryptocurrency, CBDC | federalreserve.gov/publications/files/money-and-payments-20220120.pdf | Fetched (40 pp) | Public domain (Board statement, row 9) | Introduction to Digital Assets | T1, 2022. **Policy has moved since** (US stablecoin legislation in 2025; Medium, not verified this cycle) | ADAPT | High |
| 14 | **S23** BIS Annual Economic Report 2025, ch. III, "The next-generation monetary and financial system": tokenisation, unified ledger, and the stablecoin tests of singleness, elasticity and integrity | bis.org/publications/next-generation-monetary-financial-system.pdf | Fetched (38 pp) | BIS: "Users may download, display, print out, photocopy or redistribute any BIS Material for non-commercial purposes." Limited extracts may be reproduced with citation | Digital Assets; (Monetary Policy) | T1 central-bank body, Jun 2025 | GROUND, short extracts OK | High |
| 15 | **S24** MIT OCW 15.S12 *Blockchain and Money* (Gensler, Fall 2018): lectures, slides, readings | ocw.mit.edu/courses/15-s12-blockchain-and-money-fall-2018/ | Course index found via search; OCW terms page fetched | OCW terms: "Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)" | Introduction to Digital Assets | T2, **2018** (pre-ETF, pre-2025 rules) | ADAPT | Medium |
| 16 | **S25** Fed Board FEDS Notes, Cai & Haque (Feb 2024), "Private Credit: Characteristics and Risks" | federalreserve.gov/econres/notes/feds-notes/private-credit-characteristics-and-risks-20240223.html | Fetched | Public domain (Board) | Investments in Private Capital: Equity and Debt; Alt Features & Structures | T1, 2024 | ADAPT | High |
| 17 | **S26** CFA Institute Capital Markets reports: "Private Credit: Market Structure, Fund Design, and Retail Access" (Jul 2026, 49 pp); "Understanding the Growth of Private Markets" (Jun 2026, 21 pp) | rpc.cfainstitute.org/sites/default/files/docs/research-reports/rpc_private-credit_marketstructure-funddesign-andretailaccess_online.pdf; …/fti-macro_growth-of-private-markets_online.pdf | Fetched | "© 2026 CFA Institute. All rights reserved. No part of this publication may be reproduced…" | Private Capital; Alt Features, Methods & Structures; Alt Performance | T1, 2026 (very current) | GROUND | High |
| 18 | **S27** CFA Institute Research Foundation Brief, *An Introduction to Alternative Credit* (2024, 106 pp) | rpc.cfainstitute.org/-/media/documents/article/rf-brief/introduction-to-alt-credit.pdf | Fetched | "© 2024 CFA Institute Research Foundation. All rights reserved." | Private Capital (debt); Alt structures | T1, 2024 | GROUND | High |
| 19 | **S4** OpenIntro *Introduction to Modern Statistics* 2nd ed.: randomization, **bootstrapping**, simulation-based inference, regression | openintro.org/book/ims/ (free web; free PDF at $0 on Leanpub) | Page fetched | openintro.org/license: "Most of OpenIntro's resources, including the Statistics textbooks, are released under a Creative Commons BY-SA 3.0 license." | Simulation; Estimation & Hypothesis Testing; Simple Linear Regression; Statistical Characteristics | T2 | ADAPT (SA, no OpenIntro branding on derivatives) | Medium-High |
| 20 | **S5** QuantEcon, *Python Programming for Economics and Finance* (Monte Carlo, NumPy, pandas) | python-programming.quantecon.org | Fetched | "licensed under a Creative Commons Attribution-ShareAlike 4.0 International" | Simulation; Portfolio Return & Risk (Python optimization alignment); Financial Data Science | T2 (academic project) | ADAPT | High (licence); Medium (coverage) |
| 21 | **S19** Chicago Fed, *Understanding Derivatives: Markets and Infrastructure*: ch. 1 Overview (2013), 2 CCP Clearing, 3 OTC Derivatives (2014), 4 Hedging | chicagofed.org/publications/understanding-derivatives/index | Fetched (ch 1, 3) | "Federal Reserve Bank of Chicago, © 2013/2014" | Derivative Instrument & Market Features; Forward Commitments vs Contingent Claims; Benefits, Risks & Uses; Intro to Risk Management | T1-adjacent, 2013–14 (pre-uncleared-margin phase-in) | GROUND | High |
| 22 | **S18** ARRC (NY Fed-convened), *A User's Guide to SOFR* (Apr 2019) + *SOFR FRN Conventions Matrix* (Aug 2019): simple versus compounded averages, in-arrears versus in-advance, lookbacks | newyorkfed.org/medialibrary/Microsites/arrc/files/2019/Users_Guide_to_SOFR.pdf | Fetched (21 pp) | No licence statement found (NY Fed-hosted) | Yield Measures for Floating-Rate Instruments; FI Instrument Features; Cash Flows & Types | T1-adjacent, 2019; LIBOR ended 2023, so **SOFR is the current reference** | GROUND | High |
| 23 | **S31** OECD *Corporate Governance Factbook 2025*: jurisdictions, share classes, voting, shareholder meetings, boards | oecd.org/en/publications/oecd-corporate-governance-factbook-2025_f4f43735-en | **403** (both curl and WebFetch) | Search snippet quotes the PDF: "Creative Commons Attribution 4.0 International licence" | Equity Jurisdictions, Classes & Voting; Corporate Governance; Investors & Stakeholders | T1 intergovernmental, 2025 | ADAPT (pending licence check in a browser) | Medium |
| 24 | **S33** Caldara & Iacoviello Geopolitical Risk (GPR) index: AER 2022 paper, monthly data, last update 2026-10-01 | matteoiacoviello.com/gpr.htm | Fetched | No licence; authors ask for citation with download date | Introduction to Geopolitics | Fed Board economists, peer-reviewed | GROUND / data with citation | High |
| 25 | **S34** IMF SDN 2023/001 "Geoeconomic Fragmentation and the Future of Multilateralism"; IMF GFSR Apr 2024 ch. 2 "The Rise and Risks of Private Credit" | imf.org/en/publications/staff-discussion-notes/issues/2023/01/11/… ; imf.org/en/Publications/GFSR/Issues/2024/04/16/… | **403** to curl | IMF terms (via search summary): personal, noncommercial download without "any right to resell, redistribute, compile, or create derivative works" | Geopolitics; Private Capital; Capital Flows | T1 intergovernmental | GROUND / LINK | Medium |
| 26 | **S3** CFA Institute Research Foundation, *Handbook of AI and Big Data Applications in Investments* (2023, 164 pp) | rpc.cfainstitute.org/sites/default/files/-/media/documents/article/rf-brief/ai-and-big-data-in-investments.pdf | Fetched | "© 2023 CFA Institute Research Foundation. All rights reserved." | Introduction to Financial Data Science | T1, 2023 (pre-agentic LLMs) | GROUND | High |
| 27 | **S36** Suranovic, *International Finance: Theory and Policy* (2010): FX markets, interest rate parity, cross rates | open.umn.edu/opentextbooks/textbooks/international-finance-theory-and-policy | Catalogue via WebFetch | OTL: CC BY-NC-SA | Exchange Rate Calculations; Capital Flows & the FX Market | T2, **2010** (market data stale) | ADAPT | Medium |
| 28 | **S48** ECB website content, including the "Explainers" | ecb.europa.eu/home/disclaimer/html/index.en.html | Fetched | "users of this website may make free use of the information obtained directly from it subject to the following conditions: When such information is distributed or reproduced, it must appear accurately and the ECB must be cited as the source…" Exception: author-named papers need permission | Monetary Policy; Capital Flows & FX; Digital Assets (digital euro) | T1 central bank | ADAPT (explainers; attribute; keep accurate) | High |
| 29 | **S37** BIS Triennial Central Bank Survey 2025 (FX turnover, April 2025) | bis.org/statistics/rpfx25_fx.htm | Not fetched | BIS terms (row 14) | Capital Flows & the FX Market | T1, 2025 | GROUND / data | Medium |
| 30 | **S30** US EIA "Energy Explained" pages | eia.gov (copyrights_reuse page fetched) | Terms fetched | "U.S. government publications are in the public domain and are not subject to copyright protection." | Natural Resources (energy commodities) | T1 statistical agency | ADAPT | High (licence); content not reviewed |
| 31 | **S29** World Bank / multilateral *PPP Reference Guide 3.0* (2017) | openknowledge.worldbank.org/entities/publication/e64a94b9-b0cb-51a3-b8dd-36bd7944284f | PDF **403** | OKR record (search snippet): CC BY 3.0 IGO | Real Estate and Infrastructure | T1 multilateral, 2017 | ADAPT (pending check) | Medium |
| 32 | **S8** TI BA II Plus / Professional Guidebook (see Cycle 1 note) | education.ti.com/…/BAIIPlusProfessional_Guidebook_EN.pdf | Fetched (95 pp) | "© 2011-2025 Texas Instruments Incorporated" | TVM; Capital Investments (NPV/IRR/MIRR); Bond Valuation; LT Assets (depreciation); BA II Plus drill | Manufacturer | GROUND (numbers usable as vectors) | High |
| 33 | **S39** CFA Institute Ethical Decision-Making Framework (Identify–Consider–Act–Reflect), 1 page | cfainstitute.org/-/media/documents/support/ethics/ethical-framework-guide.pdf | Fetched | "© 2019 CFA Institute. All rights reserved." | Ethics and Trust; Application of the Code and Standards | T1 | GROUND | High |
| 34 | **S28** CFA Institute Research Foundation, *A Comprehensive Guide to ETFs* 2nd ed., Module 1 (2025) and Module 2 "Evaluating ETFs" (2026) | rpc.cfainstitute.org/research/foundation/2026/evaluating-etfs-module-2 | Page fetched; PDF links found | All rights reserved (RF standard) | Equity Issuance & Trading (ETFs); Portfolio Management Overview (pooled vehicles) | T1, 2025–26 | GROUND | Medium |
| 35 | **S12** Ginnie Mae MBS Guide, ch. 1 "General Features of the Program" (effective 2013-08-01): pass-through structure and guaranty | ginniemae.gov/issuers/program_guidelines/MBSGuideLib/Chapter_01.pdf | Fetched (13 pp) | No statement found. Ginnie Mae is a government corporation within HUD, so it is probably a US government work | MBS Instrument & Market Features | T1 issuer docs | GROUND (ADAPT once PD status confirmed) | Medium |
| 36 | **S43** FinQuiz free CFA Level I YouTube playlist | youtube.com/playlist?list=PLxAunyTa64uewhsyAF93FlJ9mMfd-DxO7 (via finquiz.com page) | Page fetched (no YouTube access) | Proprietary | All 10 topics | **Labelled "2026 exams"**; no 2027 update seen | LINK / embed only | Medium |

**Recorded but low value, blocked, or rejected**

- **Moody's *Rating Symbols and Definitions*** (Nov 2023), ratings.moodys.com/api/rmc-documents/53954:
  - The fetch returned 403, so this is LINK only.
  - Use it for the rating scale (Credit Risk). Medium.
- **S&P documents**, all 403. LINK. Medium.
  - *Guide to Credit Rating Essentials* (2024), spglobal.com/_assets/documents/guide-to-credit-rating-essentials_2024.pdf.
  - S&P sovereign methodology (Dec 2017 per a 2019 S&P explainer; current version unverified).
  - Fitch criteria: not located.
  - All three agencies block automated fetch. The user should save copies manually if wanted.
- **OCC (Options Clearing Corp) *Characteristics and Risks of Standardized Options***, theocc.com: 403. LINK. Medium.
- **CME Group education**, including "Understanding Treasury Futures": 403. LINK.
- **CFTC** education pages: 403. This is a federal agency, so the content is public domain by statute. It would be good for futures basics. Medium.
- **Fannie Mae *Basics of Fannie Mae Single-Family MBS*** (Nov 2021): 403. LINK.
- **Bank of England** (terms fetched):
  - Personal or internal non-commercial download only. The Bank "typically grants permission for non-commercial re-use … particularly in an academic or education context".
  - Reuse class: LINK, or GROUND unless we write to ask permission. High.
- **CFA Institute Investment Foundations certificate:** now paid (USD 350; student USD 79, per a 2025 flyer). Not free. Medium.
- **CFA Institute Research Objectivity Standards:** no current free PDF found. Low.
- **Khan Academy:**
  - Their support page points to CC BY-NC-SA, but partner content is excepted.
  - Finance coverage and per-item licences were not checked. Candidate ADAPT next cycle. Medium.
- **Finan, *A Basic Course in the Theory of Interest and Derivatives Markets*:**
  - The UCSB copy returned 404.
  - The author permits personal and class use only ("All Rights Reserved").
  - Not pursued; GROUND at most.
- **Lyryx site** (lyryx.com): DNS failed from here. Recheck the licence on the book's own copyright page.

### C. Currency flags found this cycle (affect content dating)

| Flag | Detail | Action | Conf. |
|---|---|---|---|
| **IFRS 18** replaces IAS 1 presentation for periods beginning **1 Jan 2027**: new operating/investing/financing P&L categories and disclosure of management-defined performance measures (MPMs) | Secondary sources (KPMG, BDO, ICAS) | It is unknown whether the 2027 L1 FSA readings use IAS 1 or IFRS 18. Do not let post-2024 sources inject IFRS 18 rules into L1 lessons until checked. Tag FSA items with the standard version. | Medium |
| Ethics now uses **Standards Handbook v12** | S41 | The S38 casebook (2019) predates v12. Every case needs a v12 cross-check before use. | High |
| **SEC Rule 13f-2 / Form SHO** (short-position reporting): adopted Oct 2023; compliance reportedly deferred to **2 Jan 2028** | Law-firm summaries (Morgan Lewis, SF&L, Dec 2025) | Relevant to "activist short sellers" in the research-reports module. Describe the rule as "adopted, not yet in force". Verify on sec.gov. | Medium |
| **LIBOR → SOFR** | ARRC (S18) | Any older FRN or swap source quoting LIBOR must be relabelled. MIT 15.401 and Yale ECON 252 (both in the plan) predate this. | High |
| Digital-asset regulation moved in 2025 (US stablecoin law; SEC stance changes) | Not verified this cycle | Teach concepts from S22–S24 and date-stamp any regulatory statement. | Low |
| OCC handbooks (1990–2001) and Suranovic (2010) | Dated sources | Use for mechanisms only, never for market statistics. | High |

### D. Master table: module → best new sources (Cycle 1)

"—" means no new source this cycle beyond the plan. ⚠ marks a gap that remains thin.

**Quantitative Methods**
| Module | New sources |
|---|---|
| Returns of Financial Assets and Instruments | S8 (%CH/CAGR), CFA sample Q2 |
| Types of Financial Returns | S8 |
| Benchmarking Returns | — |
| The Time Value of Money in Finance | S8, S7 |
| Statistical Characteristics of Asset Returns | S4 |
| Statistical Distributions for Financial Asset Prices and Returns | S4, S2 |
| Estimation and Hypothesis Testing | S4 (bootstrap CIs, randomization tests) |
| The Return and Risk of a Financial Portfolio | S5 (Python optimization alignment) |
| Simulation of Financial Asset Prices and Returns | S4, S5, S2; Excel/Google Sheets function docs (LINK, next cycle) |
| Applications of Simple Linear Regression in Finance | S4, S2 |
| Introduction to Financial Data Science | **S2**, S3, S5, OpenStax *Intro to Python Programming* (CC BY-NC-SA 4.0, licence verified) |

**Economics**
| Module | New sources |
|---|---|
| The Firm and Market Structures | — |
| Understanding Business Cycles | — |
| Fiscal Policy | — |
| Monetary Policy | S48 (ECB explainers), BoE (LINK) |
| Introduction to Geopolitics | **S33**, S34 |
| International Trade | — (Suranovic's trade text exists; not verified) |
| Capital Flows and the FX Market | S36, S37, S48 |
| Exchange Rate Calculations | S36 ⚠ (still thin for forward-points practice; the engine covers the maths) |

**Corporate Issuers**
| Module | New sources |
|---|---|
| Organizational Forms, Corporate Issuer Features, and Ownership | CFA sample Q4 |
| Investors and Other Stakeholders | S31 |
| Corporate Governance | S31 |
| Working Capital and Liquidity | S13 (Commercial Loans) |
| Capital Investments and Capital Allocation | S8 (NPV/IRR/MIRR examples) |
| Capital Structure | — ⚠ |
| Business Models | S1 |

**Financial Statement Analysis**
| Module | New sources |
|---|---|
| Introduction to Financial Statement Analysis | IFRS 18 flag (§C) |
| Analyzing Income Statements | S35 (EPS), CFA sample Q5 |
| Analyzing Balance Sheets | S35 |
| Analyzing Statements of Cash Flows I / II | S35 (direct method) |
| Analysis of Inventories | S35 Vol 1 |
| Analysis of Long-Term Assets | S35 Vol 1, S8 (depreciation) |
| Topics in Long-Term Liabilities and Equity | S35 Vol 2 (leases, pensions, financial liabilities) |
| Analysis of Income Taxes | **S35 Vol 2** (income taxes chapter) |
| Financial Reporting Quality | IFRS 18 MPMs (§C); SEC non-GAAP guidance (backlog) ⚠ |
| Financial Analysis Techniques | S13 |
| Introduction to Financial Statement Modeling | — ⚠ |

**Equity Investments**
| Module | New sources |
|---|---|
| Equity Instrument Features | S31 |
| Equity Jurisdictions, Classes, and the Voting Process | **S31** |
| Equity Issuance and Trading | S28 |
| Sources of Equity Returns | CFA Research Foundation 2026 "Centuries of US and Global Returns" (GROUND; not fetched) |
| Introduction to Equity Valuation | — |
| DCF and Growth Models | — |
| Relative Value Equity Valuation Approaches | — |
| Financial Statement Forecasting in Equity Valuation | — ⚠ (new 2027 emphasis) |
| Industry and Competitive Analysis | **S1** (Five Forces, PESTEL) |
| Company Analysis: Past, Present, and Future | S1 (internal environment, value chain) |
| Equity Analyst Research Reports | ⚠ Form SHO flag (§C); CFA Research Challenge guidelines (local-society PDFs, not fetched) |
| CAPM, Market Model, Factor Models | — (Ken French data library: backlog) |

**Fixed Income**
| Module | New sources |
|---|---|
| Fixed-Income Instrument Features | S18, S9 |
| Fixed-Income Cash Flows and Types | S18, S9 |
| Fixed-Income Issuance and Trading | S11, CFA sample Q7 (repo) |
| Fixed-Income Markets for Corporate Issuers | S13 |
| Fixed-Income Markets for Government Issuers | S17 |
| Bond Valuation: Prices and Yields | S7, S8 |
| Yield and Yield Spread Measures for Fixed-Rate Bonds | S7 |
| Yield and Yield Spread Measures for Floating-Rate Instruments | **S18** |
| The Term Structure: Spot, Par, and Forward Curves | **S16**, S17, S7 |
| Interest Rate Risk and Return | S7 (FM-24-17) |
| Yield-Based Bond Duration Measures and Properties | S7, S8 |
| Yield-Based Bond Convexity and Portfolio Properties | S7 |
| Curve-Based and Empirical Fixed-Income Risk Measures | S16 (data), S7 (partial) |
| Credit Risk | S13, S10, Moody's/S&P (LINK) |
| Credit Analysis for Government Issuers | S34 (GROUND), S&P sovereign (LINK) ⚠ |
| Credit Analysis for Corporate Issuers | **S13** |
| Fixed-Income Securitization | **S9**, S10 |
| ABS Instrument and Market Features | **S9**, S10 |
| MBS Instrument and Market Features | S11, S12, S10 |

**Derivatives**
| Module | New sources |
|---|---|
| Derivative Instrument and Derivative Market Features | **S19** ch 1, 3; OCC ODD (LINK) |
| Forward Commitment and Contingent Claim Features | S19 |
| Derivative Benefits, Risks, and Uses | S19 ch 4 |
| Arbitrage, Replication, and the Cost of Carry | ⚠ none free and authoritative found (CME blocked) |
| Pricing and Valuation of Forward Contracts | ⚠ |
| Pricing and Valuation of Futures Contracts | CFTC (LINK) ⚠ |
| Pricing and Valuation of Swaps | ⚠ (the SOA FM extract showed no swap items) |
| Pricing and Valuation of Options | OCC ODD (LINK) ⚠ |
| Option Replication Using Put–Call Parity | ⚠ |
| One-Period Binomial Model | ⚠ |

**Alternative Investments**
| Module | New sources |
|---|---|
| Features, Methods, and Structures | S26, S27 |
| Performance and Returns | S26 |
| Private Capital: Equity and Debt | **S25**, S26, S27, S34 |
| Real Estate and Infrastructure | S29 |
| Natural Resources | S30 |
| Hedge Funds | — (Fed Financial Stability Report: backlog) |
| Introduction to Digital Assets | **S22**, S23, S24, S48 |

**Portfolio Construction**
| Module | New sources |
|---|---|
| Portfolio Risk and Return: Part I / II | S5 |
| Portfolio Management: An Overview | S28 |
| Basics of Portfolio Planning and Construction | — |
| The Behavioral Biases of Individuals | — |
| Introduction to Risk Management | S19 ch 4 |

**Ethics**
| Module | New sources |
|---|---|
| Ethics and Trust in the Investment Profession | S39, S38 |
| Code of Ethics and Standards of Professional Conduct | S38 |
| Guidance for Standards I–VII (7 modules) | **S38** (needs a per-case Standard tag and v12 check); CFA Institute public sanctions list (LINK) |
| Application of the Code and Standards: Level I | S38, S39 |

### E. Recommendations from this cycle (ranked by reliability impact)

1. **Re-source the finance-engine golden tests.**
   - Replace the "official calculator guide" plan item with the TI Guidebook (S8) plus SOA FM sample solutions (S7). Each vector must also be independently recomputed.
   - The CFA PDF has no examples.
2. **Ingest S1 (OpenStax Principles of Management ch. 8) and S2 (OpenStax Principles of Data Science).**
   - Both use the same licence and CNXML pipeline as the OpenStax books already planned, so the cost is near zero.
   - They cover two 2027-new emphases: Five Forces/PESTLE and data science/LLMs.
3. **Use S38 (Ethics in Practice) as the ethics calibration set, not as content.**
   - Show individual cases unmodified, with the required notice, or link to them.
   - Tag each case to a Standard and check it against Handbook v12.
4. **Make S9 + S13 (OCC, public domain) the ADAPT backbone for securitization and credit analysis.**
   - Add S10 and S11 (FRBNY) as GROUND.
   - Date-stamp everything, because the OCC texts are 1997–2001.
5. **Use S16 + S17 for term structure,** with real Fed and Treasury curve data in examples (public domain).
6. **Ingest S35 (Lyryx IFA, CC BY)** for IAS 12, leases and EPS, after confirming the licence on the book's own copyright page. Keep the IFRS 18 flag (§C) in mind.
7. **Digital assets:** use S22 (ADAPT) and S23 (GROUND). Date-stamp all regulatory claims.
8. **Private capital:** use S25 (ADAPT) and S26/S27 (GROUND). These are 2024–2026, so the most current material in the corpus.
9. **Simulation:** use S4 + S5 (open licences), plus Excel/Sheets function docs, to match the 2027 Excel/Sheets emphasis.
10. **Derivatives pricing stays the weakest area.**
    - The plan's engine plus MIT 15.401 remain the only verified support.
    - Prioritise derivatives in Cycle 2.

### F. Next-cycle backlog (Cycle 2), prioritized

1. **Derivatives pricing (biggest gap).**
   - Check MIT OCW courses beyond 15.401/15.433 (e.g., 18.S096 and 15.450 lecture notes) for forwards, swaps, binomial and put–call parity with CC BY-NC-SA notes.
   - Check the Options Industry Council (optionseducation.org) and Cboe for terms.
   - Look for a CFTC educational PDF obtainable without a block.
   - Look for open-textbook derivatives chapters (LibreTexts / Pressbooks).
2. **Equity research reports and forecasting.**
   - CFA Institute Research Challenge written-report guidelines (official copy).
   - FINRA Rule 2241 and SEC Regulation AC (sell-side research conflicts).
   - Free sources on activist short sellers.
   - Open-licence financial-model walkthroughs.
3. **Financial reporting quality.**
   - SEC Non-GAAP C&DIs and AAER examples (public domain).
   - Confirm the IFRS 18 effective date and IASB summary on ifrs.org.
   - Determine whether L1 2027 FSA uses IFRS 18.
4. **Sovereign credit.** IMF/World Bank LIC-DSF guidance notes (check World Bank CC BY 3.0 IGO). User-saved S&P/Moody's/Fitch documents.
5. **Hedge funds / real estate.** Fed Financial Stability Report sections (public domain); SEC Form PF statistics; NCREIF/Nareit free primers (licence check).
6. **Confirm Medium licences in a browser or via the user:** S31 OECD, S29 World Bank, S35 Lyryx, S12 Ginnie Mae.
7. **Video map.** Check for 2027-labelled free playlists (FinQuiz, PrepNuggets, Kaplan free videos) using the YouTube Data API metadata only.
8. **Khan Academy finance & capital markets.** Per-item licence and coverage audit.
9. **Ken French Data Library** (factor data; terms) for the CAPM/factor module with real data.
10. **Resume paused Cycle 1 work only if re-authorised.** That means golden vectors from S7/S8 with independent recomputation, and the MCQ-validation literature review.

### G. Sources consulted this cycle (index)

All URLs above. Downloads are kept in the session scratchpad (`…/scratchpad/reliability/<source>/`), never in the repo. Licence and terms pages fetched this cycle:
- federalreserve.gov/disclaimer.htm
- bis.org/terms_conditions.htm
- ocw.mit.edu/pages/privacy-and-terms-of-use/
- eia.gov/about/copyrights_reuse.php
- ecb.europa.eu/home/disclaimer/html/index.en.html
- bankofengland.co.uk/legal
- openintro.org/license (via WebFetch)
- python-programming.quantecon.org/intro.html
- OpenStax repo LICENSE files via api.github.com / raw.githubusercontent.com

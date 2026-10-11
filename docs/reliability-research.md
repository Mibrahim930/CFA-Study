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

---

## Source Discovery — Cycle 2 (2026-10-10)

Cycle 1 was accepted by the supervisor. This cycle follows the supervisor's priority order. IDs continue from Cycle 1 (S50+). Conventions are unchanged. "Vector candidate" marks a worked numeric example to use as a test vector later; no vectors were built. I recomputed a few of these by hand and say so where I did.

### 2.1 Derivatives pricing (priority 1)

**Headline.**
- The best new find is the **Federal Reserve Board's *Trading and Capital-Markets Activities Manual*** (S50).
  - It is public domain.
  - It has instrument profiles with pricing sections for FX, forwards, FRAs, futures, interest rate swaps, options, currency swaps and swaptions.
- **No openly licensed derivatives-pricing textbook was found.**
  - I checked Open Textbook Library listings, the LibreTexts Finance shelf and the planned OpenStax Finance book.
  - The **Swaps**, **put–call–forward parity** and **cost-of-carry with benefits/costs (CFA notation)** modules still rely on the finance engine plus GROUND sources.

| # | Source (ID) | URL | Access | Licence (quoted) | Modules | Worked numeric examples? | Reuse | Conf. |
|---|---|---|---|---|---|---|---|---|
| 1 | **S50** Fed Board, *Trading and Capital-Markets Activities Manual*, section 4000 "Instrument Profiles": 4305 FX, 4310 Forwards, 4315 FRAs, 4320 Financial Futures, 4325 Interest-Rate Swaps, 4330 Options (incl. Black–Scholes), 4335 Currency Swaps (valued as PV of each leg), 4340 Swaptions, 4345 Equity Derivatives, 4350 Credit Derivatives, 4353 CLOs. Also 4105 ABS, 4110 RMBS, 4020 Treasuries, 4025 STRIPS | federalreserve.gov/publications/supervision_trading.htm; sections at federalreserve.gov/boarddocs/supmanual/trading/4000p1.pdf and 4000p2.pdf | Fetched (TOC, 4000p1, 4000p2) | Board: "Unless otherwise indicated, information on Board's website is in the public domain and may be copied and distributed without permission." | All 10 Derivatives modules; also ABS/MBS, Government Issuers, FX | **Yes, with errors** (all recomputed by me; see "Source arithmetic slips" below): IRP FX forward (4310), FRA implied forward and FRA settlement value (4315) | ADAPT | High (licence, content); **dated** (Feb 1998 / Apr 2003 pages; LIBOR, Eurodollar and DM examples) |
| 2 | **S51** MIT OCW 15.401 *Finance Theory I* (Fall 2008): Lecture 8 slides (forwards and futures), Lecture 10 slides (options), Recitation 4 "Forwards & Futures", Recitation 5 "Options", sample final exam and solutions | ocw.mit.edu/courses/15-401-finance-theory-i-fall-2008/ (pages/video-lectures-and-slides/…, pages/recitations/, pages/exams/) | Fetched | OCW terms: CC BY-NC-SA 4.0 (course level). Slides say "© 2007–2008 by Andrew W. Lo". **The problem-set collection PDF says "(For Course Use Only. All Rights Reserved.)", which conflicts with the course licence, so treat that file as GROUND.** | Forward Commitment & Contingent Claim Features; Cost of Carry; Futures (mark-to-market); Options; Put–Call Parity; One-Period Binomial | **Yes**, all checked: one-period call price by replication and by risk-neutral probability; a two-period European vs American put; futures-implied interest rates; a mark-to-market settlement example | ADAPT (slides, recitations); GROUND (problem-set PDF) | High |
| 3 | **S53** SOA Exam FAM, Sample Questions & Solutions for Topics 1–6 (dated July 17, 2026). The syllabus Topic 6 "Option Pricing Fundamentals" (2.5–7.5%) covers one-period binomial, Black–Scholes and put–call parity | soa.org/globalassets/assets/files/edu/2024/fall/solutions/2024-10-exam-fam-s-sample-solutions.pdf (linked from the 2026-10 FAM syllabus) | Fetched | SOA copyright notice | Put–Call Parity; Binomial; Options valuation | Yes, but only a handful of items (put–call parity and risk-neutral binomial solutions) | GROUND (numbers usable as vectors) | High |
| 4 | **S52** Richmond Fed, *Instruments of the Money Market* (1998): ch. 14 Money Market Futures, ch. 15 Options on Money Market Futures, ch. 16 OTC Interest Rate Derivatives (FRAs, swaps, caps/floors) | richmondfed.org/publications/research/special_reports/instruments_of_the_money_market (chapter_14/15/16.pdf) | Fetched (ch. 16, 28 pp) | © FRB Richmond. Not public domain (Reserve Banks are not federal agencies). Ch. 16 says it was "last updated in 1993" | FRAs; Swaps; Futures; Options on futures | Some (not extracted) | GROUND | High; **very dated** |
| 5 | **S57** OpenStax *Principles of Finance 2e* (already planned) | github.com/openstax/osbooks-principles-finance | Fetched (collection + module scan) | CC BY-NC-SA 4.0 (Cycle 1) | Ch. 20 "Risk Management and the Financial Manager" covers hedging with futures, forwards, options and swaps → Derivative Benefits, Risks & Uses. **New mapping:** ch. 18 "Financial Forecasting" → Equity "FS Forecasting in Equity Valuation" and FSA "Intro to FS Modeling" | None (ch. 20 modules have no example blocks; descriptive only) | ADAPT | High |
| 6 | **S54** CFTC, "Basics of Futures Trading" (HTML) | cftc.gov/LearnAndProtect/EducationCenter/FuturesMarketBasics/index.htm | Fetched | US federal work, so public domain (by statute; the CFTC disclaimer page returned 403) | Derivative Instrument & Market Features; Futures (margin, hedgers vs speculators) | No; consumer-level | ADAPT | High (content); Medium (PD by statute) |
| 7 | **S56** Cboe Options Institute | cboe.com/optionsinstitute/ | Fetched (page and terms) | Cboe terms: "You may view, print and download one copy of the Materials for your personal non-commercial use…" | Options; Option strategies | n/a | LINK | High |
| 8 | **S55** Options Industry Council (free courses) | optionseducation.org | Fetched (terms) | Terms: "Information available from the Services is owned, licensed or controlled by OCC or third parties." No reuse grant | Options basics | n/a | LINK | High |

**Negative results.** These are Medium confidence: search coverage, not proof of absence.
- The LibreTexts Finance shelf (12 books) has derivatives only in *Finance, Banking, and Money*, ch. 12. That book is CC BY-NC-SA 3.0, anonymous, and descriptive only.
- The OCW slug for 15.437 returns 404.
- 18.S096 and 15.450 are graduate stochastic-calculus courses, a poor fit for Level I. Not downloaded.
- The old SOA MFE derivatives sample PDFs return 404 (retired).

**Vector candidates noted (do not build yet).** My hand recomputations are marked ✓ (agrees) or ✗ (does not reproduce).
- S51 Recitation 5, binomial call:
  - Inputs: S₀ = 102, Su = 120, Sd = 90, 3-month rate 2%, K = 110.
  - Stated: hedge ratio 1/3; q = 0.468; C = 4.59.
  - ✓ q = (102×1.02 − 90)/30 = 0.468; C = 10×0.468/1.02 = 4.588.
- S51 sample final Q10, two-period put:
  - Inputs: S₀ = 100, u = 1.15, d = 0.90, r = 5% EAR, K = 100.
  - Stated: European 2.76; American 3.80.
  - ✓ European: q = 0.6, P = 0.16×19/1.05² = 2.757.
  - American recomputes to 3.81 (0.4×10/1.05 = 3.8095). The source truncates it; use tolerance.
- S51 sample final Q6, futures-implied rates from gold:
  - Inputs: spot 693; Dec-07 706.42; Jun-08 726.70; zero convenience yield.
  - Stated: 7.97% and 6.54% annualised.
  - ✓ (706.42/693)^4 − 1 = 7.97%; (726.7/693)^(4/3) − 1 = 6.54%.
- S51 Recitation 4: mark-to-market illustration. Futures agreed at 500, settles 495 at t = 1, 497 at T; seller earns 3/unit under both the forward and the futures. Conceptual vector.
- S50 §4310 IRP forward:
  - Inputs: DM/$ spot 1.3514, 180-day $ 5%, DM 10% (period rates, not annualised).
  - Stated F = 1.4156.
  - ✗ Recompute gives 1.41575 (rounds to 1.4158).
- S50 §4315 FRA:
  - Implied 6×12 rate from 6% (6-month) and 7% (12-month), stated 8.00%. The source uses annual compounding; recompute 8.01%. Under simple money-market convention it would be 7.77%, a **convention trap**.
  - Settlement value of a $10m 3×6 FRA (contract 6.00%, settlement 6.50%, 91/360 days), stated **$12,431.22**.
  - ✗ Recompute: 12,638.89 / (1 + 0.065×91/360) = **$12,434.58**.

**Source arithmetic slips (lesson for the pipeline).** Even T1 sources contain small arithmetic errors:
- Fed manual (S50): about 0.01–0.03%, in the IRP forward and FRA examples above.
- TI guidebook: two slips (Cycle 1).
- MIT final (S51): an answer truncated rather than rounded.

Every sourced vector needs an independent recomputation and a tolerance, and its notes field should record any disagreement.

**CFA-convention flags for derivatives content** (fix in prompts and rubrics):
1. **FX quote direction.** S50 writes F = S×(1+r_F)/(1+r_D), quoting FX as foreign units per domestic unit. CFA Level I uses price/base notation. The generator must normalise to CFA notation, or MCQs will invert the formula. (High, from reading S50.)
2. **Carry model.** S51 uses F = S(1 + r − y + c)^T with a net convenience yield. CFA Level I states F₀ = S₀(1+r)^T adjusted for the future value of benefits and costs (and the continuous form). The answers are numerically close but not identical. Pick one convention per item, and the engine must use the same one. (Medium.)
3. **Contango/backwardation.** S51 defines them relative to the carry-adjusted spot price. Many CFA-oriented texts compare futures with spot directly. Check the definition against CFA wording before generating items on it. (Medium.)
4. **Rate conventions.** Money-market (simple, ACT/360) and annual-compounding forward rates give different FRA rates (8.01% vs 7.77% above). Every FRA, swap or forward item must state its convention explicitly.
5. **LIBOR era.** S50, S52 and S51 are LIBOR-era. Relabel the reference rate as SOFR or a generic market reference rate (MRR), which matches ARRC (Cycle 1 S18).

### 2.2 IFRS 18 vs IAS 1 in 2027 Level I FSA (priority 2): verdict

**Verdict: 2027 Level I FSA almost certainly teaches the pre-IFRS 18 (IAS 1-based) presentation framework. IFRS 18 is not a 2027 Level I learning objective.** Confidence: **Medium-High**. I have not seen the curriculum text itself.

Evidence:
1. CFA Institute's official "Curriculum Changes for 2027" (Cycle 1, S41) lists substantive changes only to **Quant, Equities and Ethics**. FSA is not mentioned. (High; T1.)
2. In the 2027 LOS (`content/syllabus-2027.json`), the FSA statements use pre-IFRS 18 phrasing (High; read this session). Examples:
   - "contrast cash flow statements prepared under IFRS and US GAAP"
   - "describe presentation choices, including non-GAAP measures, that could be used to influence an analyst's opinion"
   - No LOS mentions operating profit as a required subtotal, income-statement categories, or management-defined performance measures (MPMs).
3. Three independent prep providers describe 2027 Level I FSA as unchanged, and none mentions IFRS 18 or IAS 1 (Medium):
   - IFT: "Seven out of the ten topics have no significant changes to their content." It also says FSA prerequisite readings are unchanged.
   - 300Hours (1 Sep 2026): major changes to three topics only, which are Quant, Equities and Ethics.
   - AnalystPrep (17 May 2026): older materials remain useful for FSA.
4. The IASB confirms IFRS 18 replaces IAS 1 and has an effective date of 1 January 2027. It adds two required subtotals, operating profit and profit before financing and income taxes, and requires MPM disclosure. (High: ifrs.org standard page and project page fetched; © IFRS Foundation, GROUND.)

The US side has the same timing. FASB **ASU 2024-03** (disaggregation of income-statement expenses, DISE) applies to annual periods beginning after 15 Dec 2026 (Medium; Deloitte DART summary). It is also not in the Level I LOS.

**Recommendation for lessons and the pipeline:**
- **Exam content:** teach the current curriculum framing, meaning IAS 1-era IFRS vs US GAAP presentation. No answer key may depend on IFRS 18-only rules: the required operating/investing/financing P&L categories, the two new subtotals, or MPM reconciliations.
- **Optional context:** add an "In the real world from 2027" callout, marked *not examinable at Level I (2027)*. It covers IFRS 18 subtotals and MPMs (which link naturally to the LOS on non-GAAP measures) and ASU 2024-03.
- **verify.ts:** add a currency gate. If an FSA item's stem, key or explanation mentions IFRS 18, "management-defined performance measure" or "operating category", quarantine it for human review. Tag FSA lessons with `standardsBasis: "IAS1-era"`.
- **Re-check triggers:** the CFA Institute 2028 curriculum-change notice, or the user registering (plan's "reconcile mode").

### 2.3 Equity research reports and forecasting (priority 3)

| # | Source (ID) | URL | Access | Licence | Modules | Reuse | Conf. |
|---|---|---|---|---|---|---|---|
| 1 | **S58** CFA Institute Research Challenge, *Written Report Guidelines* (2 pp) | cfainstitute.org/-/media/documents/support/research-challenge/challenge/rc-written-report-guidelines.pdf | Fetched | No notice on the PDF; CFA Institute content | **Equity Analyst Research Reports** | GROUND | High |
| 2 | **S59** FINRA Rule 2241 "Research Analysts and Research Reports" (rule text): sell-side research conflicts, firm research policies, disclosures. Effective 2015 per Regulatory Notice 15-30 | finra.org/rules-guidance/rulebooks/finra-rules/2241 | Fetched | "© 2026 FINRA. All Rights Reserved." | Equity Analyst Research Reports (sell-side vs buy-side); Ethics Std V/VI context | LINK / GROUND | High |
| 3 | **S60** SEC Regulation AC (analyst certification), 17 CFR §§242.500–505 | ecfr.gov/current/title-17/chapter-II/part-242 | eCFR page is JS-rendered; not read | US federal regulation, public domain | Equity Analyst Research Reports | ADAPT | Medium |
| 4 | **S61** SEC v. Andrew Left & Citron Capital, Litigation Release No. 26056 (26 Jul 2024). An activist short seller is alleged to have published Long/Short recommendations, then traded against them, and to have misrepresented independence. A parallel DOJ indictment exists | sec.gov/enforcement-litigation/litigation-releases/lr-26056 | **403** (sec.gov blocks undeclared automated clients). Details from search results | US federal work, public domain | Equity Analyst Research Reports (activist short sellers); Ethics II(B) market manipulation, V(B) communication | ADAPT (case facts) | Medium; **outcome not verified, so present as allegations only** |
| 5 | Form SHO / Rule 13f-2 (Cycle 1 §C) | — | — | — | Activist short sellers | — | Medium |

What S58 provides:
- Required report sections: Business Description; Industry Overview & Competitive Positioning; Investment Summary; Valuation; Financial Analysis; Investment Risks; ESG.
- A 100-point rubric: 5 / 10 / 15 / 20 / 20 / 15 / 15 for those sections in that order.
- Requirements: a front-page data block (recommendation, current and target price) and the independent-analyst perspective.
- This is a ready-made skeleton for the "elements of a detailed company research report" LOS.

**Forecasting** remains thin. The best open option is OpenStax Finance ch. 18 (S57), plus S1 (Five Forces/PESTEL) for revenue drivers. Backlog: open-licence three-statement-model walkthroughs.

### 2.4 Financial reporting quality (priority 4)

| # | Source (ID) | URL | Access | Licence | Modules | Reuse | Conf. |
|---|---|---|---|---|---|---|---|
| 1 | **S63** Dechow & Schrand, *Earnings Quality* (CFA Institute Research Foundation, 2004, 160 pp): earnings-management techniques, when it occurs, and monitors (directors, auditors, analysts) | rpc.cfainstitute.org/-/media/documents/book/rf-publication/2004/rf-v2004-n3-3927-pdf.pdf | Fetched | "© 2004 The Research Foundation of CFA Institute. All rights reserved." | **Financial Reporting Quality** | GROUND | High; dated examples |
| 2 | **S64** CFA Institute, *Bridging the Gap: Ensuring Effective Non-GAAP and Performance Reporting* (2016, 72 pp) | rpc.cfainstitute.org/-/media/documents/article/position-paper/bridging-the-gap-ensuring-non-gaap-and-performance-reporting.pdf | Fetched | "© 2016 CFA Institute. All rights reserved." | FRQ (non-GAAP presentation choices LOS); Income Statements | GROUND | High |
| 3 | **S65** SEC staff Non-GAAP Financial Measures C&DIs. Last substantive update Dec 2022 (questions 100.01, 100.04–100.06, 102.10) per Deloitte DART and Gibson Dunn | sec.gov Corporation Finance C&DI page (blocked to automated fetch) | 403 | Public domain | FRQ; Income Statements | ADAPT | Medium |
| 4 | **S66** SEC earnings-management cases | SEC press release 2022-64 (Rollins); others via search | 403 | Public domain | FRQ (earnings management, "beat by a penny") | ADAPT (facts) | Medium |
| 5 | **S67** IASB IFRS 18 standard page and project summary | ifrs.org/issued-standards/list-of-standards/ifrs-18-presentation-and-disclosure-in-financial-statements/ | Fetched | © IFRS Foundation | Context callout only (§2.2) | GROUND | High |

S66 cases in detail:
- **Rollins** (Apr 2022, $8m penalty): unsupported reserve reductions used to round EPS up to the next cent. This came from the SEC "EPS Initiative", which uses data analytics.
- **UPS** (Nov 2024, $45m): improper valuation of a business unit.

### 2.5 Sovereign credit (priority 5)

| # | Source (ID) | URL | Access | Licence | Modules | Reuse | Conf. |
|---|---|---|---|---|---|---|---|
| 1 | **S69** Cantor & Packer (1996), "Determinants and Impact of Sovereign Credit Ratings", FRBNY *Economic Policy Review* 2(2). Six key factors: per-capita income, GDP growth, inflation, external debt, level of economic development, default history | newyorkfed.org/medialibrary/media/research/epr/96v02n2/9610cant.pdf | Fetched (18 pp) | © FRBNY | **Credit Analysis for Government Issuers** | GROUND | High; dated but foundational |
| 2 | **S70** IMF–World Bank, *Guidance Note on the Bank-Fund Debt Sustainability Framework for Low Income Countries* (Feb 2018, 71 pp), plus a 2024 Supplement (climate, domestic debt, restructurings) | worldbank.org/content/dam/LIC%20DSF/Site%20File/assets/documentation/pp122617guidance-note-on-lic-dsf.pdf | Fetched | "© 2018 International Monetary Fund"; IMF terms allow no derivative works (Cycle 1) | Credit Analysis for Government Issuers (debt sustainability) | GROUND | High |
| 3 | **S71** IMF *Staff Guidance Note on the Sovereign Risk and Debt Sustainability Framework for Market Access Countries* (Aug 2022, PP/2022/039) | imf.org/en/Publications/Policy-Papers/Issues/2022/08/08/Staff-Guidance-Note-on-the-Sovereign-Risk-and-Debt-Sustainability-Framework-for-Market-521884 | **403** | IMF terms | Same | LINK | Medium |
| 4 | **S72** Scope Ratings *Sovereign Rating Methodology* (27 Jan 2025). A revision was proposed in Jan 2026; adoption not verified | scoperatings.com/governance-and-policies/rating-governance/methodologies | JS-only page; not read | Proprietary | Same | LINK | Medium |
| 5 | **S73** Fitch *Sovereign Rating Criteria* (revised; reportedly effective Sep 2025 with explicit recovery assumptions) | fitchratings.com (search "Sovereign Rating Criteria") | Not located | Proprietary | Same | LINK | Low |

### 2.6 Licence upgrades from Cycle 1

| Source | Cycle 1 | Now | Evidence |
|---|---|---|---|
| S35 Lyryx *Intermediate Financial Accounting* Vol 2 | Medium | **High** | See details below the table |
| S29 World Bank *PPP Reference Guide 3.0* | Medium | **High** (for the OKR copy) | OKR API metadata: `dc.rights` "CC BY 3.0 IGO", `dc.rights.uri` creativecommons.org/licenses/by/3.0/igo, 2017, DOI 10.1596/29052, rights holder World Bank. The ppp.worldbank.org PDF dated 2024 may be a different version, so use the OKR copy |
| S31 OECD *Corporate Governance Factbook 2025* | Medium | Medium (unchanged) | oecd.org still returns 403. The user should check the copyright page in a browser |
| S12 Ginnie Mae MBS Guide | Medium | Medium (unchanged) | ginniemae.gov's website-policies and privacy pages have no copyright statement. Public domain only by statute (government corporation within HUD) |

S35 Lyryx Vol 2 in detail:
- Read the PDF's own licence page this session. Source: the eCampusOntario repository, openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/892/3/ArnoldKyle-IntermFinAcct-Vol2-2021A.pdf; record dc.rights "CC BY | https://creativecommons.org/licenses/by/4.0/".
- The licence statement reads: "available under the Creative Commons license (CC BY), allowing anyone to reuse, revise, remix and redistribute". "Version 2021 — Revision A", 594 pp.
- Covers **IFRS 16** (25 mentions, right-of-use model) and IAS 12.
- **Caveat:** it also covers Canadian **ASPE**, which is not in the CFA syllabus. The generator must use the IFRS paragraphs only.

### 2.7 Blocked sites: exact URLs for the user to open manually

None of these were bypassed. The user can open each in a browser and, if wanted, save a copy outside the repo for private grounding.

| Source | URL |
|---|---|
| Moody's *Rating Symbols and Definitions* | https://ratings.moodys.com/api/rmc-documents/53954 |
| S&P *Guide to Credit Rating Essentials* (2024) | https://www.spglobal.com/_assets/documents/guide-to-credit-rating-essentials_2024.pdf |
| S&P *Sovereign Rating Methodology* | https://disclosure.spglobal.com/ratings/en/regulatory/article/-/view/sourceId/10221157 |
| Fitch *Sovereign Rating Criteria* | https://www.fitchratings.com/ (site search: "Sovereign Rating Criteria"; exact URL not located) |
| Scope *Sovereign Rating Methodology* | https://scoperatings.com/governance-and-policies/rating-governance/methodologies |
| OCC (Options Clearing Corp) *Characteristics and Risks of Standardized Options* | https://www.theocc.com/getmedia/a151a9ae-d784-4a15-bdeb-23a029f50b70/riskstoc.pdf |
| CME Group *Understanding Treasury Futures* | https://www.cmegroup.com/education/files/understanding-treasury-futures.pdf (education hub: https://www.cmegroup.com/education.html) |
| Fannie Mae *Basics of Fannie Mae Single-Family MBS* | https://capitalmarkets.fanniemae.com/media/4271/display |
| OECD *Corporate Governance Factbook 2025* | https://www.oecd.org/en/publications/oecd-corporate-governance-factbook-2025_f4f43735-en.html |
| IMF SRDSF MAC guidance note (2022) | https://www.imf.org/en/Publications/Policy-Papers/Issues/2022/08/08/Staff-Guidance-Note-on-the-Sovereign-Risk-and-Debt-Sustainability-Framework-for-Market-521884 |
| SEC v. Left (LR-26056) | https://www.sec.gov/enforcement-litigation/litigation-releases/lr-26056 |
| SEC Rollins EPS case (PR 2022-64) | https://www.sec.gov/news/press-release/2022-64 |

About sec.gov:
- SEC's published fair-access policy asks automated clients to declare a User-Agent containing contact details.
- That would mean sending the user's contact information. I did not do it.
- The engineer may configure it later, but only with the user's consent.

### 2.8 Cycle 2 recommendations (ranked by reliability impact)

1. **Make S50 (Fed trading manual, public domain) the ADAPT backbone for derivatives instrument features and pricing descriptions.**
   - Modernise LIBOR/DM examples to SOFR/EUR.
   - Never copy its example numbers as answer keys without recomputation, because two of its examples do not reproduce.
2. **Add the IFRS 18 currency gate (§2.2)** to verify.ts and tag FSA lessons `IAS1-era`. IFRS 18 appears only in a non-examinable callout.
3. **Use S51 (MIT 15.401) recitations and exam** as the derivatives teaching and worked-example layer. Four vector candidates have already been hand-checked.
4. **Encode the five derivatives convention flags (§2.1)** in the generation prompt and grader rubric: FX quote direction, carry form, contango wording, rate convention, MRR not LIBOR.
5. **Ingest Lyryx Vol 2 (now High, CC BY 4.0)** as the ADAPT source for IAS 12, IFRS 16, EPS and cash flows, with an ASPE filter.
6. **Equity research reports:** use the S58 report skeleton and rubric, S59/S60 for sell-side conflict rules, and S61 as the activist-short-seller case (presented as allegations).
7. **FRQ:** S63/S64 as GROUND, plus SEC EPS-Initiative cases (public domain) as case vignettes.
8. **Sovereign credit:** S69 for rating determinants and S70 for debt-sustainability logic. Ask the user to save one agency sovereign methodology manually.
9. **Vector policy:** every sourced vector carries `sourceStated`, `recomputed`, `tolerance` and `agree` fields. Cycles 1–2 found arithmetic slips in three "authoritative" sources.

### 2.9 Proposed Cycle 3 backlog

1. **Swaps and put–call–forward parity with discount-factor worked examples:**
   - Fed Board FEDS Notes or NY Fed swap explainers.
   - BIS Quarterly Review swap features (BIS terms allow non-commercial redistribution).
   - SOA FM sample items on swaps (none were found in the FM extract; check FAM-L).
2. **CFA-convention reference check.** Collect CFA Institute free materials or sample items that show the exact derivatives notation, so the five §2.1 flags are settled from T1 rather than inferred.
3. **FS forecasting and modelling:** open-licence three-statement-model walkthroughs (OpenStax Finance ch. 18 depth check; LibreTexts/Pressbooks accounting).
4. **Hedge funds and real estate:** Fed Financial Stability Report sections (public domain); SEC Form PF statistics; Nareit/NCREIF primers (licence check).
5. **Verify sec.gov facts** for S61, S65 and S66 once a compliant access method is approved, or have the user open them.
6. **Re-check OECD Factbook and Ginnie Mae licences** via the user.

## Past-curriculum transfer map (2026-10-10)
Context: the user decided that 2026-curriculum material is acceptable until they register (see PLAN.md §2.0 item 7). This section records which past-year resources transfer to the 2027 syllabus. It was produced by an Opus research subagent; the parent session re-checked the key claim independently.

### Verified by the parent session
Text was extracted with our own pdf.js reader from the official **2026 L1 topic outline** (`cfainstitute.org/sites/default/files/docs/programs/cfa-program/2026-l1-topics-combined.pdf`, marked "For candidate use only"). Each 2027 LOS in `content/syllabus-2027.json` was then checked for a verbatim match:

| Topic | 2027 LOS found verbatim in 2026 | Transfer |
|---|---|---|
| Economics, Corporate Issuers, FSA, Fixed Income, Derivatives, Alternatives, Portfolio Mgmt | 240/240 | **Clean.** 2026-labelled videos, notes and question banks map module-for-module. |
| Ethics | 31/33 (only the two general "Code and Standards" LOS differ) | Near-clean. 2025+ material uses the current Standards. |
| Quant | 1/30 | **Rewritten for 2027.** Remap 2026 material topic by topic. |
| Equity | 4/37 | **Rewritten for 2027.** Market organization and market efficiency were removed; jurisdictions, forecasting, FCFF/RI and PESTLE were added. |

### Reported by the subagent (primary pages read; not re-checked by the parent)
- **Weights.** The 2024–2026 weights were the same. 2027 changed Ethics (15–20 → 10–15), Quant (6–9 → 11–14), Derivatives (5–8 → 6–9) and Alternatives (7–10 → 6–9).
- **Ethics.** The 2025 curriculum added the 2023 revisions to the Code and Standards (effective 1 Jan 2024: new I(E) Competence, revised V(B), VI(A) renamed). **2024-and-earlier Ethics material does not transfer.** GIPS was removed from L1 in 2027.
- **Corporate Issuers, Fixed Income, Alternatives.** These were rewritten in 2024, so pre-2024 material for them does not transfer.
- **Free resources worth considering.** These are use-on-their-site only (mode c); none may be ingested or used for AI training:
  - FreeFellow free L1 QBank (2026; its terms prohibit AI training);
  - IFT 1-year free trial;
  - FinQuiz free Quant questions;
  - AnalystPrep free web notes;
  - the CFA Institute Ethics Learning Lab (free; needs a CFA Institute account).
- **Grounding candidates** (private grounding only, mode b):
  - the 2026 outline;
  - the 2025 Curriculum Changes Guidebook;
  - the 2023 Standards-revision summary.
- **Open textbook.** Lyryx *Introduction to Financial Accounting* (2024, IFRS). It is catalogued CC BY-NC-SA; confirm on the book's own copyright page before adapting.
- **Avoid:**
  - redistributed curriculum PDFs, mocks or refresher readings;
  - unlicensed Anki or GitHub decks;
  - pre-2024 video series for Corporate Issuers, Fixed Income and Alternatives;
  - 2024 Ethics material;
  - the 300Hours claim that the 2027 weights are unchanged (it is wrong).
- **Could not reach** (for the user to open):
  - prepnuggets.com/2027-cfa-level-i-updates/;
  - the CFA prep-provider directory;
  - the 2024 and 2025 L1 outlines (404 live);
  - the 2024 Member Guide;
  - finquiz.com/terms/.

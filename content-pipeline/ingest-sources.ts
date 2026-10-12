/**
 * Download and chunk the free PDF sources that cover topics OpenStax doesn't
 * (Ethics, Alternatives, Fixed Income, Derivatives, FSA quality, Portfolio).
 *   npm run ingest:sources              all sources
 *   npm run ingest:sources -- --only cfa-sop-handbook-12
 * PDFs go to sources/docs/<id>/ and chunks to sources/corpus/<id>.jsonl (both git-ignored).
 *
 * reuse "ground" = all rights reserved: read privately as grounding only, never reproduced (the copy guard
 * enforces this). reuse "adapt" = public domain or open licence: may be adapted with attribution.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { SourceChunk } from "../lib/kb/types";
import { chunkPages, pageLocator } from "./lib/chunk-pages";
import { htmlTitle, htmlToText } from "./lib/html-text";
import { extractPdfPages, fetchSource } from "./lib/pdf-text";

export interface SourceDef {
  id: string;
  title: string;
  url: string;
  source: SourceChunk["source"];
  tier: SourceChunk["tier"];
  license: string;
  reuse: SourceChunk["reuse"];
  topics: string[];
  year: number;
  /** "pdf" (default) downloads `url` as a PDF; "html" downloads each of `urls` as a web page and extracts its text. */
  kind?: "pdf" | "html";
  /** html only: the page URLs to ingest (`url` is then the primary page and must equal urls[0]). */
  urls?: string[];
}

const CFA = "© CFA Institute. All rights reserved (free public PDF)";
const PD = "Public domain (U.S. government work)";

const LYRYX = "CC BY 4.0 (book copyright page: \"available under the Creative Commons license (CC BY)\")";
const FEDPD = "Public domain (Federal Reserve Board: information on the Board's website is in the public domain unless otherwise indicated)";
const OCW = "CC BY-NC-SA 4.0 (MIT OpenCourseWare; slides \"© 2007–2008 by Andrew W. Lo\")";
const OCW_BASE = "https://ocw.mit.edu/courses/15-401-finance-theory-i-fall-2008";
const OCW_ALL = ["corpfin", "fixed-income", "equity", "derivatives", "portfolio"];
// OCW file names carry a content hash, so they are listed from the course's own download page.
const OCW_FILES: Record<string, string> = {
  lec01: "6445d784e4bacb5a5b0fee96716bc084_MIT15_401F08_lec01.pdf", lec04: "df418b972d36cd53ae5c375b8af61e53_MIT15_401F08_lec04.pdf",
  lec07: "1aea40b063cad5a335e980ecf30d84b7_MIT15_401F08_lec07.pdf", lec08: "a66f697aaeb23b8cfd2bda020172feb5_MIT15_401F08_lec08.pdf",
  lec10: "c40ecc0cc0dce0fbf2d229bc4027c43b_MIT15_401F08_lec10.pdf", lec12: "637f2121ff813c0385c42c8f7d376761_MIT15_401F08_lec12.pdf",
  lec13: "dd628e151309a7f23962b1a31b9356e5_MIT15_401F08_lec13.pdf", lec18: "06b2ce70ad26ae3d3be8d94145495be6_MIT15_401F08_lec18.pdf",
  lec21: "ce45c66100cf852cb9ac8ce41f931341_MIT15_401F08_lec21.pdf", rec01: "7fd4ce059d9bd0086fc9b50e3cd99540_MIT15_401F08_rec01.pdf",
  rec02: "7437599950b0d45bfa3a4c4a3af00a3f_MIT15_401F08_rec02.pdf", rec03: "1c18f475f4a9236d92521c0e6606f27b_MIT15_401F08_rec03.pdf",
  rec04: "a82f353a447437317e3762d51d572558_MIT15_401F08_rec04.pdf", rec05: "d0734e7fec7b333f1255a6dc3dff389c_MIT15_401F08_rec05.pdf",
  rec06: "afd942e9eab1c6e9e2da35d37a978523_MIT15_401F08_rec06.pdf", rec07: "ecfe2e9d4bba810207c1fefcb216a852_MIT15_401F08_rec07.pdf",
  rec08: "9762eeb6e5ddad7fb5cf78b235ccba35_MIT15_401F08_rec08.pdf", summary: "55322b0a932baa9a97c5603eeab0d766_MIT15_401F08_summary.pdf",
  review_mid: "ebd2475a5012fed087965c776cef84d0_MIT15_401F08_review_mid.pdf", review_fin: "d28223e0ac8822df9538f33b1542881e_MIT15_401F08_review_fin.pdf",
  midterm: "d06836b650ba4d4b3e8e1d6e2ed0b43f_MIT15_401F08_midterm.pdf", midterm_sol: "0c0d8c56431c697295bea540e555336b_MIT15_401F08_midterm_sol.pdf",
  final: "f8870d5f537f04e75e7ecc243416e02a_MIT15_401F08_final.pdf", final_sol: "984300de6e683683f0924ff450cc51ee_MIT15_401F08_final_sol.pdf",
};

export const SOURCES: SourceDef[] = [
  // Ethics
  { id: "cfa-sop-handbook-12", title: "Standards of Practice Handbook, 12th ed.", year: 2024, source: "cfa-handbook", tier: "T1", license: CFA, reuse: "ground", topics: ["ethics"],
    url: "https://www.cfainstitute.org/sites/default/files/-/media/documents/code/code-ethics-standards/standards-practice-handbook-12th-edition.pdf" },
  { id: "cfa-ethical-framework", title: "CFA Institute Ethical Decision-Making Framework", year: 2020, source: "cfa-handbook", tier: "T1", license: CFA, reuse: "ground", topics: ["ethics"],
    url: "https://www.cfainstitute.org/sites/default/files/-/media/documents/support/ethics/ethical-framework-guide.pdf" },
  // Alternatives
  { id: "cfa-rf-alt-primer", title: "Alternative Investments: A Primer for Investment Professionals (CFA Institute Research Foundation)", year: 2018, source: "cfa-rf", tier: "T1", license: CFA, reuse: "ground", topics: ["alternatives", "portfolio"],
    url: "https://rpc.cfainstitute.org/sites/default/files/-/media/documents/book/rf-publication/2018/rf-v2018-n1-1.pdf" },
  { id: "cfa-rf-alt-credit", title: "An Introduction to Alternative Credit (CFA Institute Research Foundation)", year: 2024, source: "cfa-rf", tier: "T1", license: CFA, reuse: "ground", topics: ["alternatives", "fixed-income"],
    url: "https://rpc.cfainstitute.org/sites/default/files/-/media/documents/article/rf-brief/introduction-to-alt-credit.pdf" },
  { id: "fed-money-payments", title: "Money and Payments: The U.S. Dollar in the Age of Digital Transformation (Federal Reserve)", year: 2022, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["alternatives"],
    url: "https://www.federalreserve.gov/publications/files/money-and-payments-20220120.pdf" },
  // Portfolio management
  { id: "cfa-rf-behavioral", title: "Behavioral Finance: The Second Generation (Statman, CFA Institute Research Foundation)", year: 2019, source: "cfa-rf", tier: "T1", license: CFA, reuse: "ground", topics: ["portfolio"],
    url: "https://rpc.cfainstitute.org/sites/default/files/-/media/documents/book/rf-publication/2019/behavioral-finance-the-second-generation.pdf" },
  { id: "cfa-ips-individual", title: "Elements of an Investment Policy Statement for Individual Investors (CFA Institute)", year: 2010, source: "cfa-handbook", tier: "T1", license: CFA, reuse: "ground", topics: ["portfolio"],
    url: "https://rpc.cfainstitute.org/sites/default/files/-/media/documents/article/position-paper/investment-policy-statement-individual-investors.pdf" },
  { id: "cfa-ips-institutional", title: "Elements of an Investment Policy Statement for Institutional Investors (CFA Institute)", year: 2010, source: "cfa-handbook", tier: "T1", license: CFA, reuse: "ground", topics: ["portfolio"],
    url: "https://rpc.cfainstitute.org/sites/default/files/-/media/documents/article/position-paper/investment-policy-statement-institutional-investors.pdf" },
  // Financial statement analysis
  { id: "cfa-rf-earnings-quality", title: "Earnings Quality (Dechow & Schrand, CFA Institute Research Foundation)", year: 2004, source: "cfa-rf", tier: "T1", license: CFA, reuse: "ground", topics: ["fsa"],
    url: "https://rpc.cfainstitute.org/sites/default/files/-/media/documents/book/rf-publication/2004/rf-v2004-n3-3927-pdf.pdf" },
  { id: "cfa-nongaap", title: "Bridging the Gap: Ensuring Effective Non-GAAP and Performance Reporting (CFA Institute)", year: 2016, source: "cfa-handbook", tier: "T1", license: CFA, reuse: "ground", topics: ["fsa"],
    url: "https://rpc.cfainstitute.org/sites/default/files/-/media/documents/article/position-paper/bridging-the-gap-ensuring-non-gaap-and-performance-reporting.pdf" },
  // Quant (data science)
  { id: "cfa-rf-ai-bigdata", title: "Handbook of AI and Big Data Applications in Investments (CFA Institute Research Foundation)", year: 2023, source: "cfa-rf", tier: "T1", license: CFA, reuse: "ground", topics: ["quant"],
    url: "https://rpc.cfainstitute.org/sites/default/files/-/media/documents/article/rf-brief/ai-and-big-data-in-investments.pdf" },
  // Derivatives and fixed income
  { id: "fed-trading-4000-p1", title: "Trading and Capital-Markets Activities Manual §4000, Instrument Profiles part 1 (Federal Reserve)", year: 2001, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["derivatives", "fixed-income", "econ"],
    url: "https://www.federalreserve.gov/boarddocs/supmanual/trading/4000p1.pdf" },
  { id: "fed-trading-4000-p2", title: "Trading and Capital-Markets Activities Manual §4000, Instrument Profiles part 2 (Federal Reserve)", year: 2001, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["derivatives", "fixed-income", "econ"],
    url: "https://www.federalreserve.gov/boarddocs/supmanual/trading/4000p2.pdf" },
  { id: "occ-asset-securitization", title: "Comptroller's Handbook: Asset Securitization (OCC)", year: 1997, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fixed-income"],
    url: "https://www.occ.gov/publications-and-resources/publications/comptrollers-handbook/files/asset-securitization/pub-ch-asset-securitization.pdf" },
  { id: "occ-rating-credit-risk", title: "Comptroller's Handbook: Rating Credit Risk (OCC)", year: 2017, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fixed-income", "corpfin"],
    url: "https://www.occ.gov/publications-and-resources/publications/comptrollers-handbook/files/rating-credit-risk/pub-ch-rating-credit-risk.pdf" },
  { id: "arrc-sofr-guide", title: "A User's Guide to SOFR (Alternative Reference Rates Committee)", year: 2019, source: "gov", tier: "T1", license: "© ARRC / Federal Reserve Bank of New York", reuse: "ground", topics: ["fixed-income", "derivatives"],
    url: "https://www.newyorkfed.org/medialibrary/Microsites/arrc/files/2019/Users_Guide_to_SOFR.pdf" },
  { id: "nyfed-securitization", title: "Understanding the Securitization of Subprime Mortgage Credit (FRBNY Staff Report 318)", year: 2008, source: "gov", tier: "T1", license: "© Federal Reserve Bank of New York", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr318.pdf" },
  { id: "nyfed-sovereign-ratings", title: "Determinants and Impact of Sovereign Credit Ratings (Cantor & Packer, FRBNY EPR)", year: 1996, source: "gov", tier: "T1", license: "© Federal Reserve Bank of New York", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.newyorkfed.org/medialibrary/media/research/epr/96v02n2/9610cant.pdf" },
  // Equity
  { id: "cfa-research-challenge", title: "CFA Institute Research Challenge: Written Report Guidelines", year: 2025, source: "cfa-handbook", tier: "T1", license: CFA, reuse: "ground", topics: ["equity"],
    url: "https://www.cfainstitute.org/sites/default/files/-/media/documents/support/research-challenge/challenge/rc-written-report-guidelines.pdf" },
  // Financial statement analysis: open textbook (CC BY). The lyryx.com host no longer resolves in DNS, so this is
  // the identical 2021A PDF served from eCampusOntario's open library (record 123456789/892).
  { id: "lyryx-ifa-vol2", title: "Intermediate Financial Accounting, Volume 2, 2021A (Arnold & Kyle, Lyryx / Athabasca University)", year: 2021, source: "other", tier: "T2", license: LYRYX, reuse: "adapt", topics: ["fsa"],
    url: "https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/892/3/ArnoldKyle-IntermFinAcct-Vol2-2021A.pdf" },
  { id: "lyryx-intro-fa-2021a", title: "Introduction to Financial Accounting, 2021A (Dauderis & Annand, Lyryx / Athabasca University)", year: 2021, source: "other", tier: "T2", license: "CC BY-NC-SA 3.0 (book copyright page: \"available under the Creative Commons license (CC BY-NC-SA)\", linked to creativecommons.org/licenses/by-nc-sa/3.0/)", reuse: "adapt", topics: ["fsa"],
    url: "https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/890/3/DauderisAnnand-IntroFinAcct-2021A.pdf" },
  // Economics: open textbook republished by Saylor (archived Flat World Knowledge PDF), linked from the Open Textbook Library record.
  { id: "suranovic-intl-finance", title: "International Finance: Theory and Policy (Suranovic, 2010; Saylor Foundation edition)", year: 2010, source: "other", tier: "T2", license: "CC BY-NC-SA 3.0 (book front matter: \"This book is licensed under a Creative Commons by-nc-sa 3.0 license\")", reuse: "adapt", topics: ["econ"],
    url: "https://2012books.lardbucket.org/pdfs/policy-and-theory-of-international-finance.pdf" },
  // Fixed income
  { id: "fed-feds-2006-28", title: "The U.S. Treasury Yield Curve: 1961 to the Present (Gürkaynak, Sack & Wright, FEDS 2006-28)", year: 2006, source: "gov", tier: "T1", license: FEDPD, reuse: "adapt", topics: ["fixed-income", "econ"],
    url: "https://www.federalreserve.gov/pubs/feds/2006/200628/200628pap.pdf" },
  { id: "nyfed-tba-trading", title: "TBA Trading and Liquidity in the Agency MBS Market (Vickery & Wright, FRBNY Economic Policy Review)", year: 2013, source: "gov", tier: "T1", license: "© Federal Reserve Bank of New York", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.newyorkfed.org/medialibrary/media/research/epr/2013/1212vick.pdf" },
  { id: "imf-wb-lic-dsf-2018", title: "Guidance Note on the Bank-Fund Debt Sustainability Framework for Low Income Countries (IMF and World Bank staff)", year: 2018, source: "other", tier: "T1", license: "© International Monetary Fund and World Bank; not an open licence (private grounding only)", reuse: "ground", topics: ["fixed-income", "econ"],
    url: "https://www.worldbank.org/content/dam/LIC%20DSF/Site%20File/assets/documentation/pp122617guidance-note-on-lic-dsf.pdf" },
  // Alternatives
  { id: "cfa-rf-private-credit-2026", title: "Private Credit: Market Structure, Fund Design, and Retail Access (CFA Institute, 2026)", year: 2026, source: "cfa-rf", tier: "T1", license: CFA, reuse: "ground", topics: ["alternatives", "fixed-income"],
    url: "https://rpc.cfainstitute.org/sites/default/files/docs/research-reports/rpc_private-credit_marketstructure-funddesign-andretailaccess_online.pdf" },
  { id: "cfa-rf-private-markets-growth", title: "Understanding the Growth of Private Markets (CFA Institute, 2026)", year: 2026, source: "cfa-rf", tier: "T1", license: CFA, reuse: "ground", topics: ["alternatives"],
    url: "https://rpc.cfainstitute.org/sites/default/files/docs/research-reports/fti-macro_growth-of-private-markets_online.pdf" },
  // Equity and portfolio: ETFs
  { id: "cfa-rf-etf-module1", title: "A Comprehensive Guide to ETFs, 2nd ed., Module 1: ETF Features and Evolving Landscape (CFA Institute Research Foundation)", year: 2025, source: "cfa-rf", tier: "T1", license: CFA, reuse: "ground", topics: ["equity", "portfolio"],
    url: "https://rpc.cfainstitute.org/sites/default/files/docs/research-reports/hill_rf_brief_2025_etfs-evolving_module-1_2ed_online.v2.pdf" },
  { id: "cfa-rf-etf-module2", title: "A Comprehensive Guide to ETFs, 2nd ed., Module 2: Evaluating ETFs (CFA Institute Research Foundation)", year: 2026, source: "cfa-rf", tier: "T1", license: CFA, reuse: "ground", topics: ["equity", "portfolio"],
    url: "https://rpc.cfainstitute.org/sites/default/files/docs/research-reports/rf_etfs_module2_evaluatingetfs_online.pdf" },
  // Derivatives: Richmond Fed (not public domain) and Chicago Fed (copyrighted)
  ...[
    [14, "Money Market Futures"],
    [15, "Options on Money Market Futures"],
    [16, "Over-the-Counter Interest Rate Derivatives"],
  ].map(([n, t]): SourceDef => ({
    id: `richmondfed-money-market-ch${n}`, title: `Instruments of the Money Market, ch. ${n}: ${t} (Federal Reserve Bank of Richmond)`, year: 1998, source: "gov", tier: "T1",
    license: "Federal Reserve Bank of Richmond publication; no open licence stated and not public domain (Reserve Banks are not federal agencies), so treated as all rights reserved", reuse: "ground", topics: ["derivatives", "fixed-income"],
    url: `https://www.richmondfed.org/-/media/richmondfedorg/publications/research/special_reports/instruments_of_the_money_market/pdf/chapter_${n}.pdf`,
  })),
  ...[
    ["1-derivatives-overview", "ch. 1: Derivatives Overview", 2013],
    ["2-central-counterparty-clearing", "ch. 2: Central Counterparty Clearing", 2014],
    ["3-over-the-counter-derivatives", "ch. 3: Over-the-Counter Derivatives", 2014],
    ["4-hedging", "ch. 4: Hedging", 2014],
  ].map(([slug, t, y]): SourceDef => ({
    id: `chicagofed-derivatives-${String(slug).slice(0, 1)}`, title: `Understanding Derivatives: Markets and Infrastructure, ${t} (Federal Reserve Bank of Chicago)`, year: y as number, source: "gov", tier: "T1",
    license: `Federal Reserve Bank of Chicago, © ${y} (printed on every page); all rights reserved`, reuse: "ground", topics: ["derivatives"],
    url: `https://www.chicagofed.org/-/media/publications/understanding-derivatives/understanding-derivatives-chapter-${slug}-pdf.pdf`,
  })),
  // MIT OpenCourseWare 15.401 Finance Theory I (Fall 2008): slides, recitations, sample exams. The problem-set PDF is
  // deliberately omitted (marked "For Course Use Only. All Rights Reserved.").
  ...(
    [
      ["lec01", "Lecture 1: Introduction and Course Overview", ["corpfin", "quant"]],
      ["lec04", "Lectures 4-6: Fixed-Income Securities", ["fixed-income", "quant"]],
      ["lec07", "Lecture 7: Equities", ["equity"]],
      ["lec08", "Lectures 8-9: Forward and Futures Contracts", ["derivatives"]],
      ["lec10", "Lectures 10-11: Options", ["derivatives"]],
      ["lec12", "Lecture 12: Introduction to Risk and Return", ["portfolio"]],
      ["lec13", "Lectures 13-14: Risk Analytics and Portfolio Theory", ["portfolio", "quant"]],
      ["lec18", "Lectures 18-20: Capital Budgeting", ["corpfin"]],
      ["lec21", "Lecture 21: Efficient Markets", ["equity", "portfolio"]],
      ["rec01", "Recitation 1: Present Value", ["quant"]],
      ["rec02", "Recitation 2: Fixed-Income Securities", ["fixed-income"]],
      ["rec03", "Recitation 3: Common Stocks", ["equity"]],
      ["rec04", "Recitation 4: Forwards and Futures", ["derivatives"]],
      ["rec05", "Recitation 5: Options", ["derivatives"]],
      ["rec06", "Recitation 6: Portfolio Choice", ["portfolio"]],
      ["rec07", "Recitation 7: CAPM", ["portfolio"]],
      ["rec08", "Recitation 8: Capital Budgeting", ["corpfin"]],
      ["summary", "Course Summary", OCW_ALL],
      ["review_mid", "Midterm Review Session", OCW_ALL],
      ["review_fin", "Final Exam Review Session", OCW_ALL],
      ["midterm", "Sample Midterm Examination", OCW_ALL],
      ["midterm_sol", "Sample Midterm Examination: Solutions", OCW_ALL],
      ["final", "Sample Final Examination", OCW_ALL],
      ["final_sol", "Sample Final Examination: Solutions", OCW_ALL],
    ] as [string, string, string[]][]
  ).map(([k, t, topics]): SourceDef => ({
    id: `mit-ocw-15401-${k}`, title: `MIT OpenCourseWare 15.401 Finance Theory I (Fall 2008, A. Lo): ${t}`, year: 2008, source: "mit-ocw", tier: "T2",
    license: OCW, reuse: "adapt", topics,
    url: `${OCW_BASE}/${OCW_FILES[k]}`,
  })),
  // Gap-closing pass (2026-10-11): sources chosen for the LOS the coverage audit marked "none" (see docs/missing-sources.md).
  // US federal government work (public domain, ADAPT)
  { id: "fed-gpr-ifdp1222", title: "Measuring Geopolitical Risk (Caldara & Iacoviello, Federal Reserve Board IFDP 1222)", year: 2018, source: "gov", tier: "T1", license: FEDPD, reuse: "adapt", topics: ["econ", "portfolio"],
    url: "https://www.federalreserve.gov/econres/ifdp/files/ifdp1222.pdf" },
  { id: "nist-ir-8202", title: "Blockchain Technology Overview (NIST Interagency Report 8202)", year: 2018, source: "gov", tier: "T1", license: "Public domain (U.S. government work, 17 U.S.C. 105; NIST publications are not subject to copyright in the United States)", reuse: "adapt", topics: ["alternatives"],
    url: "https://nvlpubs.nist.gov/nistpubs/ir/2018/NIST.IR.8202.pdf" },
  { id: "ofr-asset-management", title: "Asset Management and Financial Stability (Office of Financial Research, U.S. Treasury)", year: 2013, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["portfolio"],
    url: "https://www.financialresearch.gov/reports/files/ofr_asset_management_and_financial_stability.pdf" },
  { id: "occ-corporate-risk-governance", title: "Comptroller's Handbook: Corporate and Risk Governance, v2.0 (OCC)", year: 2019, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["portfolio", "corpfin"],
    url: "https://www.occ.gov/publications-and-resources/publications/comptrollers-handbook/files/corporate-risk-governance/pub-ch-corporate-risk.pdf" },
  { id: "occ-investment-securities", title: "Comptroller's Handbook: Investment Securities, Section 203 (OCC; 1990 text, reputation-risk references struck in 2025)", year: 1990, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fixed-income"],
    url: "https://www.occ.gov/publications-and-resources/publications/comptrollers-handbook/files/investment-securities/pub-ch-investment-securities.pdf" },
  { id: "occ-liquidity", title: "Comptroller's Handbook: Liquidity, v1.2 (OCC)", year: 2023, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fixed-income", "corpfin"],
    url: "https://www.occ.gov/publications-and-resources/publications/comptrollers-handbook/files/liquidity/pub-ch-liquidity.pdf" },
  { id: "occ-interest-rate-risk", title: "Comptroller's Handbook: Interest Rate Risk (OCC)", year: 2020, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fixed-income", "portfolio"],
    url: "https://www.occ.gov/publications-and-resources/publications/comptrollers-handbook/files/interest-rate-risk/pub-ch-interest-rate-risk.pdf" },
  { id: "treasury-covered-bonds", title: "Best Practices for Residential Covered Bonds (U.S. Department of the Treasury)", year: 2008, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fixed-income"],
    url: "https://home.treasury.gov/system/files/2011/USCoveredBondBestPractices.pdf" },
  // Financial Stability Board (free to read; all rights reserved, GROUND)
  { id: "fsb-crypto-2022", title: "Assessment of Risks to Financial Stability from Crypto-assets (Financial Stability Board)", year: 2022, source: "other", tier: "T1", license: "© Financial Stability Board; free to read, not an open licence (private grounding only)", reuse: "ground", topics: ["alternatives", "econ"],
    url: "https://www.fsb.org/wp-content/uploads/P160222.pdf" },
  { id: "fsb-ai-ml-2017", title: "Artificial Intelligence and Machine Learning in Financial Services (Financial Stability Board)", year: 2017, source: "other", tier: "T1", license: "© Financial Stability Board; free to read, not an open licence (private grounding only)", reuse: "ground", topics: ["quant", "portfolio"],
    url: "https://www.fsb.org/wp-content/uploads/P011117.pdf" },
  // IMF/World Bank public debt management guidelines accompanying document (copy hosted by the Czech Ministry of Finance)
  { id: "imf-wb-debt-mgmt-2002", title: "Guidelines for Public Debt Management: Accompanying Document (IMF and World Bank staff, Nov 2002; copy hosted by the Czech Ministry of Finance)", year: 2002, source: "other", tier: "T1", license: "© International Monetary Fund and World Bank; not an open licence (private grounding only)", reuse: "ground", topics: ["fixed-income", "econ"],
    url: "https://www.mfcr.cz/assets/en/media/IMF-WB-Guidelines-for-Public-Debt-Management-Accompanying-Document-November-2002.pdf" },
  // Index and industry classification methodology (free to read, ground)
  { id: "msci-gics-methodology", title: "GICS Methodology 2023 (MSCI and S&P Dow Jones Indices)", year: 2023, source: "other", tier: "T1", license: "© MSCI Inc. and S&P Global; free to read, all rights reserved (private grounding only)", reuse: "ground", topics: ["equity"],
    url: "https://www.msci.com/documents/1296102/11185224/GICS+Methodology+2023.pdf" },
  // Damodaran, Investment Valuation 2nd ed. (Wiley, 2002): chapters posted free on the author's site; copyright Wiley, so GROUND.
  ...(
    [
      [5, "Option Pricing Theory and Models", ["derivatives", "equity"]],
      [9, "Measuring Earnings (R&D, operating leases, one-time items, adjusted earnings)", ["fsa", "equity"]],
      [10, "From Earnings to Cash Flows (taxes, working capital, FCFF and FCFE inputs)", ["fsa", "equity"]],
      [11, "Estimating Growth", ["equity", "fsa"]],
      [14, "Free Cash Flow to Equity Discount Models", ["fsa", "equity"]],
      [15, "Firm Valuation: Cost of Capital and APV Approaches (FCFF)", ["fsa", "equity"]],
      [12, "Closure in Valuation: Estimating Terminal Value", ["equity"]],
      [17, "Fundamentals of Relative Valuation", ["equity"]],
      [18, "Earnings Multiples", ["equity"]],
      [19, "Book Value Multiples", ["equity"]],
      [20, "Revenue Multiples and Sector-Specific Multiples", ["equity"]],
      [28, "The Option to Delay and Valuation Implications (real options)", ["corpfin", "equity"]],
    ] as [number, string, string[]][]
  ).map(([n, t, topics]): SourceDef => ({
    id: `damodaran-valn2ed-ch${n}`, title: `Investment Valuation, 2nd ed., ch. ${n}: ${t} (Aswath Damodaran, NYU Stern)`, year: 2002, source: "other", tier: "T2",
    license: "© Aswath Damodaran / John Wiley & Sons; chapter posted free on the author's NYU Stern site, all rights reserved (private grounding only)", reuse: "ground", topics,
    url: `https://pages.stern.nyu.edu/~adamodar/pdfiles/valn2ed/ch${n}.pdf`,
  })),
  // MIT OpenCourseWare 15.433 Investments (Spring 2003, R. Gallati): lecture notes, CC BY-NC-SA 4.0 per the course page.
  ...(
    [
      ["154333portfolio1", "aaabe0fbbdfa71e72fe46853b289a34d_154333portfolio1.pdf", "Class 3: Portfolio Theory part 1 (utility, risk aversion, capital allocation)", ["portfolio", "quant"]],
      ["154334portfolio2", "64364800d3b15fcdb618e844e9ba25b7_154334portfolio2.pdf", "Class 4: Portfolio Theory part 2", ["portfolio", "quant"]],
      ["154335portfolio3", "d87bfc38cba412a4187bb892a70fe372_154335portfolio3.pdf", "Class 5: Portfolio Theory part 3 (optimal risky portfolio)", ["portfolio", "quant"]],
      ["154336capm1", "df52f7f91f5a13fbfa988a0becb6334a_154336capm1.pdf", "Class 6: CAPM part 1", ["portfolio", "equity"]],
      ["154338equity", "804da75d6a54ffb4e5cb11de74d5a917_154338Equity.pdf", "Class 8: Equity", ["equity"]],
      ["1543313fixedincome1", "0c35d86c9526748cf02516deb8bbb450_1543313fixedincome1.pdf", "Class 13: Fixed Income part 1", ["fixed-income"]],
      ["1543314fixedincome2", "5997158d2e3cbd743504709197ca513f_1543314fixedincome2.pdf", "Class 14: Fixed Income part 2", ["fixed-income"]],
      ["1543315fixedincome3", "abfe7b1a57a66c6daf4c6380b8ef617e_1543315fixedincome3.pdf", "Class 15: Fixed Income part 3", ["fixed-income"]],
      ["1543316riskmanagement", "2bca024b70143e5d8f63df171c30e83f_1543316riskmanagement.pdf", "Class 16: Risk Management (VaR, historical simulation)", ["portfolio", "quant"]],
      ["1543317creditrisk1", "08ceba70b1a9e8969c47f667a7a3de11_1543317creditrisk1.pdf", "Class 17: Credit Risk part 1", ["fixed-income"]],
      ["1543319securityanalysis", "ffbc3f7faa47ea6af53d2a3efe1e29ee_1543319securityanalysis.pdf", "Class 19: Security Analysis", ["equity", "fsa"]],
      ["15433_20a_active_management", "85f4eff20857d0e5e7ff0b5cc80d522f_15433_20a_active_management.pdf", "Class 20: Active Management", ["portfolio", "equity"]],
      ["15433_21a_hedge_funds", "2c65cd619fc2e15bc0789bbecf0f7370_15433_21a_hedge_funds.pdf", "Class 21: Hedge Funds", ["alternatives", "portfolio"]],
    ] as [string, string, string, string[]][]
  ).map(([k, file, t, topics]): SourceDef => ({
    id: `mit-ocw-15433-${k.replace(/^\d+/, "").replace(/^_\d+a_/, "").replace(/_/g, "-")}`, title: `MIT OpenCourseWare 15.433 Investments (Spring 2003, R. Gallati): ${t}`, year: 2003, source: "mit-ocw", tier: "T2",
    license: "CC BY-NC-SA 4.0 (MIT OpenCourseWare course page: creativecommons.org/licenses/by-nc-sa/4.0/)", reuse: "adapt", topics,
    url: `https://ocw.mit.edu/courses/15-433-investments-spring-2003/${file}`,
  })),
  { id: "mpra-key-rate-duration", title: "Key rate duration paper (Zeballos, Banco Central de Bolivia staff paper, MPRA 46057)", year: 2011, source: "other", tier: "T2", license: "Author/institution copyright; posted openly in the MPRA repository, no open licence stated (private grounding only)", reuse: "ground", topics: ["fixed-income"],
    url: "https://mpra.ub.uni-muenchen.de/46057/1/MPRA_paper_46057.pdf" },
  { id: "finra-dividend-dates-notice", title: "NASD Notice to Members 00-54: Ex-Dividend Dates (now FINRA), August 2000", year: 2000, source: "other", tier: "T1", license: "© NASD (now FINRA); free to read on finra.org, all rights reserved (private grounding only)", reuse: "ground", topics: ["equity"],
    url: "https://www.finra.org/sites/default/files/NoticeDocument/p003997.pdf" },
  // Saylor/Flat World Knowledge open textbooks (archive at 2012books.lardbucket.org); licence read from each book's front matter.
  ...(
    [
      ["finance-banking-and-money-v2.0", "Finance, Banking, and Money, v2.0", ["fixed-income", "econ", "derivatives"], 2012],
      ["finance-for-managers", "Finance for Managers", ["corpfin", "equity", "portfolio"], 2012],
      ["business-strategy", "Business Strategy", ["fsa", "equity", "corpfin"], 2012],
      ["challenges-and-opportunities-in-international-business", "Challenges and Opportunities in International Business", ["econ"], 2012],
      ["enterprise-and-individual-risk-management", "Enterprise and Individual Risk Management", ["portfolio", "derivatives"], 2012],
      ["individual-finance", "Individual Finance", ["portfolio"], 2012],
      ["an-introduction-to-business-v2.0", "An Introduction to Business, v2.0", ["corpfin", "equity"], 2012],
      ["policy-and-theory-of-international-economics", "Policy and Theory of International Economics", ["econ"], 2012],
    ] as [string, string, string[], number][]
  ).map(([slug, t, topics, y]): SourceDef => ({
    id: `flatworld-${slug.replace(/-v\d\.\d$/, "").replace(/^challenges-and-opportunities-in-/, "").replace(/^an-/, "")}`, title: `${t} (Flat World Knowledge / Saylor Foundation archive)`, year: y, source: "other", tier: "T2",
    license: "CC BY-NC-SA 3.0 (book front matter; verified at ingest, see docs/missing-sources.md)", reuse: "adapt", topics,
    url: `https://2012books.lardbucket.org/pdfs/${slug}.pdf`,
  })),
  // HTML sources (kind: "html"): each URL is fetched to sources/docs/<id>/page-N.html and converted by lib/html-text.ts.
  // cftc-futures-basics (S54) omitted: cftc.gov returns 403 to the pipeline fetch; the user must open it manually (see docs/missing-sources.md).
  { id: "treasury-yield-curve-method", kind: "html", title: "Treasury Yield Curve Methodology (U.S. Department of the Treasury)", year: 2026, source: "gov", tier: "T1",
    license: "Public domain (U.S. federal government work, 17 U.S.C. 105); the Treasury site states no separate licence", reuse: "adapt", topics: ["fixed-income"],
    url: "https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics/treasury-yield-curve-methodology", urls: ["https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics/treasury-yield-curve-methodology"] },
  { id: "ecb-explainers", kind: "html", title: "ECB explainers: monetary policy, inflation and key interest rates (European Central Bank)", year: 2026, source: "other", tier: "T1",
    license: "ECB disclaimer: \"users of this website may make free use of the information obtained directly from it\" provided it is reproduced accurately and the ECB is cited as the source", reuse: "adapt", topics: ["econ"],
    url: "https://www.ecb.europa.eu/ecb-and-you/explainers/html/monetary_policy.en.html",
    urls: [
      "https://www.ecb.europa.eu/ecb-and-you/explainers/html/monetary_policy.en.html",
      "https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_inflation.en.html",
      "https://www.ecb.europa.eu/ecb-and-you/explainers/html/interest-rates-changes.en.html",
      "https://www.ecb.europa.eu/ecb-and-you/explainers/html/unconventional.en.html",
      "https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me/html/what-is-the-deposit-facility-rate.en.html",
      "https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me/html/mro.en.html",
      "https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me/html/minimum_reserve_req.en.html",
    ] },
  { id: "eia-energy-explained", kind: "html", title: "Energy Explained: oil, natural gas and coal (U.S. Energy Information Administration)", year: 2026, source: "gov", tier: "T1",
    license: "Public domain: \"U.S. government publications are in the public domain and are not subject to copyright protection.\" (eia.gov/about/copyrights_reuse.php)", reuse: "adapt", topics: ["alternatives"],
    url: "https://www.eia.gov/energyexplained/oil-and-petroleum-products/",
    urls: [
      "https://www.eia.gov/energyexplained/oil-and-petroleum-products/",
      "https://www.eia.gov/energyexplained/oil-and-petroleum-products/prices-and-outlook.php",
      "https://www.eia.gov/energyexplained/natural-gas/",
      "https://www.eia.gov/energyexplained/natural-gas/factors-affecting-natural-gas-prices.php",
      "https://www.eia.gov/energyexplained/coal/",
    ] },
  // Gap-closing pass HTML sources
  { id: "fed-g17-capacity-notes", kind: "html", title: "Industrial Production and Capacity Utilization (G.17) explanatory notes (Federal Reserve Board)", year: 2026, source: "gov", tier: "T1",
    license: FEDPD, reuse: "adapt", topics: ["econ"],
    url: "https://www.federalreserve.gov/releases/g17/cap_notes.htm", urls: ["https://www.federalreserve.gov/releases/g17/cap_notes.htm"] },
  { id: "census-naics", kind: "html", title: "NAICS codes and understanding industry classification systems (U.S. Census Bureau, 2022 Economic Census)", year: 2022, source: "gov", tier: "T1",
    license: "Public domain (U.S. federal government work, 17 U.S.C. 105)", reuse: "adapt", topics: ["equity"],
    url: "https://www.census.gov/programs-surveys/economic-census/year/2022/guidance/understanding-naics.html", urls: ["https://www.census.gov/programs-surveys/economic-census/year/2022/guidance/understanding-naics.html"] },
  { id: "treasurydirect-securities", kind: "html", title: "Treasury Bills, Notes and Floating Rate Notes (TreasuryDirect, U.S. Department of the Treasury)", year: 2026, source: "gov", tier: "T1",
    license: "Public domain (U.S. federal government work, 17 U.S.C. 105)", reuse: "adapt", topics: ["fixed-income"],
    url: "https://www.treasurydirect.gov/marketable-securities/treasury-bills/",
    urls: [
      "https://www.treasurydirect.gov/marketable-securities/treasury-bills/",
      "https://www.treasurydirect.gov/marketable-securities/treasury-notes/",
      "https://www.treasurydirect.gov/marketable-securities/floating-rate-notes/",
    ] },
  { id: "finra-bonds", kind: "html", title: "Investment Products: Bonds (FINRA investor education)", year: 2026, source: "other", tier: "T1",
    license: "© FINRA; free to read, all rights reserved (private grounding only)", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.finra.org/investors/investing/investment-products/bonds", urls: ["https://www.finra.org/investors/investing/investment-products/bonds"] },
  { id: "sharpe-pension-risk-budget", kind: "html", title: "Budgeting and Monitoring the Risk of Defined Benefit Pension Funds (W. F. Sharpe, 2001)", year: 2001, source: "other", tier: "T2",
    license: "© William F. Sharpe; posted free on his Stanford page, no open licence stated (private grounding only)", reuse: "ground", topics: ["portfolio"],
    url: "https://web.stanford.edu/~wfsharpe/art/q2001/q2001.htm", urls: ["https://web.stanford.edu/~wfsharpe/art/q2001/q2001.htm"] },
  { id: "cfa-code-ethics-page", kind: "html", title: "Code of Ethics and Standards of Professional Conduct overview page (CFA Institute)", year: 2026, source: "cfa-handbook", tier: "T1",
    license: CFA, reuse: "ground", topics: ["ethics"],
    url: "https://www.cfainstitute.org/standards/professionals/code-ethics-standards", urls: ["https://www.cfainstitute.org/standards/professionals/code-ethics-standards"] },

  // ---- Final gap pass (2026-10-11): sources for the last 41 uncovered LOS. Licences were read from each file or page. ----
  // Quant / portfolio
  { id: "fed-feds-2001-27-historical-simulation", title: "The Hidden Dangers of Historical Simulation (M. Pritsker, FEDS 2001-27, Federal Reserve Board)", year: 2001, source: "gov", tier: "T1", license: FEDPD, reuse: "adapt", topics: ["quant", "portfolio"],
    url: "https://www.federalreserve.gov/pubs/feds/2001/200127/200127pap.pdf" },
  { id: "gips-2020-firms", title: "Global Investment Performance Standards (GIPS) for Firms, 2020 (CFA Institute)", year: 2020, source: "cfa-rf", tier: "T1", license: "© 2019 CFA Institute. All rights reserved (free public PDF on gipsstandards.org; private grounding only)", reuse: "ground", topics: ["quant", "portfolio"],
    url: "https://www.gipsstandards.org/wp-content/uploads/2021/03/2020_gips_standards_firms.pdf" },
  { id: "russell-us-indexes-methodology", title: "Russell US Equity Indexes Construction and Methodology (FTSE Russell / LSEG)", year: 2026, source: "other", tier: "T2", license: "© 2026 London Stock Exchange Group plc; free to read, all rights reserved (private grounding only)", reuse: "ground", topics: ["quant", "equity"],
    url: "https://www.lseg.com/content/dam/ftse-russell/en_us/documents/ground-rules/russell-us-indexes-construction-and-methodology.pdf" },
  { id: "nasdaq-100-methodology", title: "Nasdaq-100 Index Methodology (Nasdaq, Inc.)", year: 2026, source: "other", tier: "T2", license: "© Copyright 2026, Nasdaq, Inc. All Rights Reserved; free to read (private grounding only)", reuse: "ground", topics: ["quant", "equity"],
    url: "https://indexes.nasdaqomx.com/docs/methodology_NDX.pdf" },
  { id: "occ-risk-mgmt-derivatives", title: "Comptroller's Handbook: Risk Management of Financial Derivatives (OCC)", year: 1997, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["derivatives", "portfolio", "quant"],
    url: "https://www.occ.gov/publications-and-resources/publications/comptrollers-handbook/files/risk-mgmt-financial-derivatives/pub-ch-risk-mgmt-financial-derivatives.pdf" },
  // Dropped 2026-10-11: "cfa-pm-process-ips" (CFA refresher reading rr-2018-l2v6r47.pdf). The file is headed
  // "Member use only", so it stays out even though the URL is reachable without a login.
  // Economics
  { id: "treasury-sanctions-review-2021", title: "The Treasury 2021 Sanctions Review (U.S. Department of the Treasury)", year: 2021, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["econ"],
    url: "https://home.treasury.gov/system/files/136/Treasury-2021-sanctions-review.pdf" },
  { id: "ecb-wp1415-capital-controls", title: "Capital Controls and Foreign Exchange Policy (M. Fratzscher, ECB Working Paper 1415, 2012)", year: 2012, source: "other", tier: "T1", license: "© European Central Bank 2012; all rights reserved, free to download (private grounding only)", reuse: "ground", topics: ["econ"],
    url: "https://www.ecb.europa.eu/pub/pdf/scpwps/ecbwp1415.pdf" },
  { id: "conference-board-lei-notes", title: "U.S. Leading Economic Index technical notes, Dec. 2025 (The Conference Board)", year: 2025, source: "other", tier: "T2", license: "© The Conference Board; free-to-read press PDF, all rights reserved (private grounding only)", reuse: "ground", topics: ["econ"],
    url: "https://www.conference-board.org/pdf_free/press/US%20LEI%20Technical%20Notes%20Dec%202025.pdf" },
  { id: "bea-business-cycle-indicators-2010", title: "Business cycle indicators: leading, coincident and lagging (BEA paper P2010-2, International Seminar on Early Warning and Business Cycle Indicators)", year: 2010, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["econ"],
    url: "https://www.bea.gov/sites/default/files/papers/P2010-2.pdf" },
  { id: "census-new-residential-construction-flyer", title: "New Residential Construction: Measuring the U.S. Economy (U.S. Census Bureau flyer)", year: 2025, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["econ"],
    url: "https://www.census.gov/content/dam/Census/topics/business-and-economy/flyers/nrc-flyer.pdf" },
  // Corporate issuers: LibreTexts capital budgeting (licence from each page's footer link) and Flat World business books
  { id: "libretexts-nwtc-capital-budgeting", kind: "html", title: "Capital Budgeting Concepts and Process (Business Finance Budgeting, NWTC; Business LibreTexts)", year: 2025, source: "other", tier: "T2",
    license: "CC BY-NC 4.0 (creativecommons.org/licenses/by-nc/4.0 linked in the page footer)", reuse: "adapt", topics: ["corpfin"],
    url: "https://biz.libretexts.org/Courses/Northeast_Wisconsin_Technical_College/Business_Finance_Budgeting_(NWTC)/04:_Capital_Budgeting/4.02:_Capital_Budgeting_Concepts_and_Process",
    urls: ["https://biz.libretexts.org/Courses/Northeast_Wisconsin_Technical_College/Business_Finance_Budgeting_(NWTC)/04:_Capital_Budgeting/4.02:_Capital_Budgeting_Concepts_and_Process"] },
  { id: "libretexts-aurora-capital-budgeting", kind: "html", title: "Capital Rationing and Real Options in Capital Budgeting (Principles of Financial Management, Aurora University; Business LibreTexts)", year: 2024, source: "other", tier: "T2",
    license: "CC BY 4.0 (creativecommons.org/licenses/by/4.0 linked in the page footer)", reuse: "adapt", topics: ["corpfin"],
    url: "https://biz.libretexts.org/Courses/Aurora_University/Principles_of_Financial_Management/09:_Capital_Budgeting/9.05:_Capital_Rationing_and_Mutually_Exclusive_Project",
    urls: [
      "https://biz.libretexts.org/Courses/Aurora_University/Principles_of_Financial_Management/09:_Capital_Budgeting/9.05:_Capital_Rationing_and_Mutually_Exclusive_Project",
      "https://biz.libretexts.org/Courses/Aurora_University/Principles_of_Financial_Management/09:_Capital_Budgeting/9.06:_Real_Options_in_Capital_Budgeting_Overview",
    ] },
  ...(
    [
      ["creating-services-and-products", "Creating Services and Products", ["corpfin", "equity"]],
      ["entrepreneurship-and-sustainability", "Entrepreneurship and Sustainability", ["corpfin"]],
      ["business-accounting", "Business Accounting", ["fsa"]],
    ] as [string, string, string[]][]
  ).map(([slug, t, topics]): SourceDef => ({
    id: `flatworld-${slug}`, title: `${t} (Flat World Knowledge / Saylor Foundation archive)`, year: 2012, source: "other", tier: "T2",
    license: "CC BY-NC-SA 3.0 (book front matter: \"licensed under a Creative Commons by-nc-sa 3.0 license\")", reuse: "adapt", topics,
    url: `https://2012books.lardbucket.org/pdfs/${slug}.pdf`,
  })),
  // FSA: bank profitability ratios
  { id: "occ-earnings-handbook", title: "Comptroller's Handbook: Safety and Soundness, Earnings (OCC)", year: 2020, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fsa"],
    url: "https://www.occ.gov/publications-and-resources/publications/comptrollers-handbook/files/earnings/pub-ch-earnings.pdf" },
  // Equity: float, volume, repurchases, splits, research
  { id: "cfr-17-240-12b-2", title: "17 CFR 240.12b-2 Definitions, including public float and affiliate (U.S. GPO / govinfo, CFR 2023)", year: 2023, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["equity"],
    url: "https://www.govinfo.gov/content/pkg/CFR-2023-title17-vol4/pdf/CFR-2023-title17-vol4-sec240-12b-2.pdf" },
  { id: "cfr-17-240-10b-18", title: "17 CFR 240.10b-18 Purchases of certain equity securities by the issuer (issuer repurchases; ADTV volume limit) (U.S. GPO / govinfo, CFR 2023)", year: 2023, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["equity"],
    url: "https://www.govinfo.gov/content/pkg/CFR-2023-title17-vol4/pdf/CFR-2023-title17-vol4-sec240-10b-18.pdf" },
  { id: "finra-splits-and-research", kind: "html", title: "Stock splits, reverse stock splits and research analyst rules (FINRA)", year: 2026, source: "other", tier: "T1",
    license: "© FINRA; free to read on finra.org, all rights reserved (private grounding only)", reuse: "ground", topics: ["equity"],
    url: "https://www.finra.org/investors/investing/investment-products/stocks/stock-splits",
    urls: [
      "https://www.finra.org/investors/investing/investment-products/stocks/stock-splits",
      "https://syndication.finra.org/content/you-asked-we-answered-whats-reverse-stock-split",
      "https://www.finra.org/rules-guidance/key-topics/research-analyst-rules",
      "https://www.finra.org/rules-guidance/rulebooks/finra-rules/2241",
    ] },
  // Fixed income
  { id: "treasurydirect-pricing", kind: "html", title: "Understanding pricing, interest rates and the marketable securities glossary (TreasuryDirect, U.S. Department of the Treasury)", year: 2026, source: "gov", tier: "T1",
    license: "Public domain (U.S. federal government work, 17 U.S.C. 105)", reuse: "adapt", topics: ["fixed-income"],
    url: "https://www.treasurydirect.gov/marketable-securities/understanding-pricing/",
    urls: [
      "https://www.treasurydirect.gov/marketable-securities/understanding-pricing/",
      "https://www.treasurydirect.gov/help-center/glossary/glossary-for-marketable-securities/",
      "https://www.treasurydirect.gov/research-center/history-of-marketable-securities/bills/t-bills-indepth/",
    ] },
  { id: "treasury-tfx-yield-appendix", title: "Appendix 1: Purchase prices and yields on investments (Treasury Financial Manual, Bureau of the Fiscal Service)", year: 2024, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fixed-income"],
    url: "https://tfx.treasury.gov/sites/default/files/2024-03/Appendix-1-2-4300.pdf" },
  { id: "ftse-fixed-income-indices-guide", title: "FTSE Fixed Income Indices Guide (FTSE Russell / LSEG)", year: 2026, source: "other", tier: "T2", license: "© 2026 London Stock Exchange Group plc; free to read, all rights reserved (private grounding only)", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.lseg.com/content/dam/ftse-russell/en_us/documents/ground-rules/ftse-fixed-income-indices-guide.pdf" },
  { id: "nyfed-sr674-mortgage-spreads", title: "Understanding Mortgage Spreads (FRBNY Staff Report 674, option-adjusted spread)", year: 2014, source: "gov", tier: "T1", license: "Federal Reserve Bank of New York staff report; no open licence stated and not public domain (Reserve Banks are not federal agencies), so treated as all rights reserved", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr674.pdf" },
  { id: "fed-cmbs-cohen-2011", title: "Rating Shopping in the CMBS Market (A. Cohen, 2011 conference paper hosted by the Federal Reserve Board)", year: 2011, source: "gov", tier: "T2", license: "Author copyright; conference paper hosted on federalreserve.gov, not an agency publication (private grounding only)", reuse: "ground", topics: ["fixed-income"],
    url: "http://www.federalreserve.gov/events/conferences/2011/rsr/papers/Cohen.pdf" },
  { id: "fed-feds-note-ebp", kind: "html", title: "Updating the Recession Risk and the Excess Bond Premium (FEDS Notes, Federal Reserve Board)", year: 2016, source: "gov", tier: "T1", license: FEDPD, reuse: "adapt", topics: ["fixed-income"],
    url: "https://www.federalreserve.gov/econres/notes/feds-notes/updating-the-recession-risk-and-the-excess-bond-premium-20161006.html",
    urls: ["https://www.federalreserve.gov/econres/notes/feds-notes/updating-the-recession-risk-and-the-excess-bond-premium-20161006.html"] },
  // Derivatives: risk-neutral valuation (MIT OCW, CC BY-NC-SA 4.0 per each course page)
  { id: "mit-ocw-18s096-risk-neutral", title: "MIT OpenCourseWare 18.S096 (Fall 2013), Lecture 19: Risk Neutral Pricing, Black-Scholes Formula (V. Strela)", year: 2013, source: "mit-ocw", tier: "T2",
    license: "CC BY-NC-SA 4.0 (MIT OpenCourseWare course page: creativecommons.org/licenses/by-nc-sa/4.0/)", reuse: "adapt", topics: ["derivatives"],
    url: "https://ocw.mit.edu/courses/18-s096-topics-in-mathematics-with-applications-in-finance-fall-2013/d19208c017ada04f9261cfb41ab8d702_MIT18_S096F13_lecnote19.pdf" },
  { id: "mit-ocw-18366-lec12", title: "MIT OpenCourseWare 18.366 (Fall 2006), Lecture 12: Black-Scholes-Merton, dynamic hedging and risk-neutral valuation", year: 2006, source: "mit-ocw", tier: "T2",
    license: "CC BY-NC-SA 4.0 (MIT OpenCourseWare course page: creativecommons.org/licenses/by-nc-sa/4.0/)", reuse: "adapt", topics: ["derivatives"],
    url: "https://ocw.mit.edu/courses/18-366-random-walks-and-diffusion-fall-2006/837a728eb6a6bfa3ac5b91bb9b044e30_lec12.pdf" },
  // Alternatives: digital assets
  { id: "fsoc-digital-assets-2022", title: "Report on Digital Asset Financial Stability Risks and Regulation (Financial Stability Oversight Council, 2022)", year: 2022, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["alternatives", "portfolio"],
    url: "https://home.treasury.gov/system/files/261/FSOC-Digital-Assets-Report-2022.pdf" },
  { id: "smu-fma-ch4-rates-of-return", title: "Financial Mathematics for Actuaries, Chapter 4: Rates of Return (Y. K. Tse, Singapore Management University lecture slides)", year: 2010, source: "other", tier: "T2", license: "Course slides on the author's SMU page; no licence stated (private grounding only)", reuse: "ground", topics: ["quant", "portfolio"],
    url: "http://www.mysmu.edu/faculty/yktse/fma/s_fma_4.pdf" },
  { id: "commonfund-twr-vs-irr", title: "What's the Difference? Time-Weighted Return vs. Internal Rate of Return (Commonfund)", year: 2018, source: "other", tier: "T3", license: "© Commonfund (all rights reserved; free public PDF, private grounding only)", reuse: "ground", topics: ["quant", "portfolio"],
    url: "https://www.commonfund.org/hubfs/03%20Research%20Center/Articles/Whats%20the%20Difference_%20TWR%20vs%20IRR%20.pdf" },
  { id: "ib-mwr-twr-white-paper", title: "Money Weighted Return and Time Weighted Return White Paper (Interactive Brokers PortfolioAnalyst)", year: 2012, source: "other", tier: "T3", license: "Interactive Brokers white paper; no licence stated (private grounding only)", reuse: "ground", topics: ["quant", "portfolio"],
    url: "https://www.interactivebrokers.com/images/common/Statements/MWR-TWR_white_paper.pdf" },
  { id: "duffee-treasury-yields-spreads", title: "The Relation Between Treasury Yields and Corporate Bond Yield Spreads (G. Duffee, Journal of Finance 1998)", year: 1998, source: "other", tier: "T2", license: "Journal of Finance article, author-hosted copy at Johns Hopkins; no licence stated (private grounding only)", reuse: "ground", topics: ["fixed-income"],
    url: "http://www.econ2.jhu.edu/people/duffee/jf_spreads.pdf" },
  // ---- FI/FSA depth pass (2026-10-12) ----
  // OCC Comptroller's Handbook booklets (public domain). File names were read from each booklet's index page.
  ...(
    [
      ["leveraged-lending", "leveraged-lending/pub-ch-leveraged-lending.pdf", "Leveraged Lending", 2008, ["fixed-income", "corpfin"]],
      ["asset-based-lending", "asset-based-lending/pub-ch-asset-based-lending.pdf", "Asset-Based Lending", 2014, ["fixed-income", "corpfin"]],
      ["accts-rec-inventory-financing", "accts-rec-inventory-financing/pub-ch-accts-rec-inventory-financing.pdf", "Accounts Receivable and Inventory Financing (factoring)", 2000, ["fixed-income", "corpfin"]],
      ["residential-real-estate-lending", "residential-real-estate-lending/pub-ch-residential-real-estate.pdf", "Residential Real Estate Lending", 2025, ["fixed-income"]],
      ["commercial-real-estate-lending", "commercial-real-estate-lending/pub-ch-commercial-real-estate.pdf", "Commercial Real Estate Lending", 2022, ["fixed-income"]],
      ["mortgage-banking", "mortgage-banking/pub-ch-mortgage-banking.pdf", "Mortgage Banking", 2014, ["fixed-income"]],
      ["credit-card-lending", "credit-card-lending/pub-ch-credit-card.pdf", "Credit Card Lending (securitization)", 2025, ["fixed-income"]],
      ["installment-lending", "installment-lending/pub-ch-installment-lending.pdf", "Installment Lending (auto and student loans, securitization)", 2025, ["fixed-income"]],
      ["country-risk-management", "country-risk-management/pub-ch-country-risk.pdf", "Country Risk Management (sovereign and transfer risk)", 2025, ["fixed-income", "econ"]],
      ["lease-financing", "lease-financing/pub-ch-lease-financing.pdf", "Lease Financing (finance vs operating leases, lessor accounting)", 2025, ["fsa", "fixed-income"]],
      ["internal-external-audits", "internal-external-audits/pub-ch-audits.pdf", "Internal and External Audits (audit opinions, assurance limits)", 2025, ["fsa"]],
    ] as [string, string, string, number, string[]][]
  ).map(([slug, path, t, y, topics]): SourceDef => ({
    id: `occ-${slug}`, title: `Comptroller's Handbook: ${t} (OCC)`, year: y, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics,
    url: `https://www.occ.gov/publications-and-resources/publications/comptrollers-handbook/files/${path}`,
  })),
  // Securitization, mortgages, ABS
  { id: "fed-risk-retention-2010", title: "Report to the Congress on Risk Retention (Federal Reserve Board, Oct. 2010; ABS, CMBS, CLO, credit card, auto and student loan securitization)", year: 2010, source: "gov", tier: "T1", license: FEDPD, reuse: "adapt", topics: ["fixed-income"],
    url: "https://www.federalreserve.gov/boarddocs/rptcongress/securitization/riskretention.pdf" },
  { id: "philfed-credit-card-abs", title: "An Overview of Credit Card Asset-Backed Securities (M. Furletti, Federal Reserve Bank of Philadelphia, 2002)", year: 2002, source: "gov", tier: "T1", license: "Federal Reserve Bank of Philadelphia publication; no open licence stated and not public domain (Reserve Banks are not federal agencies), so treated as all rights reserved", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.philadelphiafed.org/-/media/frbp/assets/consumer-finance/conference-summaries/CreditCardSecuritization_012002.pdf" },
  { id: "slcg-cmo-primer", title: "A CMO Primer: The Law of Conservation of Structured Securities Risk (C. McCann, Securities Litigation and Consulting Group)", year: 2008, source: "other", tier: "T3", license: "Research paper on slcg.com; no licence stated (private grounding only)", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.slcg.com/files/research-papers/A_Collateralized_Mortgage_Obligation_Primer_final.pdf" },
  { id: "frbsf-mbs-letter-1996", title: "Innovations and Recent Developments in Mortgage-Backed Securities (FRBSF Economic Letter, 1996)", year: 1996, source: "gov", tier: "T2", license: "Federal Reserve Bank of San Francisco publication (FRASER copy); no open licence stated, so treated as all rights reserved", reuse: "ground", topics: ["fixed-income"],
    url: "https://fraser.stlouisfed.org/files/docs/historical/frbsf/frbsf_let/frbsf_let_19960105.pdf" },
  // Repo, short-term funding, ratings, markets
  { id: "nyfed-sr740-repo-guide", title: "Reference Guide to U.S. Repo and Securities Lending Markets (FRBNY Staff Report 740; Baklanova, Copeland, McCaughrin)", year: 2015, source: "gov", tier: "T1", license: "Federal Reserve Bank of New York staff report (with OFR); no open licence stated and not public domain, so treated as all rights reserved", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr740.pdf" },
  { id: "richmondfed-money-market-ch6", title: "Instruments of the Money Market, ch. 6: Repurchase Agreements (Federal Reserve Bank of Richmond)", year: 1998, source: "gov", tier: "T1", license: "Federal Reserve Bank of Richmond publication; no open licence stated and not public domain (Reserve Banks are not federal agencies), so treated as all rights reserved", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.richmondfed.org/-/media/richmondfedorg/publications/research/special_reports/instruments_of_the_money_market/pdf/chapter_06.pdf" },
  { id: "nyfed-sr423-cpff", title: "The Federal Reserve's Commercial Paper Funding Facility (FRBNY Staff Report 423; commercial paper market description)", year: 2009, source: "gov", tier: "T1", license: "Federal Reserve Bank of New York staff report; no open licence stated and not public domain, so treated as all rights reserved", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr423.pdf" },
  { id: "fsb-reducing-reliance-cra-2010", title: "Principles for Reducing Reliance on CRA Ratings (Financial Stability Board, 27 Oct. 2010)", year: 2010, source: "other", tier: "T1", license: "© FSB; free to read and download from fsb.org, all rights reserved (private grounding only)", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.fsb.org/uploads/r_101027.pdf" },
  { id: "treasury-iawg-2015", title: "Recent Disruptions and Potential Reforms in the U.S. Treasury Market: A Staff Progress Report (Treasury, Federal Reserve, FRBNY, SEC, CFTC, 2015)", year: 2015, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fixed-income"],
    url: "https://home.treasury.gov/system/files/136/IAWG-Treasury-Report.pdf" },
  { id: "treasury-joint-staff-report-2014", title: "Joint Staff Report: The U.S. Treasury Market on October 15, 2014 (Treasury, Federal Reserve, FRBNY, SEC, CFTC; market structure)", year: 2015, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fixed-income"],
    url: "https://treasurydirect.gov/files/laws-and-regulations/gsa/joint-staff-report-treasury-10-15-2014.pdf" },
  { id: "cfr-31-356", title: "31 CFR Part 356 Sale and Issue of Marketable Book-Entry Treasury Bills, Notes, and Bonds (Uniform Offering Circular; auctions) (U.S. GPO / govinfo, CFR 2023)", year: 2023, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fixed-income"],
    url: "https://www.govinfo.gov/content/pkg/CFR-2023-title31-vol2/pdf/CFR-2023-title31-vol2-part356.pdf" },
  { id: "usc-15-trust-indenture-act", title: "15 U.S.C. ch. 2A, subch. III: Trust Indentures (Trust Indenture Act of 1939; indenture trustee duties) (U.S. GPO / govinfo, U.S. Code 2022)", year: 2022, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fixed-income"],
    url: "https://www.govinfo.gov/content/pkg/USCODE-2022-title15/pdf/USCODE-2022-title15-chap2A-subchapIII.pdf" },
  { id: "cfr-17-229-202", title: "17 CFR 229.202 (Item 202) Description of registrant's securities, including debt securities and indentures (U.S. GPO / govinfo, CFR 2023)", year: 2023, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fixed-income", "fsa"],
    url: "https://www.govinfo.gov/content/pkg/CFR-2023-title17-vol3/pdf/CFR-2023-title17-vol3-sec229-202.pdf" },
  { id: "msrb-infrastructure-primer", title: "Municipal Securities: Financing the Nation's Infrastructure (Municipal Securities Rulemaking Board primer)", year: 2019, source: "other", tier: "T1", license: "© MSRB; free to read on msrb.org, all rights reserved (private grounding only)", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.msrb.org/sites/default/files/MSRB-Infrastructure-Primer.pdf" },
  // Fixed-income mathematics: university course notes (no licences stated; private grounding only) and the Bank of England yield-curve paper
  { id: "ritchken-measures-of-price-sensitivity", title: "Chapter 9: Measures of Price Sensitivity (duration, modified duration, convexity, PVBP) (P. Ritchken, Case Western Reserve University)", year: 2010, source: "other", tier: "T2", license: "Course chapter on the author's university page; no licence stated (private grounding only)", reuse: "ground", topics: ["fixed-income"],
    url: "https://faculty.weatherhead.case.edu/ritchken/documents/Chap_9.pdf" },
  { id: "sfu-poitras-duration-convexity", title: "Lecture 6: Fixed Income Portfolio Management, Duration and Convexity (G. Poitras, Simon Fraser University)", year: 2010, source: "other", tier: "T2", license: "Course lecture on the author's university page; no licence stated (private grounding only)", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.sfu.ca/~poitras/411_lec6.pdf" },
  { id: "oxford-winkel-duration-immunisation", title: "Lectures 11-14: Duration, convexity and immunisation (M. Winkel, University of Oxford)", year: 2010, source: "other", tier: "T2", license: "Course notes on the author's university page; no licence stated (private grounding only)", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.stats.ox.ac.uk/~winkel/bs4a11_l11-14.pdf" },
  { id: "utah-fcs5510-bond-market", title: "Chapters 13 and 14: The Bond Market (bond basics, yield to maturity, indenture; University of Utah FCS 5510 slides)", year: 2010, source: "other", tier: "T3", license: "Course slides on a university page; no licence stated (private grounding only)", reuse: "ground", topics: ["fixed-income"],
    url: "https://content.csbs.utah.edu/~fan/fcs5510/OnlinePowerPoint/FCS5510SmallUnit07.pdf" },
  { id: "boe-anderson-sleath-yield-curves", title: "New estimates of the UK real and nominal yield curves (N. Anderson and J. Sleath, Bank of England Working Paper 126; spot and forward rates)", year: 2001, source: "other", tier: "T1", license: "© Bank of England; free to download, all rights reserved (private grounding only)", reuse: "ground", topics: ["fixed-income", "econ"],
    url: "https://www.bankofengland.co.uk/-/media/boe/files/working-paper/2001/new-estimates-of-the-uk-real-and-nominal-yield-curves.pdf" },
  // FSA: US GAAP vs IFRS and U.S. filing rules
  { id: "ey-us-gaap-vs-ifrs-2026", title: "US GAAP versus IFRS Accounting Standards: The basics, January 2026 (EY)", year: 2026, source: "other", tier: "T2", license: "© EY; free public PDF on ey.com, all rights reserved (private grounding only)", reuse: "ground", topics: ["fsa"],
    url: "https://www.ey.com/content/dam/ey-unified-site/ey-com/en-us/technical/accountinglink/documents/ey-ifrs29540-261us-01-21-2026.pdf" },
  { id: "cfr-17-229-303", title: "17 CFR 229.303 (Item 303) Management's discussion and analysis of financial condition and results of operations (U.S. GPO / govinfo, CFR 2023)", year: 2023, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fsa"],
    url: "https://www.govinfo.gov/content/pkg/CFR-2023-title17-vol3/pdf/CFR-2023-title17-vol3-sec229-303.pdf" },
  { id: "cfr-17-229-10", title: "17 CFR 229.10 (Item 10) General, including use of non-GAAP financial measures (Regulation S-K) (U.S. GPO / govinfo, CFR 2023)", year: 2023, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fsa"],
    url: "https://www.govinfo.gov/content/pkg/CFR-2023-title17-vol3/pdf/CFR-2023-title17-vol3-sec229-10.pdf" },
  { id: "cfr-17-210-2-02", title: "17 CFR 210.2-02 Accountants' reports and attestation reports on internal control (Regulation S-X) (U.S. GPO / govinfo, CFR 2023)", year: 2023, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fsa"],
    url: "https://www.govinfo.gov/content/pkg/CFR-2023-title17-vol3/pdf/CFR-2023-title17-vol3-sec210-2-02.pdf" },
  { id: "uscourts-bankruptcy-basics", kind: "html", title: "Bankruptcy Basics: Chapter 7 and Chapter 11 (United States Courts; priority of secured and unsecured claims)", year: 2026, source: "gov", tier: "T1",
    license: "Public domain (U.S. federal government work, 17 U.S.C. 105; assumed for the judiciary's website, no licence statement seen)", reuse: "adapt", topics: ["fixed-income"],
    url: "https://www.uscourts.gov/court-programs/bankruptcy/bankruptcy-basics/chapter-11-bankruptcy-basics",
    urls: [
      "https://www.uscourts.gov/court-programs/bankruptcy/bankruptcy-basics/chapter-11-bankruptcy-basics",
      "https://www.uscourts.gov/court-programs/bankruptcy/bankruptcy-basics/chapter-7-bankruptcy-basics",
    ] },
  // Final-4 pass (2026-10-12)
  { id: "frbsf-el-2000-mbs-interest-rate-risk", kind: "html", title: "Measuring Interest Rate Risk for Mortgage-Related Assets (FRBSF Economic Letter, January 2000; empirical duration)", year: 2000, source: "gov", tier: "T2", license: "Federal Reserve Bank of San Francisco publication; no open licence stated, so treated as all rights reserved", reuse: "ground", topics: ["fixed-income"],
    url: "https://www.frbsf.org/research-and-insights/publications/economic-letter/2000/01/measuring-interest-rate-risk-for-mortgage-related-assets/",
    urls: ["https://www.frbsf.org/research-and-insights/publications/economic-letter/2000/01/measuring-interest-rate-risk-for-mortgage-related-assets/"] },
  { id: "feds-2024-039-reaching-for-duration", title: "Reaching for Duration and Leverage in the Treasury Market (Barth, Kahn, Monin, Sokolinskiy; FEDS 2024-039, Federal Reserve Board; empirical duration by regression)", year: 2024, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["fixed-income"],
    url: "https://www.federalreserve.gov/econres/feds/files/2024039pap.pdf" },
  { id: "strathmore-analyzing-financial-statements", title: "Analyzing Financial Statements: steps in analysis (Strathmore University, Financial and Managerial Accounting lecture handout)", year: 2020, source: "other", tier: "T3", license: "University course handout; no licence stated (private grounding only)", reuse: "ground", topics: ["fsa"],
    url: "https://sbselearning.strathmore.edu/pluginfile.php?file=%2F8192%2Fmod_resource%2Fcontent%2F1%2FAnalyzing+Financial+Statements.pdf" },
  { id: "census-economic-census-data-uses", kind: "html", title: "Economic Census: how businesses use the data, sizing markets and calculating market share (U.S. Census Bureau)", year: 2012, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["equity"],
    url: "https://bhs.econ.census.gov/ec12/pages/data.html", urls: ["https://bhs.econ.census.gov/ec12/pages/data.html"] },
  { id: "bls-mlr-2025-12-industry-growth", title: "Monthly Labor Review, December 2025 (BLS; Industry growth patterns, output, productivity and hours worked, 1990 to 2024), FRASER copy", year: 2025, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["equity"],
    url: "https://fraser.stlouisfed.org/files/docs/publications/bls_mlr/bls_mlr_20251222.pdf" },
  { id: "ftc-doj-merger-guidelines-2023", title: "Merger Guidelines (U.S. DOJ and FTC, December 2023; market shares, concentration, trends toward concentration)", year: 2023, source: "gov", tier: "T1", license: PD, reuse: "adapt", topics: ["equity"],
    url: "https://search.ftc.gov/system/files/ftc_gov/pdf/P234000-NEW-MERGER-GUIDELINES.pdf" },
];

const toChunks = (def: SourceDef, parts: { text: string; locator: string; url: string }[]): SourceChunk[] =>
  parts.map((p, i) => ({
    id: `${def.id}:${i}`,
    source: def.source,
    tier: def.tier,
    title: def.title,
    locator: p.locator,
    url: p.url,
    license: def.license,
    reuse: def.reuse,
    text: p.text,
    topics: def.topics,
    year: def.year,
  }));

/** Some Lyryx PDFs map ligature glyphs (ti, tt, tf) to private Latin Extended-B letters, which breaks keyword retrieval. */
const LIGATURES: Record<string, string> = { "Ɵ": "ti", "Ʃ": "tt", "ƫ": "tt", "ƞ": "tf" };
const fixLigatures = (t: string) => t.replace(/[ƞƟƩƫ]/g, (c) => LIGATURES[c]);

async function ingestPdf(def: SourceDef): Promise<{ chunks: SourceChunk[]; units: string }> {
  const pdf = await fetchSource(def.url, join("docs", def.id, `${def.id}.pdf`));
  if (readFileSync(pdf).subarray(0, 5).toString() !== "%PDF-") throw new Error(`${def.id}: download is not a PDF (${pdf})`);
  const pages = (await extractPdfPages(pdf)).map(fixLigatures);
  const chunks = chunkPages(pages).map((c, i) => ({
    id: `${def.id}:${c.startPage}:${i}`,
    source: def.source,
    tier: def.tier,
    title: def.title,
    locator: pageLocator(c),
    url: `${def.url}#page=${c.startPage}`,
    license: def.license,
    reuse: def.reuse,
    text: c.text,
    topics: def.topics,
    year: def.year,
  }));
  return { chunks, units: `${pages.length} pages` };
}

/** Each page URL becomes one "page" for the chunker; the locator is the page title, the url is that page. */
async function ingestHtml(def: SourceDef): Promise<{ chunks: SourceChunk[]; units: string }> {
  const urls = def.urls ?? [];
  if (!urls.length) throw new Error(`${def.id}: html source needs urls`);
  const pages: { title: string; url: string; text: string }[] = [];
  for (const [n, url] of urls.entries()) {
    const file = await fetchSource(url, join("docs", def.id, `page-${n + 1}.html`));
    const html = readFileSync(file, "utf8");
    if (!/<html|<body|<!doctype html/i.test(html)) throw new Error(`${def.id}: ${url} is not HTML`);
    const text = htmlToText(html);
    if (text.length < 500 || /access denied|request unsuccessful|just a moment/i.test(text.slice(0, 400))) throw new Error(`${def.id}: ${url} looks like an error page or has too little text`);
    pages.push({ title: htmlTitle(html).replace(/\s+[|–]\s+[^|–]*$/, "") || def.title, url, text });
  }
  const chunks = chunkPages(pages.map((p) => p.text)).map((c, i) => {
    const p = pages[c.startPage - 1];
    return { ...toChunks(def, [{ text: c.text, locator: p.title, url: p.url }])[0], id: `${def.id}:${c.startPage}:${i}` };
  });
  return { chunks, units: `${pages.length} pages` };
}

async function ingest(def: SourceDef): Promise<number> {
  const { chunks, units } = def.kind === "html" ? await ingestHtml(def) : await ingestPdf(def);
  mkdirSync(join("sources", "corpus"), { recursive: true });
  writeFileSync(join("sources", "corpus", `${def.id}.jsonl`), chunks.map((c) => JSON.stringify(c)).join("\n") + "\n");
  console.log(`${def.id}: ${units} → ${chunks.length} chunks`);
  return chunks.length;
}

/**
 * Sources excluded by the source audit (docs/source-audit.md, 2026-10-12): no 2026 or 2027 Level I LOS
 * retrieves them, and some extract as garbled text. Kept in the manifest for the record; never ingested.
 */
export const EXCLUDED = new Set([
  "census-economic-census-data-uses",
  "cfr-17-210-2-02",
  "cfr-17-229-303",
  "ecb-explainers",
  "fed-money-payments",
  "mit-ocw-15401-final_sol",
  "mit-ocw-15401-lec01",
  "mit-ocw-15401-midterm",
  "mit-ocw-15401-midterm_sol",
  "mit-ocw-15433-fixedincome2",
  "treasury-tfx-yield-appendix",
]);

async function main() {
  const { values } = parseArgs({ options: { only: { type: "string", multiple: true } } });
  const todo = (values.only ? SOURCES.filter((s) => values.only!.includes(s.id)) : SOURCES).filter((s) => !EXCLUDED.has(s.id));
  let total = 0;
  const failed: string[] = [];
  for (const def of todo) {
    try {
      total += await ingest(def);
    } catch (err) {
      failed.push(def.id);
      console.error(`FAILED ${def.id}: ${(err as Error).message}`);
    }
  }
  console.log(`\n${total} chunks from ${todo.length - failed.length}/${todo.length} sources${failed.length ? `; failed: ${failed.join(", ")}` : ""}`);
  if (failed.length) process.exit(1);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("content-pipeline/ingest-sources.ts")) main();

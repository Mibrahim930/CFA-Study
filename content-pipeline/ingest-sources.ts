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
  { id: "cfa-rf-alt-primer", title: "Alternative Investments: A Primer for Investment Professionals (CFA Institute Research Foundation)", year: 2018, source: "cfa-rf", tier: "T1", license: CFA, reuse: "ground", topics: ["alternatives"],
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

async function main() {
  const { values } = parseArgs({ options: { only: { type: "string", multiple: true } } });
  const todo = values.only ? SOURCES.filter((s) => values.only!.includes(s.id)) : SOURCES;
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

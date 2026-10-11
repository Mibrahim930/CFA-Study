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
}

const CFA = "© CFA Institute. All rights reserved (free public PDF)";
const PD = "Public domain (U.S. government work)";

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
];

async function ingest(def: SourceDef): Promise<number> {
  const pdf = await fetchSource(def.url, join("docs", def.id, `${def.id}.pdf`));
  if (readFileSync(pdf).subarray(0, 5).toString() !== "%PDF-") throw new Error(`${def.id}: download is not a PDF (${pdf})`);
  const pages = await extractPdfPages(pdf);
  const chunks: SourceChunk[] = chunkPages(pages).map((c, i) => ({
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
  mkdirSync(join("sources", "corpus"), { recursive: true });
  writeFileSync(join("sources", "corpus", `${def.id}.jsonl`), chunks.map((c) => JSON.stringify(c)).join("\n") + "\n");
  console.log(`${def.id}: ${pages.length} pages → ${chunks.length} chunks`);
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

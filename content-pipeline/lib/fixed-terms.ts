/**
 * Fixed terminology the copy guard ignores (user decision, 2026-10-27).
 *
 * The lessons never copy source prose. But the names and defined phrases of the Code and Standards,
 * accounting standards, index methodologies and similar fixed vocabulary cannot be paraphrased: a
 * candidate has to know them word for word. Each match below is replaced by one sentinel word before
 * the n-gram comparison, so a run of copied words is broken at the term while the words on either
 * side are still compared. Everything that is NOT in this list is held to the usual limit.
 *
 * Keep entries short and specific (a name, a title, a defined phrase) and at least two words long: a
 * single word cannot be "copied", and masking one would only weaken the guard. Do not add sentences
 * of guidance: those are prose and must be reworded.
 */

const CODE_AND_STANDARDS: string[] = [
  // Names
  "CFA Institute Code of Ethics and Standards of Professional Conduct",
  "Code of Ethics and Standards of Professional Conduct",
  "Code and Standards",
  "Code of Ethics",
  "CFA Institute Ethical Decision-Making Framework",
  "Ethical Decision-Making Framework",
  "Identify, Consider, Act, Reflect",
  "Rules of Procedure",
  "Professional Conduct Program",
  "Disciplinary Review Committee",
  "CFA Institute",
  "CFA designation",
  "CFA charterholder",
  "CFA Program",
  "Members and Candidates",
  "Member or Candidate",
  // Standard titles (12th edition)
  "Standard I: Professionalism",
  "Knowledge of the Law",
  "Independence and Objectivity",
  "Standard II: Integrity of Capital Markets",
  "Material Nonpublic Information",
  "Market Manipulation",
  "Standard III: Duties to Clients",
  "Loyalty, Prudence, and Care",
  "Fair Dealing",
  "Performance Presentation",
  "Preservation of Confidentiality",
  "Standard IV: Duties to Employers",
  "Additional Compensation Arrangements",
  "Responsibilities of Supervisors",
  "Standard V: Investment Analysis, Recommendations, and Actions",
  "Diligence and Reasonable Basis",
  "Communication with Clients and Prospective Clients",
  "Record Retention",
  "Standard VI: Conflicts of Interest",
  "Avoid or Disclose Conflicts",
  "Disclosure of Conflicts",
  "Priority of Transactions",
  "Referral Fees",
  "Standard VII: Responsibilities as a CFA Institute Member or CFA Candidate",
  "Responsibilities as a CFA Institute Member or CFA Candidate",
  "Responsibilities as a CFA Institute Member or Candidate",
  "Conduct as Participants in CFA Institute Programs",
  "Reference to CFA Institute, the CFA Designation, and the CFA Program",
  // Defined phrases from the text of the Standards themselves
  "more strict law, rule, or regulation",
  "reasonable and adequate basis, supported by appropriate research and investigation",
  "reasonable and adequate basis",
  "investment experience, risk and return objectives, and financial constraints",
  "avoid or make full and fair disclosure of all matters that could reasonably be expected to impair their independence and objectivity",
  "compromises the reputation or integrity of CFA Institute or the CFA designation",
  "compromises the reputation or integrity of CFA Institute",
  "integrity, validity, or security",
  "could reasonably be expected to impair their independence and objectivity",
  "avoid or make full and fair disclosure",
  "CFA Institute membership, the CFA designation, or candidacy in the CFA Program",
  "right to use the CFA designation",
  "has not been verified by CFA Institute",
  "public censure",
  "suspension of membership",
  "revocation of membership",
  "cautionary letter",
];

const ACCOUNTING: string[] = [
  "lower of cost and net realizable value",
  "lower of cost and net realisable value",
  "lower of cost or market",
  "net realizable value",
  "net realisable value",
  "estimated selling price in the ordinary course of business",
  "estimated costs of completion and the estimated costs necessary to make the sale",
  "estimated costs necessary to make the sale",
  "fair value less costs to sell",
  "value in use",
  "recoverable amount",
  "carrying amount",
  "reporting unit",
  "cash-generating unit",
  "more likely than not",
  "quoted price in an active market for an identical asset",
  "quoted price in an active market",
  "current expected credit loss",
  "held-to-maturity",
  "held to maturity",
  "available-for-sale",
  "available for sale",
  "amortized cost",
  "fair value through profit or loss",
  "fair value through other comprehensive income",
  "other comprehensive income",
  "technical feasibility",
  "intention to complete",
  "intent to complete",
  "ability to use or sell",
  "depreciation method, residual value and useful life",
  "separate major line of business or geographical area of operations",
  "separate major line of business or geographical area",
  "management's discussion and analysis",
  "operating activities",
  "investing activities",
  "financing activities",
  "discontinued operation",
];

const MARKETS_AND_INSTRUMENTS: string[] = [
  // Index and sector names (GICS)
  "Consumer Discretionary",
  "Consumer Staples",
  "Health Care",
  "Information Technology",
  "Communication Services",
  "Real Estate",
  // Fee structures and fund terms
  "2 and 20",
  "2% management fee and a 20% incentive fee",
  "2 management fee and a 20 incentive fee",
  "management fee",
  "incentive fee",
  "high-water mark",
  "high water mark",
  "hard hurdle",
  "soft hurdle",
  "Investment Company Act of 1940",
  "sovereign wealth fund",
  // Derivatives
  "buyer to every seller and seller to every buyer",
  "cost of carry",
  "out of the money",
  "in the money",
  "at the money",
  "right to buy",
  "right to sell",
  "exercised at any time",
  "underlying asset",
  "central counterparty",
  // Fixed income
  "bankruptcy-remote special purpose vehicle",
  "special purpose vehicle",
  "special purpose entity",
  "effective duration",
  "modified duration",
  "money market yield",
  "bond equivalent yield",
  // Portfolio and equity
  "global minimum-variance portfolio",
  "global minimum variance portfolio",
  "efficient frontier",
  "capital allocation line",
  "capital market line",
  "security market line",
  "present value of expected future cash flows",
  "bid-ask spread",
  "Investment Summary",
  "Financial Analysis",
  "Competitive Positioning",
  "Investment Risks",
  // Commodities and digital assets
  "crude oil",
  "natural gas",
  "precious metals",
  "industrial metals",
  "distributed ledger technology",
  "distributed ledger or similar technology",
  "distributed ledger",
];

export const FIXED_TERMS: string[] = [...CODE_AND_STANDARDS, ...ACCOUNTING, ...MARKETS_AND_INSTRUMENTS];

/** The sentinel survives `words()` and never occurs in any source. */
export const TERM_SENTINEL = "xfixedtermx";

// Commas in a term are optional in the text ("risk and return objectives, and" also matches without the comma).
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/,/g, ",?").replace(/[-\s]+/g, "[-\\s]+");

// Longest first so "Code of Ethics and Standards of Professional Conduct" wins over "Code of Ethics".
const TERM_RE = new RegExp(
  [...FIXED_TERMS].sort((a, b) => b.length - a.length).map((t) => `\\b${escape(t)}\\b`).join("|"),
  "gi",
);

/** Replaces every fixed term with the sentinel so the copy guard compares only the words around it. */
export function maskFixedTerms(text: string): string {
  return text.replace(TERM_RE, ` ${TERM_SENTINEL} `);
}

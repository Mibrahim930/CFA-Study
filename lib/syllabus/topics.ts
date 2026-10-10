// 2027 Level I curriculum structure (applies to exams from February 2027).
// Weights: cfainstitute.org/programs/cfa-program/candidate-resources/level-i-exam (2027 outline).
// Module titles: official "2027 Level I Topic Outlines" PDF, in PDF order.

export type TopicId =
  | "quant"
  | "econ"
  | "corpfin"
  | "fsa"
  | "equity"
  | "fixed-income"
  | "derivatives"
  | "alternatives"
  | "portfolio"
  | "ethics";

export interface TopicDef {
  id: TopicId;
  name: string;
  /** Name as printed in the outline PDF (used by the ingest parser). */
  outlineName: string;
  weight: { min: number; max: number };
  session: 1 | 2;
  modules: string[];
}

export const TOPICS: TopicDef[] = [
  {
    id: "quant",
    name: "Quantitative Methods",
    outlineName: "Quantitative Methods",
    weight: { min: 11, max: 14 },
    session: 1,
    modules: [
      "Returns of Financial Assets and Instruments",
      "Types of Financial Returns",
      "Benchmarking Returns",
      "The Time Value of Money in Finance",
      "Statistical Characteristics of Asset Returns",
      "Statistical Distributions for Financial Asset Prices and Returns",
      "Estimation and Hypothesis Testing",
      "The Return and Risk of a Financial Portfolio",
      "Simulation of Financial Asset Prices and Returns",
      "Applications of Simple Linear Regression in Finance",
      "Introduction to Financial Data Science",
    ],
  },
  {
    id: "econ",
    name: "Economics",
    outlineName: "Economics",
    weight: { min: 6, max: 9 },
    session: 1,
    modules: [
      "The Firm and Market Structures",
      "Understanding Business Cycles",
      "Fiscal Policy",
      "Monetary Policy",
      "Introduction to Geopolitics",
      "International Trade",
      "Capital Flows and the FX Market",
      "Exchange Rate Calculations",
    ],
  },
  {
    id: "corpfin",
    name: "Corporate Finance",
    outlineName: "Corporate Finance",
    weight: { min: 6, max: 9 },
    session: 1,
    modules: [
      "Organizational Forms, Corporate Issuer Features, and Ownership",
      "Investors and Other Stakeholders",
      "Corporate Governance: Conflicts, Mechanisms, Risks, and Benefits",
      "Working Capital and Liquidity",
      "Capital Investments and Capital Allocation",
      "Capital Structure",
      "Business Models",
    ],
  },
  {
    id: "fsa",
    name: "Financial Statement Analysis",
    outlineName: "Financial Statement Analysis",
    weight: { min: 11, max: 14 },
    session: 1,
    modules: [
      "Introduction to Financial Statement Analysis",
      "Analyzing Income Statements",
      "Analyzing Balance Sheets",
      "Analyzing Statements of Cash Flows I",
      "Analyzing Statements of Cash Flows II",
      "Analysis of Inventories",
      "Analysis of Long-Term Assets",
      "Topics in Long-Term Liabilities and Equity",
      "Analysis of Income Taxes",
      "Financial Reporting Quality",
      "Financial Analysis Techniques",
      "Introduction to Financial Statement Modeling",
    ],
  },
  {
    id: "equity",
    name: "Equities",
    outlineName: "Equities",
    weight: { min: 11, max: 14 },
    session: 2,
    modules: [
      "Equity Instrument Features",
      "Equity Jurisdictions, Classes, and the Voting Process",
      "Equity Issuance and Trading",
      "Sources of Equity Returns",
      "Introduction to Equity Valuation",
      "Discounted Cash Flow (DCF) and Growth Models",
      "Relative Value Equity Valuation Approaches",
      "Financial Statement Forecasting in Equity Valuation",
      "Industry and Competitive Analysis",
      "Company Analysis: Past, Present, and Future",
      "Equity Analyst Research Reports",
      "The Capital Asset Pricing Model, Market Model, and Other Factor-Based Equity Models",
    ],
  },
  {
    id: "fixed-income",
    name: "Fixed Income",
    outlineName: "Fixed Income",
    weight: { min: 11, max: 14 },
    session: 2,
    modules: [
      "Fixed-Income Instrument Features",
      "Fixed-Income Cash Flows and Types",
      "Fixed-Income Issuance and Trading",
      "Fixed-Income Markets for Corporate Issuers",
      "Fixed-Income Markets for Government Issuers",
      "Fixed-Income Bond Valuation: Prices and Yields",
      "Yield and Yield Spread Measures for Fixed-Rate Bonds",
      "Yield and Yield Spread Measures for Floating-Rate Instruments",
      "The Term Structure of Interest Rates: Spot, Par, and Forward Curves",
      "Interest Rate Risk and Return",
      "Yield-Based Bond Duration Measures and Properties",
      "Yield-Based Bond Convexity and Portfolio Properties",
      "Curve-Based and Empirical Fixed-Income Risk Measures",
      "Credit Risk",
      "Credit Analysis for Government Issuers",
      "Credit Analysis for Corporate Issuers",
      "Fixed-Income Securitization",
      "Asset-Backed Security (ABS) Instrument and Market Features",
      "Mortgage-Backed Security (MBS) Instrument and Market Features",
    ],
  },
  {
    id: "derivatives",
    name: "Derivatives and Risk Management",
    outlineName: "Derivatives",
    weight: { min: 6, max: 9 },
    session: 2,
    modules: [
      "Derivative Instrument and Derivative Market Features",
      "Forward Commitment and Contingent Claim Features and Instruments",
      "Derivative Benefits, Risks, and Issuer and Investor Uses",
      "Arbitrage, Replication, and the Cost of Carry in Pricing Derivatives",
      "Pricing and Valuation of Forward Contracts and for an Underlying with Varying Maturities",
      "Pricing and Valuation of Futures Contracts",
      "Pricing and Valuation of Interest Rate and Other Swaps",
      "Pricing and Valuation of Options",
      "Option Replication Using Put–Call Parity",
      "Valuing a Derivative Using a One-Period Binomial Model",
    ],
  },
  {
    id: "alternatives",
    name: "Alternative Investments",
    outlineName: "Alternative Investments",
    weight: { min: 6, max: 9 },
    session: 2,
    modules: [
      "Alternative Investment Features, Methods, and Structures",
      "Alternative Investment Performance and Returns",
      "Investments in Private Capital: Equity and Debt",
      "Real Estate and Infrastructure",
      "Natural Resources",
      "Hedge Funds",
      "Introduction to Digital Assets",
    ],
  },
  {
    id: "portfolio",
    name: "Portfolio Construction",
    outlineName: "Portfolio Construction",
    weight: { min: 8, max: 12 },
    session: 2,
    modules: [
      "Portfolio Risk and Return: Part I",
      "Portfolio Risk and Return: Part II",
      "Portfolio Management: An Overview",
      "Basics of Portfolio Planning and Construction",
      "The Behavioral Biases of Individuals",
      "Introduction to Risk Management",
    ],
  },
  {
    id: "ethics",
    name: "Ethical and Professional Standards",
    outlineName: "Ethical and Professional Standards",
    weight: { min: 10, max: 15 },
    session: 1,
    modules: [
      "Ethics and Trust in the Investment Profession",
      "Code of Ethics and Standards of Professional Conduct",
      "Guidance for Standard I: Professionalism",
      "Guidance for Standard II: Integrity of Capital Markets",
      "Guidance for Standard III: Duties to Clients",
      "Guidance for Standard IV: Duties to Employers",
      "Guidance for Standard V: Investment Analysis, Recommendations, and Actions",
      "Guidance for Standard VI: Conflicts of Interest",
      "Guidance for Standard VII: Responsibilities as a CFA Institute Member or CFA Candidate",
      "Application of the Code and Standards: Level I",
    ],
  },
];

/** Recommended beginner study order (foundations-first; Ethics also runs weekly throughout). */
export const STUDY_ORDER: TopicId[] = [
  "quant",
  "fsa",
  "corpfin",
  "equity",
  "fixed-income",
  "derivatives",
  "alternatives",
  "portfolio",
  "econ",
  "ethics",
];

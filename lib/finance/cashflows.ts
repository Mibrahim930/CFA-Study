import { findRoot } from "./solve";

/** NPV where cashflows[0] occurs today (t = 0), cashflows[t] at the end of period t. */
export function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);
}

/** Internal rate of return per period. Requires at least one sign change. */
export function irr(cashflows: number[], guess = 0.1): number {
  const hasPos = cashflows.some((c) => c > 0);
  const hasNeg = cashflows.some((c) => c < 0);
  if (!hasPos || !hasNeg) throw new Error("irr requires both positive and negative cash flows");
  return findRoot((r) => npv(r, cashflows), { lo: -0.9999, hi: 1, guess });
}

/**
 * Modified IRR: negative flows discounted to t=0 at financeRate, positive flows
 * compounded to t=N at reinvestRate.
 */
export function mirr(cashflows: number[], financeRate: number, reinvestRate: number): number {
  const n = cashflows.length - 1;
  let pvNeg = 0;
  let fvPos = 0;
  cashflows.forEach((cf, t) => {
    if (cf < 0) pvNeg += cf / Math.pow(1 + financeRate, t);
    else fvPos += cf * Math.pow(1 + reinvestRate, n - t);
  });
  return Math.pow(fvPos / -pvNeg, 1 / n) - 1;
}

/** Discounted payback: first period in which cumulative discounted cash flow turns non-negative (fractional). */
export function discountedPayback(rate: number, cashflows: number[]): number | null {
  let cum = 0;
  for (let t = 0; t < cashflows.length; t++) {
    const d = cashflows[t] / Math.pow(1 + rate, t);
    if (cum < 0 && cum + d >= 0) return t - 1 + -cum / d;
    cum += d;
  }
  return cum >= 0 ? 0 : null;
}

/** Simple (undiscounted) payback period, fractional. */
export function payback(cashflows: number[]): number | null {
  return discountedPayback(0, cashflows);
}

/** Profitability index = PV of future cash flows / initial investment. */
export function profitabilityIndex(rate: number, cashflows: number[]): number {
  return npv(rate, [0, ...cashflows.slice(1)]) / -cashflows[0];
}

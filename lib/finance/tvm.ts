import { findRoot } from "./solve";

/**
 * Time value of money, using the BA II Plus / spreadsheet sign convention:
 *   pv·(1+r)^n + pmt·(1+r·type)·((1+r)^n − 1)/r + fv = 0
 * Cash paid out is negative, cash received is positive. `rate` is per period as a decimal.
 * `type` 0 = END (ordinary annuity), 1 = BGN (annuity due).
 */
export type PaymentTiming = 0 | 1;

function annuityFactor(rate: number, n: number): number {
  return rate === 0 ? n : (Math.pow(1 + rate, n) - 1) / rate;
}

export function fv(rate: number, n: number, pmt: number, pv: number, type: PaymentTiming = 0): number {
  const g = Math.pow(1 + rate, n);
  return -(pv * g + pmt * (1 + rate * type) * annuityFactor(rate, n));
}

export function pv(rate: number, n: number, pmt: number, fvAmt = 0, type: PaymentTiming = 0): number {
  const g = Math.pow(1 + rate, n);
  return -(fvAmt + pmt * (1 + rate * type) * annuityFactor(rate, n)) / g;
}

export function pmt(rate: number, n: number, pvAmt: number, fvAmt = 0, type: PaymentTiming = 0): number {
  const g = Math.pow(1 + rate, n);
  return -(pvAmt * g + fvAmt) / ((1 + rate * type) * annuityFactor(rate, n));
}

export function nper(rate: number, pmtAmt: number, pvAmt: number, fvAmt = 0, type: PaymentTiming = 0): number {
  if (rate === 0) return -(pvAmt + fvAmt) / pmtAmt;
  const adj = pmtAmt * (1 + rate * type);
  return Math.log((adj - fvAmt * rate) / (adj + pvAmt * rate)) / Math.log(1 + rate);
}

export function rate(n: number, pmtAmt: number, pvAmt: number, fvAmt = 0, type: PaymentTiming = 0): number {
  const f = (r: number) => {
    const g = Math.pow(1 + r, n);
    return pvAmt * g + pmtAmt * (1 + r * type) * annuityFactor(r, n) + fvAmt;
  };
  return findRoot(f, { lo: -0.99, hi: 1, guess: 0.05 });
}

/** Effective annual rate from a stated annual rate compounded m times per year (m = Infinity → continuous). */
export function effectiveAnnualRate(statedRate: number, m: number): number {
  return m === Infinity ? Math.exp(statedRate) - 1 : Math.pow(1 + statedRate / m, m) - 1;
}

/** PV of a growing perpetuity paying `c1` one period from now, growing at g (requires r > g). */
export function growingPerpetuityPV(c1: number, r: number, g = 0): number {
  if (r <= g) throw new Error("growingPerpetuityPV requires r > g");
  return c1 / (r - g);
}

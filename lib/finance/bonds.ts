import { findRoot } from "./solve";

/**
 * Plain-vanilla fixed-rate bond on a coupon date.
 * couponRate and ytm are ANNUAL stated rates (decimals); `freq` coupons per year; `years` to maturity.
 */
export interface BondSpec {
  face?: number;
  couponRate: number;
  years: number;
  freq?: number;
}

function flows({ face = 100, couponRate, years, freq = 1 }: BondSpec) {
  const n = Math.round(years * freq);
  if (Math.abs(n - years * freq) > 1e-9) throw new Error("years × freq must be a whole number of periods");
  const c = (face * couponRate) / freq;
  return { n, c, face, freq };
}

export function bondPrice(spec: BondSpec, ytm: number): number {
  const { n, c, face, freq } = flows(spec);
  const r = ytm / freq;
  let price = 0;
  for (let t = 1; t <= n; t++) price += c / Math.pow(1 + r, t);
  return price + face / Math.pow(1 + r, n);
}

/** Yield to maturity (annual stated, compounded `freq` times) given a price on a coupon date. */
export function ytm(spec: BondSpec, price: number): number {
  return findRoot((y) => bondPrice(spec, y) - price, { lo: -0.5, hi: 1, guess: spec.couponRate });
}

export function currentYield(spec: BondSpec, price: number): number {
  const { face = 100, couponRate } = spec;
  return (face * couponRate) / price;
}

/**
 * Price between coupon dates (actual/actual style): t/T = fraction of the coupon period elapsed.
 * Full (dirty) = PV on last coupon date × (1 + r)^(t/T); accrued = coupon × t/T; flat (clean) = full − accrued.
 * `spec.years` is measured from the LAST coupon date.
 */
export function bondPriceBetweenCoupons(spec: BondSpec, ytmAnnual: number, fractionElapsed: number) {
  const freq = spec.freq ?? 1;
  const pv0 = bondPrice(spec, ytmAnnual);
  const full = pv0 * Math.pow(1 + ytmAnnual / freq, fractionElapsed);
  const accrued = (((spec.face ?? 100) * spec.couponRate) / freq) * fractionElapsed;
  return { full, accrued, flat: full - accrued };
}

/** Price from a set of spot rates (annual compounding, spot[i] for year i+1). */
export function priceFromSpots(cashflows: number[], spots: number[]): number {
  return cashflows.reduce((s, cf, i) => s + cf / Math.pow(1 + spots[i], i + 1), 0);
}

/** Implied forward rate between years a and b from spot rates S_a and S_b (annual compounding). */
export function forwardRate(spotA: number, a: number, spotB: number, b: number): number {
  if (b <= a) throw new Error("forwardRate requires b > a");
  return Math.pow(Math.pow(1 + spotB, b) / Math.pow(1 + spotA, a), 1 / (b - a)) - 1;
}

/** Par rate for maturity N from spot rates (annual coupons). */
export function parRate(spots: number[]): number {
  const dfs = spots.map((s, i) => 1 / Math.pow(1 + s, i + 1));
  return (1 - dfs[dfs.length - 1]) / dfs.reduce((a, b) => a + b, 0);
}

/** Bootstrap spot rates from annual-pay par rates (par[i] = par yield for year i+1). */
export function spotsFromPar(par: number[]): number[] {
  const spots: number[] = [];
  par.forEach((p, i) => {
    let pvCoupons = 0;
    for (let j = 0; j < i; j++) pvCoupons += p / Math.pow(1 + spots[j], j + 1);
    spots.push(Math.pow((1 + p) / (1 - pvCoupons), 1 / (i + 1)) - 1);
  });
  return spots;
}

/** Macaulay duration in YEARS (on a coupon date). */
export function macaulayDuration(spec: BondSpec, ytmAnnual: number): number {
  const { n, c, face, freq } = flows(spec);
  const r = ytmAnnual / freq;
  let pv = 0;
  let weighted = 0;
  for (let t = 1; t <= n; t++) {
    const cf = c + (t === n ? face : 0);
    const d = cf / Math.pow(1 + r, t);
    pv += d;
    weighted += t * d;
  }
  return weighted / pv / freq;
}

/** Modified duration in years: MacDur / (1 + y/freq). */
export function modifiedDuration(spec: BondSpec, ytmAnnual: number): number {
  return macaulayDuration(spec, ytmAnnual) / (1 + ytmAnnual / (spec.freq ?? 1));
}

/** Approximate modified duration: (PV− − PV+) / (2·Δy·PV0). */
export function approxModifiedDuration(pvMinus: number, pvPlus: number, pv0: number, dy: number): number {
  return (pvMinus - pvPlus) / (2 * dy * pv0);
}

/** Approximate convexity: (PV− + PV+ − 2·PV0) / (Δy²·PV0). */
export function approxConvexity(pvMinus: number, pvPlus: number, pv0: number, dy: number): number {
  return (pvMinus + pvPlus - 2 * pv0) / (dy * dy * pv0);
}

/** Annual convexity computed by repricing the bond (approximation formula, small Δy). */
export function convexity(spec: BondSpec, ytmAnnual: number, dy = 1e-4): number {
  const p0 = bondPrice(spec, ytmAnnual);
  return approxConvexity(bondPrice(spec, ytmAnnual - dy), bondPrice(spec, ytmAnnual + dy), p0, dy);
}

/** %ΔP ≈ −ModDur·Δy + ½·Convexity·(Δy)². */
export function priceChangeEstimate(modDur: number, convex: number, dy: number): number {
  return -modDur * dy + 0.5 * convex * dy * dy;
}

/** Money duration and PVBP for a position. */
export function moneyDuration(modDur: number, fullPrice: number): number {
  return modDur * fullPrice;
}

export function pvbp(pvMinus: number, pvPlus: number): number {
  return (pvMinus - pvPlus) / 2;
}

/** Duration of a portfolio as the market-value-weighted average. */
export function portfolioDuration(weights: number[], durations: number[]): number {
  return weights.reduce((s, w, i) => s + w * durations[i], 0);
}


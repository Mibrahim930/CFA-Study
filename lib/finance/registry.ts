import { z } from "zod";
import * as f from "./index";

/**
 * Calculation registry for the content pipeline's verification gate.
 * A generated calculation question carries `calc_spec: { fn, args }`; the verifier looks the
 * function up here, validates args with zod, recomputes the answer, and compares it to the key.
 */

const num = z.number().finite();
const rate = num.gt(-1).lt(10);
const nums = z.array(num).min(1);
const timing = z.union([z.literal(0), z.literal(1)]).default(0);
const bond = z.object({
  face: num.positive().default(100),
  couponRate: num.min(0).lt(1),
  years: num.positive(),
  freq: z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(12)]).default(1),
});

function entry<S extends z.ZodType>(description: string, args: S, run: (a: z.infer<S>) => number) {
  return { description, args, run };
}

export const CALCS = {
  fv: entry("Future value (BA II Plus sign convention)", z.object({ rate, n: num, pmt: num.default(0), pv: num, type: timing }), (a) => f.fv(a.rate, a.n, a.pmt, a.pv, a.type)),
  pv: entry("Present value", z.object({ rate, n: num, pmt: num.default(0), fv: num.default(0), type: timing }), (a) => f.pv(a.rate, a.n, a.pmt, a.fv, a.type)),
  pmt: entry("Level payment", z.object({ rate, n: num.positive(), pv: num, fv: num.default(0), type: timing }), (a) => f.pmt(a.rate, a.n, a.pv, a.fv, a.type)),
  nper: entry("Number of periods", z.object({ rate, pmt: num, pv: num, fv: num.default(0), type: timing }), (a) => f.nper(a.rate, a.pmt, a.pv, a.fv, a.type)),
  rate: entry("Rate per period", z.object({ n: num.positive(), pmt: num.default(0), pv: num, fv: num.default(0), type: timing }), (a) => f.rate(a.n, a.pmt, a.pv, a.fv, a.type)),
  effectiveAnnualRate: entry("EAR from stated rate and compounding frequency", z.object({ statedRate: rate, m: num.positive() }), (a) => f.effectiveAnnualRate(a.statedRate, a.m)),
  npv: entry("NPV, cashflows[0] at t=0", z.object({ rate, cashflows: nums }), (a) => f.npv(a.rate, a.cashflows)),
  irr: entry("IRR per period", z.object({ cashflows: nums }), (a) => f.irr(a.cashflows)),
  hpr: entry("Holding period return", z.object({ beginPrice: num.positive(), endPrice: num, income: num.default(0) }), (a) => f.hpr(a.beginPrice, a.endPrice, a.income)),
  geometricMeanReturn: entry("Geometric mean of periodic returns", z.object({ returns: nums }), (a) => f.geometricMeanReturn(a.returns)),
  arithmeticMean: entry("Arithmetic mean", z.object({ xs: nums }), (a) => f.arithmeticMean(a.xs)),
  harmonicMean: entry("Harmonic mean", z.object({ xs: nums }), (a) => f.harmonicMean(a.xs)),
  twr: entry("Time-weighted return over the horizon", z.object({ subperiodReturns: nums }), (a) => f.twr(a.subperiodReturns)),
  mwr: entry("Money-weighted return (IRR of investor cash flows)", z.object({ cashflows: nums }), (a) => f.mwr(a.cashflows)),
  realReturn: entry("Real return (Fisher)", z.object({ nominal: rate, inflation: rate }), (a) => f.realReturn(a.nominal, a.inflation)),
  variance: entry("Variance", z.object({ xs: nums, basis: z.enum(["sample", "population"]).default("sample") }), (a) => f.variance(a.xs, a.basis)),
  stdev: entry("Standard deviation", z.object({ xs: nums, basis: z.enum(["sample", "population"]).default("sample") }), (a) => f.stdev(a.xs, a.basis)),
  portfolioStdev2: entry("Two-asset portfolio standard deviation", z.object({ w1: num, sd1: num.min(0), sd2: num.min(0), corr: num.min(-1).max(1) }), (a) => f.portfolioStdev2(a.w1, a.sd1, a.sd2, a.corr)),
  sharpeRatio: entry("Sharpe ratio", z.object({ rp: num, rf: num, sdp: num.positive() }), (a) => f.sharpeRatio(a.rp, a.rf, a.sdp)),
  capm: entry("CAPM required return", z.object({ rf: num, beta: num, marketReturn: num }), (a) => f.capm(a.rf, a.beta, a.marketReturn)),
  bondPrice: entry("Bond price on a coupon date (per 100 face by default)", z.object({ bond, ytm: rate }), (a) => f.bondPrice(a.bond, a.ytm)),
  ytm: entry("Yield to maturity (annual stated)", z.object({ bond, price: num.positive() }), (a) => f.ytm(a.bond, a.price)),
  currentYield: entry("Current yield", z.object({ bond, price: num.positive() }), (a) => f.currentYield(a.bond, a.price)),
  macaulayDuration: entry("Macaulay duration (years)", z.object({ bond, ytm: rate }), (a) => f.macaulayDuration(a.bond, a.ytm)),
  modifiedDuration: entry("Modified duration (years)", z.object({ bond, ytm: rate }), (a) => f.modifiedDuration(a.bond, a.ytm)),
  convexity: entry("Annual convexity", z.object({ bond, ytm: rate }), (a) => f.convexity(a.bond, a.ytm)),
  priceChangeEstimate: entry("%ΔP from duration and convexity", z.object({ modDur: num, convexity: num, dy: num }), (a) => f.priceChangeEstimate(a.modDur, a.convexity, a.dy)),
  forwardRate: entry("Implied forward rate between years a and b", z.object({ spotA: rate, a: num.min(0), spotB: rate, b: num.positive() }), (a) => f.forwardRate(a.spotA, a.a, a.spotB, a.b)),
  parRate: entry("Par rate from annual spot rates", z.object({ spots: z.array(rate).min(1) }), (a) => f.parRate(a.spots)),
  forwardPrice: entry("No-arbitrage forward price (discrete)", z.object({ spot: num.positive(), r: rate, T: num.positive(), pvBenefits: num.default(0), pvCosts: num.default(0) }), (a) => f.forwardPrice(a.spot, a.r, a.T, a.pvBenefits, a.pvCosts)),
  callFromParity: entry("Call value from put–call parity", z.object({ put: num.min(0), spot: num.positive(), strike: num.positive(), r: rate, T: num.positive() }), (a) => f.callFromParity(a.put, a.spot, a.strike, a.r, a.T)),
  putFromParity: entry("Put value from put–call parity", z.object({ call: num.min(0), spot: num.positive(), strike: num.positive(), r: rate, T: num.positive() }), (a) => f.putFromParity(a.call, a.spot, a.strike, a.r, a.T)),
  binomialValue: entry("One-period binomial option value", z.object({ spot: num.positive(), strike: num.positive(), u: num.gt(1), d: num.positive().lt(1), r: rate, kind: z.enum(["call", "put"]) }), (a) => f.binomialOnePeriod(a.spot, a.strike, a.u, a.d, a.r, a.kind).value),
  swapFixedRate: entry("Swap fixed rate from discount factors", z.object({ discountFactors: z.array(num.positive().max(1)).min(1) }), (a) => f.swapFixedRate(a.discountFactors)),
  wacc: entry("Weighted average cost of capital", z.object({ wd: num, rd: rate, tax: num.min(0).lt(1), we: num, re: rate, wp: num.default(0), rp: num.default(0) }), (a) => f.wacc(a)),
  gordonValue: entry("Gordon growth value V0 = D1/(r − g)", z.object({ d1: num.positive(), r: rate, g: rate }), (a) => f.gordonValue(a.d1, a.r, a.g)),
  cashConversionCycle: entry("Cash conversion cycle (days)", z.object({ dio: num, dso: num, dpo: num }), (a) => f.cashConversionCycle(a.dio, a.dso, a.dpo)),
  breakevenQuantity: entry("Breakeven quantity", z.object({ fixedCosts: num.min(0), price: num.positive(), variableCost: num.min(0) }), (a) => f.breakevenQuantity(a.fixedCosts, a.price, a.variableCost)),
  crossRate: entry("Cross rate A/C = A/B × B/C", z.object({ aPerB: num.positive(), bPerC: num.positive() }), (a) => f.crossRate(a.aPerB, a.bPerC)),
  forwardFx: entry("Covered-interest-parity forward (price/base)", z.object({ spot: num.positive(), iPrice: rate, iBase: rate, T: num.positive().default(1), compounding: z.enum(["simple", "annual"]).default("simple") }), (a) => f.forwardFx(a.spot, a.iPrice, a.iBase, a.T, a.compounding)),
  priceFromDiscountRate: entry("Money-market price from discount rate", z.object({ fv: num.positive(), discountRate: rate, days: num.positive(), year: z.union([z.literal(360), z.literal(365)]).default(360) }), (a) => f.priceFromDiscountRate(a.fv, a.discountRate, a.days, a.year)),
  straightLineDepreciation: entry("Straight-line depreciation per year", z.object({ cost: num.positive(), salvage: num.min(0), life: num.positive() }), (a) => f.straightLineDepreciation(a.cost, a.salvage, a.life)),
} as const;

export type CalcName = keyof typeof CALCS;

export interface CalcSpec {
  fn: string;
  args: unknown;
}

export type CalcResult = { ok: true; value: number } | { ok: false; error: string };

export function runCalc(spec: CalcSpec): CalcResult {
  const e = (CALCS as Record<string, (typeof CALCS)[CalcName]>)[spec.fn];
  if (!e) return { ok: false, error: `unknown calc fn "${spec.fn}"` };
  const parsed = e.args.safeParse(spec.args);
  if (!parsed.success) return { ok: false, error: `bad args for ${spec.fn}: ${parsed.error.message}` };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (e.run as (a: any) => number)(parsed.data);
    return Number.isFinite(value) ? { ok: true, value } : { ok: false, error: `${spec.fn} returned ${value}` };
  } catch (err) {
    return { ok: false, error: `${spec.fn} threw: ${(err as Error).message}` };
  }
}

/** True if `answer` matches the recomputed value within a relative (default 0.5%) or tiny absolute tolerance. */
export function matches(answer: number, expected: number, relTol = 0.005, absTol = 1e-6): boolean {
  return Math.abs(answer - expected) <= Math.max(absTol, relTol * Math.abs(expected));
}

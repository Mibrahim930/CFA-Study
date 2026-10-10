import { irr } from "./cashflows";

/** Holding period return including income. */
export function hpr(beginPrice: number, endPrice: number, income = 0): number {
  return (endPrice - beginPrice + income) / beginPrice;
}

export function arithmeticMean(xs: number[]): number {
  if (!xs.length) throw new Error("arithmeticMean of empty list");
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Geometric mean return of periodic returns (decimals). */
export function geometricMeanReturn(returns: number[]): number {
  if (!returns.length) throw new Error("geometricMeanReturn of empty list");
  const growth = returns.reduce((p, r) => p * (1 + r), 1);
  return Math.pow(growth, 1 / returns.length) - 1;
}

export function harmonicMean(xs: number[]): number {
  if (xs.some((x) => x <= 0)) throw new Error("harmonicMean requires positive values");
  return xs.length / xs.reduce((s, x) => s + 1 / x, 0);
}

/** Time-weighted return: compound the sub-period returns over the whole horizon. */
export function twr(subperiodReturns: number[]): number {
  return subperiodReturns.reduce((p, r) => p * (1 + r), 1) - 1;
}

/** Money-weighted return = IRR of the investor's cash flows (contributions negative, withdrawals/ending value positive). */
export function mwr(cashflows: number[]): number {
  return irr(cashflows);
}

/** Annualize a periodic return: periodsPerYear = 12 for monthly, 52 weekly, etc. (compounding). */
export function annualize(periodicReturn: number, periodsPerYear: number): number {
  return Math.pow(1 + periodicReturn, periodsPerYear) - 1;
}

/** Continuously compounded return from a holding period return. */
export function continuousReturn(holdingPeriodReturn: number): number {
  return Math.log(1 + holdingPeriodReturn);
}

/** Real return from nominal and inflation (exact Fisher relation). */
export function realReturn(nominal: number, inflation: number): number {
  return (1 + nominal) / (1 + inflation) - 1;
}

/** Return on equity of a leveraged portfolio: rp on total assets, rd paid on borrowed funds. */
export function leveragedReturn(rp: number, rd: number, equity: number, debt: number): number {
  return (rp * (equity + debt) - rd * debt) / equity;
}

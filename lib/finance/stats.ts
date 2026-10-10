import { arithmeticMean } from "./returns";

export type Basis = "sample" | "population";

export function variance(xs: number[], basis: Basis = "sample"): number {
  const n = xs.length;
  if (n < (basis === "sample" ? 2 : 1)) throw new Error("variance: not enough observations");
  const m = arithmeticMean(xs);
  const ss = xs.reduce((s, x) => s + (x - m) ** 2, 0);
  return ss / (basis === "sample" ? n - 1 : n);
}

export function stdev(xs: number[], basis: Basis = "sample"): number {
  return Math.sqrt(variance(xs, basis));
}

export function covariance(xs: number[], ys: number[], basis: Basis = "sample"): number {
  if (xs.length !== ys.length) throw new Error("covariance: length mismatch");
  const mx = arithmeticMean(xs);
  const my = arithmeticMean(ys);
  const s = xs.reduce((acc, x, i) => acc + (x - mx) * (ys[i] - my), 0);
  return s / (basis === "sample" ? xs.length - 1 : xs.length);
}

export function correlation(xs: number[], ys: number[]): number {
  return covariance(xs, ys) / (stdev(xs) * stdev(ys));
}

/** Target semideviation (sample): sqrt( Σ_{x<target} (x−target)² / (n−1) ). */
export function semideviation(xs: number[], target = arithmeticMean(xs)): number {
  const ss = xs.filter((x) => x < target).reduce((s, x) => s + (x - target) ** 2, 0);
  return Math.sqrt(ss / (xs.length - 1));
}

export function coefficientOfVariation(xs: number[]): number {
  return stdev(xs) / arithmeticMean(xs);
}

/** Sample skewness (CFA-style approximation: (1/n)·Σ(x−m)³ / s³). */
export function skewness(xs: number[]): number {
  const m = arithmeticMean(xs);
  const s = stdev(xs);
  return xs.reduce((a, x) => a + (x - m) ** 3, 0) / xs.length / s ** 3;
}

/** Sample excess kurtosis (CFA-style approximation: (1/n)·Σ(x−m)⁴ / s⁴ − 3). */
export function excessKurtosis(xs: number[]): number {
  const m = arithmeticMean(xs);
  const s = stdev(xs);
  return xs.reduce((a, x) => a + (x - m) ** 4, 0) / xs.length / s ** 4 - 3;
}

/** Two-asset portfolio standard deviation. */
export function portfolioStdev2(w1: number, sd1: number, sd2: number, corr: number, w2 = 1 - w1): number {
  return Math.sqrt(w1 ** 2 * sd1 ** 2 + w2 ** 2 * sd2 ** 2 + 2 * w1 * w2 * corr * sd1 * sd2);
}

/** N-asset portfolio variance from weights and a covariance matrix. */
export function portfolioVariance(weights: number[], cov: number[][]): number {
  return weights.reduce((s, wi, i) => s + weights.reduce((t, wj, j) => t + wi * wj * cov[i][j], 0), 0);
}

export function sharpeRatio(rp: number, rf: number, sdp: number): number {
  return (rp - rf) / sdp;
}

/** Roy's safety-first ratio. */
export function safetyFirstRatio(rp: number, threshold: number, sdp: number): number {
  return (rp - threshold) / sdp;
}

export interface Regression {
  slope: number;
  intercept: number;
  rSquared: number;
  /** Standard error of the estimate. */
  see: number;
  sst: number;
  ssr: number;
  sse: number;
  n: number;
  /** F-statistic = MSR / MSE (one independent variable). */
  f: number;
  /** t-stat of the slope against zero. */
  tSlope: number;
}

/** Ordinary least squares with one independent variable. */
export function simpleRegression(x: number[], y: number[]): Regression {
  const n = x.length;
  if (n !== y.length || n < 3) throw new Error("simpleRegression needs ≥3 paired observations");
  const mx = arithmeticMean(x);
  const my = arithmeticMean(y);
  const sxx = x.reduce((s, xi) => s + (xi - mx) ** 2, 0);
  const sxy = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0);
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const sst = y.reduce((s, yi) => s + (yi - my) ** 2, 0);
  const sse = y.reduce((s, yi, i) => s + (yi - (intercept + slope * x[i])) ** 2, 0);
  const ssr = sst - sse;
  const mse = sse / (n - 2);
  const see = Math.sqrt(mse);
  return {
    slope,
    intercept,
    rSquared: ssr / sst,
    see,
    sst,
    ssr,
    sse,
    n,
    f: ssr / mse,
    tSlope: slope / (see / Math.sqrt(sxx)),
  };
}

/** Standard normal CDF (Abramowitz–Stegun 7.1.26 erf approximation, |error| < 1.5e-7). */
export function normCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

/** Bayes: P(A|B) = P(B|A)·P(A) / P(B). */
export function bayes(pBgivenA: number, pA: number, pB: number): number {
  return (pBgivenA * pA) / pB;
}

/** Confidence interval for a mean with known/large-sample standard error. */
export function confidenceInterval(mean: number, sd: number, n: number, criticalValue: number): [number, number] {
  const se = sd / Math.sqrt(n);
  return [mean - criticalValue * se, mean + criticalValue * se];
}

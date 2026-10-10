/**
 * Level I derivative pricing, discrete annual compounding unless the name says otherwise.
 * T in years; r is the annual risk-free rate (decimal).
 */

/** No-arbitrage forward price: F0 = (S0 − PV(benefits) + PV(costs))·(1+r)^T. */
export function forwardPrice(spot: number, r: number, T: number, pvBenefits = 0, pvCosts = 0): number {
  return (spot - pvBenefits + pvCosts) * Math.pow(1 + r, T);
}

/** Continuous-compounding forward with yield q and storage-cost rate c: F0 = S0·e^{(r + c − q)T}. */
export function forwardPriceContinuous(spot: number, r: number, T: number, q = 0, c = 0): number {
  return spot * Math.exp((r + c - q) * T);
}

/**
 * Value of a long forward at time t (0 ≤ t ≤ T): Vt = St − PV(remaining benefits) + PV(costs) − F0/(1+r)^{T−t}.
 */
export function forwardValueLong(
  spotT: number,
  f0: number,
  r: number,
  timeRemaining: number,
  pvBenefits = 0,
  pvCosts = 0,
): number {
  return spotT - pvBenefits + pvCosts - f0 / Math.pow(1 + r, timeRemaining);
}

/** Put–call parity: C + PV(X) = P + S0 (European, no dividends). Returns the missing call value. */
export function callFromParity(put: number, spot: number, strike: number, r: number, T: number): number {
  return put + spot - strike / Math.pow(1 + r, T);
}

export function putFromParity(call: number, spot: number, strike: number, r: number, T: number): number {
  return call - spot + strike / Math.pow(1 + r, T);
}

/** Put–call–forward parity: C − P = (F0 − X)/(1+r)^T. Returns C − P. */
export function callMinusPutFromForward(forward: number, strike: number, r: number, T: number): number {
  return (forward - strike) / Math.pow(1 + r, T);
}

export function callPayoff(spotT: number, strike: number): number {
  return Math.max(0, spotT - strike);
}

export function putPayoff(spotT: number, strike: number): number {
  return Math.max(0, strike - spotT);
}

/** European option value lower bounds (no dividends). */
export function callLowerBound(spot: number, strike: number, r: number, T: number): number {
  return Math.max(0, spot - strike / Math.pow(1 + r, T));
}

export function putLowerBound(spot: number, strike: number, r: number, T: number): number {
  return Math.max(0, strike / Math.pow(1 + r, T) - spot);
}

export interface BinomialResult {
  /** Risk-neutral probability of the up move. */
  q: number;
  value: number;
  /** Hedge ratio (shares of underlying per option) for replication. */
  hedgeRatio: number;
  payoffUp: number;
  payoffDown: number;
}

/**
 * One-period binomial model. u, d are gross up/down factors (e.g. 1.2, 0.8); r is the
 * per-period risk-free rate; requires d < 1+r < u.
 */
export function binomialOnePeriod(
  spot: number,
  strike: number,
  u: number,
  d: number,
  r: number,
  kind: "call" | "put",
): BinomialResult {
  if (!(d < 1 + r && 1 + r < u)) throw new Error("binomial requires d < 1 + r < u (no arbitrage)");
  const q = (1 + r - d) / (u - d);
  const payoff = kind === "call" ? callPayoff : putPayoff;
  const payoffUp = payoff(spot * u, strike);
  const payoffDown = payoff(spot * d, strike);
  return {
    q,
    value: (q * payoffUp + (1 - q) * payoffDown) / (1 + r),
    hedgeRatio: (payoffUp - payoffDown) / (spot * u - spot * d),
    payoffUp,
    payoffDown,
  };
}

/**
 * Fixed swap rate (per settlement period) from discount factors of each settlement date:
 * s = (1 − DF_N) / Σ DF_i.
 */
export function swapFixedRate(discountFactors: number[]): number {
  const sum = discountFactors.reduce((a, b) => a + b, 0);
  return (1 - discountFactors[discountFactors.length - 1]) / sum;
}

/** Discount factors from (per-period) spot rates: DF_i = 1/(1+z_i)^i. */
export function discountFactors(spots: number[]): number[] {
  return spots.map((z, i) => 1 / Math.pow(1 + z, i + 1));
}

/**
 * Value of a receive-fixed swap (per unit notional) after initiation:
 * (fixed rate − current swap rate) × Σ remaining DFs × notional.
 */
export function swapValueReceiveFixed(
  fixedRate: number,
  currentSwapRate: number,
  remainingDFs: number[],
  notional = 1,
): number {
  return (fixedRate - currentSwapRate) * remainingDFs.reduce((a, b) => a + b, 0) * notional;
}

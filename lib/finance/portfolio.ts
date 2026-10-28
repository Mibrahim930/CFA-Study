/**
 * Portfolio, equity-margin and alternatives measures that the 2026-10 formula cross-check found missing
 * (docs/formula-crosscheck-2026-10.md): Treynor ratio, Jensen's alpha, beta, the margin-call price and the
 * hedge-fund "2 and 20" fee. Pure functions; rates and returns are decimals.
 */

/** Beta of an asset: cov(asset, market) / var(market). */
export function beta(covarianceWithMarket: number, marketVariance: number): number {
  if (marketVariance <= 0) throw new Error("beta requires a positive market variance");
  return covarianceWithMarket / marketVariance;
}

/** Treynor ratio = (Rp − Rf) / βp: excess return per unit of systematic risk. */
export function treynorRatio(rp: number, rf: number, betaP: number): number {
  if (betaP === 0) throw new Error("treynorRatio requires a non-zero beta");
  return (rp - rf) / betaP;
}

/** Jensen's alpha = Rp − [Rf + βp·(Rm − Rf)]: return above what the CAPM predicts. */
export function jensensAlpha(rp: number, rf: number, betaP: number, rm: number): number {
  return rp - (rf + betaP * (rm - rf));
}

/** M² (Modigliani–Modigliani) = (Rp − Rf)·σm/σp + Rf, in the same units as returns. */
export function mSquared(rp: number, rf: number, sdp: number, sdm: number): number {
  if (sdp <= 0) throw new Error("mSquared requires a positive portfolio standard deviation");
  return ((rp - rf) * sdm) / sdp + rf;
}

/**
 * Price at which a long margin position gets a margin call:
 *   P_call = P0 × (1 − initial margin) / (1 − maintenance margin).
 * Margins are fractions of the position value (0.5 = 50%).
 */
export function marginCallPrice(purchasePrice: number, initialMargin: number, maintenanceMargin: number): number {
  if (initialMargin <= 0 || initialMargin > 1) throw new Error("marginCallPrice: initial margin must be in (0, 1]");
  if (maintenanceMargin < 0 || maintenanceMargin >= 1) throw new Error("marginCallPrice: maintenance margin must be in [0, 1)");
  return (purchasePrice * (1 - initialMargin)) / (1 - maintenanceMargin);
}

export interface HedgeFundFeeInputs {
  /** Fund (or investor) value at the start of the period. */
  beginValue: number;
  /** Value at the end of the period, before any fees. */
  endValue: number;
  /** Management fee rate (default 2%). */
  managementRate?: number;
  /** Incentive (performance) fee rate (default 20%). */
  incentiveRate?: number;
  /** Management fee charged on ending value (the usual Level I assumption) or on beginning value. */
  managementBase?: "end" | "begin";
  /** Incentive fee on gains net of the management fee (usual) or on gross gains. */
  incentiveOn?: "net" | "gross";
  /** Hurdle rate the return must beat before an incentive fee is earned (default none). */
  hurdleRate?: number;
  /** Hard hurdle: incentive only on the return above the hurdle. Soft: on the whole gain once the hurdle is met. */
  hurdleType?: "hard" | "soft";
  /** High-water mark: incentive only on value above the previous peak (default: beginValue, i.e. no outstanding loss). */
  highWaterMark?: number;
}

export interface HedgeFundFeeResult {
  managementFee: number;
  incentiveFee: number;
  totalFee: number;
  /** Ending value after both fees. */
  netValue: number;
  /** Investor's return after fees. */
  netReturn: number;
}

/**
 * Hedge-fund fee structure ("2 and 20" by default). Defaults follow the common Level I simplification:
 * management fee on ending value, incentive fee on the gain net of the management fee, no hurdle, and the
 * high-water mark equal to the beginning value (so a fund below its previous peak must set `highWaterMark`).
 */
export function hedgeFundFee(p: HedgeFundFeeInputs): HedgeFundFeeResult {
  const managementRate = p.managementRate ?? 0.02;
  const incentiveRate = p.incentiveRate ?? 0.2;
  const managementBase = p.managementBase ?? "end";
  const incentiveOn = p.incentiveOn ?? "net";
  const hurdleRate = p.hurdleRate ?? 0;
  const hurdleType = p.hurdleType ?? "hard";
  const hwm = Math.max(p.highWaterMark ?? p.beginValue, p.beginValue);

  const managementFee = managementRate * (managementBase === "end" ? p.endValue : p.beginValue);
  const valueForIncentive = incentiveOn === "net" ? p.endValue - managementFee : p.endValue;
  // Gain that counts: above the high-water mark (which is at least the beginning value).
  let gain = valueForIncentive - hwm;
  const hurdleAmount = hurdleRate * p.beginValue;
  if (hurdleRate > 0) {
    if (gain < hurdleAmount) gain = 0;
    else if (hurdleType === "hard") gain -= hurdleAmount;
  }
  const incentiveFee = gain > 0 ? incentiveRate * gain : 0;
  const totalFee = managementFee + incentiveFee;
  const netValue = p.endValue - totalFee;
  return { managementFee, incentiveFee, totalFee, netValue, netReturn: netValue / p.beginValue - 1 };
}

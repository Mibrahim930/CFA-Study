/** WACC = wd·rd·(1 − t) + wp·rp + we·re. Weights should sum to 1. */
export function wacc(p: { wd: number; rd: number; tax: number; we: number; re: number; wp?: number; rp?: number }): number {
  return p.wd * p.rd * (1 - p.tax) + (p.wp ?? 0) * (p.rp ?? 0) + p.we * p.re;
}

/** CAPM required return: rf + β·(E[Rm] − rf). */
export function capm(rf: number, beta: number, marketReturn: number): number {
  return rf + beta * (marketReturn - rf);
}

/** Gordon growth (constant-growth DDM): V0 = D1 / (r − g). */
export function gordonValue(d1: number, r: number, g: number): number {
  if (r <= g) throw new Error("gordonValue requires r > g");
  return d1 / (r - g);
}

/** Implied required return from the Gordon model: r = D1/P0 + g. */
export function gordonImpliedReturn(d1: number, price: number, g: number): number {
  return d1 / price + g;
}

/** Sustainable growth: g = b × ROE (b = retention ratio). */
export function sustainableGrowth(retentionRatio: number, roe: number): number {
  return retentionRatio * roe;
}

/** Preferred stock (non-callable, non-convertible, perpetual): V = D / r. */
export function preferredValue(dividend: number, r: number): number {
  return dividend / r;
}

/** Justified forward P/E from the Gordon model: (1 − b)/(r − g). */
export function justifiedForwardPE(payoutRatio: number, r: number, g: number): number {
  return payoutRatio / (r - g);
}

/** Three-step DuPont: ROE = NI/Sales × Sales/Assets × Assets/Equity. */
export function dupont3(netIncome: number, revenue: number, avgAssets: number, avgEquity: number) {
  const netMargin = netIncome / revenue;
  const assetTurnover = revenue / avgAssets;
  const leverage = avgAssets / avgEquity;
  return { netMargin, assetTurnover, leverage, roe: netMargin * assetTurnover * leverage };
}

/** Five-step DuPont: tax burden × interest burden × EBIT margin × asset turnover × leverage. */
export function dupont5(p: {
  netIncome: number;
  ebt: number;
  ebit: number;
  revenue: number;
  avgAssets: number;
  avgEquity: number;
}) {
  const taxBurden = p.netIncome / p.ebt;
  const interestBurden = p.ebt / p.ebit;
  const ebitMargin = p.ebit / p.revenue;
  const assetTurnover = p.revenue / p.avgAssets;
  const leverage = p.avgAssets / p.avgEquity;
  return {
    taxBurden,
    interestBurden,
    ebitMargin,
    assetTurnover,
    leverage,
    roe: taxBurden * interestBurden * ebitMargin * assetTurnover * leverage,
  };
}

/** Cash conversion cycle = DIO + DSO − DPO (days). */
export function cashConversionCycle(dio: number, dso: number, dpo: number): number {
  return dio + dso - dpo;
}

/** Days ratios from annual figures (365-day year by default). */
export function daysRatios(p: {
  revenue: number;
  avgReceivables: number;
  cogs: number;
  avgInventory: number;
  purchases: number;
  avgPayables: number;
  days?: number;
}) {
  const days = p.days ?? 365;
  const dso = days / (p.revenue / p.avgReceivables);
  const dio = days / (p.cogs / p.avgInventory);
  const dpo = days / (p.purchases / p.avgPayables);
  return { dso, dio, dpo, ccc: dio + dso - dpo };
}

/** Breakeven quantity = fixed costs / (price − variable cost per unit). */
export function breakevenQuantity(fixedCosts: number, price: number, variableCost: number): number {
  return fixedCosts / (price - variableCost);
}

/** Degree of operating leverage at quantity Q. */
export function dol(q: number, price: number, variableCost: number, fixedCosts: number): number {
  const contribution = q * (price - variableCost);
  return contribution / (contribution - fixedCosts);
}

/** Degree of financial leverage = EBIT / (EBIT − interest). */
export function dfl(ebit: number, interest: number): number {
  return ebit / (ebit - interest);
}

/** Basic EPS = (NI − preferred dividends) / weighted-average shares. */
export function basicEps(netIncome: number, preferredDividends: number, weightedShares: number): number {
  return (netIncome - preferredDividends) / weightedShares;
}

/** Cost of debt after tax. */
export function afterTaxCostOfDebt(rd: number, tax: number): number {
  return rd * (1 - tax);
}

/** Modigliani–Miller with taxes: V_L = V_U + t·D. */
export function leveredFirmValue(unleveredValue: number, tax: number, debt: number): number {
  return unleveredValue + tax * debt;
}

/** MM Proposition II (no taxes): re = r0 + (r0 − rd)·D/E. With taxes multiply the spread by (1 − t). */
export function mmCostOfEquity(r0: number, rd: number, debt: number, equity: number, tax = 0): number {
  return r0 + (r0 - rd) * (1 - tax) * (debt / equity);
}

/**
 * Quotes use "price/base" notation: a quote of 1.10 USD/EUR means 1 EUR costs 1.10 USD.
 */

/** Cross rate: (A/B) × (B/C) = A/C. E.g. JPY/USD × USD/EUR = JPY/EUR. */
export function crossRate(aPerB: number, bPerC: number): number {
  return aPerB * bPerC;
}

/**
 * Covered interest parity forward (price/base quote):
 * F = S × (1 + i_price × T) / (1 + i_base × T) using simple (money-market) interest over T years.
 */
export function forwardFx(spot: number, iPrice: number, iBase: number, T = 1, compounding: "simple" | "annual" = "simple"): number {
  if (compounding === "annual") return spot * Math.pow((1 + iPrice) / (1 + iBase), T);
  return (spot * (1 + iPrice * T)) / (1 + iBase * T);
}

/** Forward points (in pips) = (F − S) × 10,000 for a 4-decimal quote. */
export function forwardPoints(spot: number, forward: number, pipScale = 10_000): number {
  return (forward - spot) * pipScale;
}

/** Forward premium (+) / discount (−) of the base currency as a percentage of spot. */
export function forwardPremium(spot: number, forward: number): number {
  return forward / spot - 1;
}

/** Percentage change in the BASE currency's value when a price/base quote moves from s0 to s1. */
export function baseCurrencyChange(s0: number, s1: number): number {
  return s1 / s0 - 1;
}

/** Real exchange rate (price/base) = nominal × (CPI_base / CPI_price). */
export function realExchangeRate(nominal: number, cpiBase: number, cpiPrice: number): number {
  return (nominal * cpiBase) / cpiPrice;
}

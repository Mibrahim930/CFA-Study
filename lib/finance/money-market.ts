/**
 * Money market yield conventions. `days` = days to maturity, `year` = day-count basis (360 or 365).
 */

/** Price from a discount-rate quote: PV = FV × (1 − (days/year) × DR). */
export function priceFromDiscountRate(fv: number, discountRate: number, days: number, year = 360): number {
  return fv * (1 - (days / year) * discountRate);
}

export function discountRate(pv: number, fv: number, days: number, year = 360): number {
  return (year / days) * ((fv - pv) / fv);
}

/** Add-on rate: AOR = (year/days) × (FV − PV)/PV. */
export function addOnRate(pv: number, fv: number, days: number, year = 365): number {
  return (year / days) * ((fv - pv) / pv);
}

/** Bond-equivalent yield: add-on rate on a 365-day year. */
export function bondEquivalentYield(pv: number, fv: number, days: number): number {
  return addOnRate(pv, fv, days, 365);
}

/** Convert between periodicities: rate compounded m1 times/yr → equivalent rate compounded m2 times/yr. */
export function convertPeriodicity(rate: number, m1: number, m2: number): number {
  return m2 * (Math.pow(1 + rate / m1, m1 / m2) - 1);
}

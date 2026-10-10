export function straightLineDepreciation(cost: number, salvage: number, life: number): number {
  return (cost - salvage) / life;
}

/**
 * Declining-balance schedule (rate multiple 2 = double-declining). Depreciation stops at salvage.
 * Returns the charge for each year.
 */
export function decliningBalanceSchedule(cost: number, salvage: number, life: number, multiple = 2): number[] {
  const rate = multiple / life;
  const out: number[] = [];
  let book = cost;
  for (let y = 0; y < life; y++) {
    const charge = Math.min(book * rate, Math.max(0, book - salvage));
    out.push(charge);
    book -= charge;
  }
  return out;
}

/** Units-of-production depreciation for one period. */
export function unitsOfProduction(cost: number, salvage: number, totalUnits: number, unitsThisPeriod: number): number {
  return ((cost - salvage) / totalUnits) * unitsThisPeriod;
}

export interface InventoryLayer {
  units: number;
  unitCost: number;
}

/**
 * Periodic inventory costing. `layers` in purchase order (beginning inventory first).
 * Returns COGS and ending inventory for `unitsSold`.
 */
export function inventoryCosting(layers: InventoryLayer[], unitsSold: number, method: "FIFO" | "LIFO" | "WAC") {
  const totalUnits = layers.reduce((s, l) => s + l.units, 0);
  const totalCost = layers.reduce((s, l) => s + l.units * l.unitCost, 0);
  if (unitsSold > totalUnits) throw new Error("cannot sell more units than available");
  if (method === "WAC") {
    const avg = totalCost / totalUnits;
    return { cogs: unitsSold * avg, endingInventory: (totalUnits - unitsSold) * avg };
  }
  const ordered = method === "FIFO" ? layers : [...layers].reverse();
  let remaining = unitsSold;
  let cogs = 0;
  for (const l of ordered) {
    const take = Math.min(l.units, remaining);
    cogs += take * l.unitCost;
    remaining -= take;
    if (remaining === 0) break;
  }
  return { cogs, endingInventory: totalCost - cogs };
}

/** Deferred tax: DTL (+) when carrying amount of an asset exceeds its tax base; DTA (−) when less. */
export function deferredTaxOnAsset(carryingAmount: number, taxBase: number, taxRate: number): number {
  return (carryingAmount - taxBase) * taxRate;
}

/** Income tax expense = taxes payable + ΔDTL − ΔDTA. */
export function incomeTaxExpense(taxesPayable: number, changeInDTL: number, changeInDTA: number): number {
  return taxesPayable + changeInDTL - changeInDTA;
}

/** Common liquidity and solvency ratios. */
export const ratios = {
  current: (ca: number, cl: number) => ca / cl,
  quick: (cash: number, shortTermInvestments: number, receivables: number, cl: number) =>
    (cash + shortTermInvestments + receivables) / cl,
  cash: (cash: number, shortTermInvestments: number, cl: number) => (cash + shortTermInvestments) / cl,
  debtToEquity: (totalDebt: number, equity: number) => totalDebt / equity,
  interestCoverage: (ebit: number, interest: number) => ebit / interest,
  grossMargin: (grossProfit: number, revenue: number) => grossProfit / revenue,
  roa: (netIncome: number, avgAssets: number) => netIncome / avgAssets,
  roe: (netIncome: number, avgEquity: number) => netIncome / avgEquity,
};

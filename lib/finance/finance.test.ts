import { describe, expect, it } from "vitest";
import * as f from "./index";
import { CALCS, matches, runCalc } from "./registry";

// Reference values were computed independently (plain Python) and are standard textbook results.
const close = (actual: number, expected: number, digits = 4) => expect(actual).toBeCloseTo(expected, digits);

describe("time value of money", () => {
  it("FV / PV of a lump sum", () => {
    close(f.fv(0.1, 2, 0, -100), 121);
    close(f.pv(0.1, 2, 0, 121), -100);
  });
  it("PV of an ordinary annuity and an annuity due", () => {
    close(f.pv(0.1, 5, 100), -379.0787);
    close(f.pv(0.1, 5, 100, 0, 1), -379.0787 * 1.1);
  });
  it("mortgage payment", () => close(f.pmt(0.06 / 12, 360, 100_000), -599.5505));
  it("rate and number of periods", () => {
    close(f.rate(10, 0, -1000, 2000), 0.071773, 6);
    close(f.nper(0.071773, 0, -1000, 2000), 10, 3);
    close(f.nper(0, -100, 1000), 10);
  });
  it("zero rate is handled", () => close(f.fv(0, 5, -100, 0), 500));
  it("EAR", () => {
    close(f.effectiveAnnualRate(0.12, 12), 0.126825, 6);
    close(f.effectiveAnnualRate(0.12, Infinity), Math.exp(0.12) - 1, 9);
  });
});

describe("cash flows", () => {
  const cfs = [-1000, 500, 500, 500];
  it("NPV and IRR", () => {
    close(f.npv(0.1, cfs), 243.426, 3);
    close(f.irr(cfs), 0.233752, 6);
    close(f.npv(f.irr(cfs), cfs), 0, 6);
  });
  it("IRR rejects flows without a sign change", () => expect(() => f.irr([100, 100])).toThrow());
  it("payback", () => close(f.payback([-1000, 400, 400, 400])!, 2.5));
});

describe("returns", () => {
  it("TWR, geometric mean, harmonic mean", () => {
    close(f.twr([0.1, -0.05]), 0.045, 9);
    close(f.geometricMeanReturn([0.1, -0.1]), -0.005013, 6);
    close(f.harmonicMean([10, 20]), 13.3333);
  });
  it("MWR is the IRR of investor flows", () => {
    // buy 1 sh @100; t1 buy 1 sh @120, receive $2 dividend; t2 sell 2 @130 + $4 dividends
    close(f.mwr([-100, -118, 264]), 0.138612, 5);
  });
  it("HPR and real return", () => {
    close(f.hpr(100, 105, 3), 0.08, 9);
    close(f.realReturn(0.08, 0.03), 1.08 / 1.03 - 1, 9);
  });
});

describe("statistics", () => {
  const xs = [2, 4, 4, 4, 5, 5, 7, 9];
  it("variance and stdev", () => {
    close(f.variance(xs), 32 / 7, 9);
    close(f.variance(xs, "population"), 4, 9);
    close(f.stdev(xs, "population"), 2, 9);
  });
  it("covariance / correlation of a perfect linear relation", () => {
    const ys = xs.map((x) => 3 * x + 1);
    close(f.correlation(xs, ys), 1, 9);
  });
  it("two-asset portfolio risk", () => {
    close(f.portfolioStdev2(0.5, 0.2, 0.2, 1), 0.2, 9);
    close(f.portfolioStdev2(0.5, 0.2, 0.2, -1), 0, 9);
    close(f.portfolioStdev2(0.6, 0.2, 0.1, 0.3), Math.sqrt(0.36 * 0.04 + 0.16 * 0.01 + 2 * 0.6 * 0.4 * 0.3 * 0.2 * 0.1), 9);
  });
  it("simple regression recovers a known line", () => {
    const x = [1, 2, 3, 4, 5];
    const y = x.map((v) => 2 + 0.5 * v);
    const r = f.simpleRegression(x, y);
    close(r.slope, 0.5, 9);
    close(r.intercept, 2, 9);
    close(r.rSquared, 1, 9);
  });
  it("normal CDF", () => {
    close(f.normCdf(0), 0.5, 6);
    close(f.normCdf(1.96), 0.975, 3);
  });
});

describe("fixed income", () => {
  const annual = { couponRate: 0.05, years: 10 };
  const semi = { couponRate: 0.05, years: 10, freq: 2 };
  it("bond prices", () => {
    close(f.bondPrice(annual, 0.06), 92.6399);
    close(f.bondPrice(semi, 0.06), 92.5613);
    close(f.bondPrice({ couponRate: 0.05, years: 5 }, 0.05), 100, 9); // par bond
    close(f.bondPrice({ couponRate: 0, years: 5 }, 0.05), 100 / 1.05 ** 5, 9); // zero
  });
  it("YTM inverts price", () => {
    close(f.ytm(annual, 92.6399), 0.06, 5);
    close(f.ytm(semi, 92.5613), 0.06, 5);
  });
  it("duration and convexity", () => {
    const b = { couponRate: 0.1, years: 3 };
    close(f.macaulayDuration(b, 0.1), 2.7355);
    close(f.modifiedDuration(b, 0.1), 2.4869);
    close(f.macaulayDuration({ couponRate: 0, years: 7 }, 0.04), 7, 9); // zero: MacDur = maturity
    const p0 = f.bondPrice(b, 0.1);
    const approx = f.approxModifiedDuration(f.bondPrice(b, 0.099), f.bondPrice(b, 0.101), p0, 0.001);
    close(approx, 2.4869, 3);
    // duration+convexity estimate tracks actual repricing for a 100bp shock
    const md = f.modifiedDuration(annual, 0.06);
    const cx = f.convexity(annual, 0.06);
    const est = f.priceChangeEstimate(md, cx, 0.01);
    const actual = f.bondPrice(annual, 0.07) / f.bondPrice(annual, 0.06) - 1;
    expect(Math.abs(est - actual)).toBeLessThan(0.001);
  });
  it("term structure", () => {
    close(f.forwardRate(0.02, 1, 0.03, 2), 0.040098, 6);
    close(f.parRate([0.01, 0.02, 0.03]), 0.029604, 6);
    const spots = f.spotsFromPar([0.01, 0.02, 0.029604]);
    close(spots[2], 0.03, 5);
  });
  it("accrued interest between coupons", () => {
    const r = f.bondPriceBetweenCoupons({ couponRate: 0.06, years: 5 }, 0.06, 0.5);
    close(r.accrued, 3, 9);
    close(r.full, 100 * Math.sqrt(1.06), 9);
  });
  it("money market", () => {
    close(f.priceFromDiscountRate(100, 0.04, 90), 99, 9);
    close(f.discountRate(99, 100, 90), 0.04, 9);
  });
});

describe("derivatives", () => {
  it("forward price and put–call parity", () => {
    close(f.forwardPrice(100, 0.05, 1), 105, 9);
    close(f.callFromParity(5, 100, 100, 0.05, 1) - 5, 4.7619);
    close(f.putFromParity(f.callFromParity(5, 100, 100, 0.05, 1), 100, 100, 0.05, 1), 5, 9);
  });
  it("one-period binomial", () => {
    const call = f.binomialOnePeriod(100, 100, 1.2, 0.8, 0.05, "call");
    close(call.q, 0.625, 9);
    close(call.value, 11.9048);
    close(call.hedgeRatio, 0.5, 9);
    close(f.binomialOnePeriod(100, 100, 1.2, 0.8, 0.05, "put").value, 7.1429);
    expect(() => f.binomialOnePeriod(100, 100, 1.02, 0.9, 0.05, "call")).toThrow();
  });
  it("binomial values satisfy put–call parity", () => {
    const c = f.binomialOnePeriod(100, 95, 1.25, 0.85, 0.04, "call").value;
    const p = f.binomialOnePeriod(100, 95, 1.25, 0.85, 0.04, "put").value;
    close(c - p, 100 - 95 / 1.04, 9);
  });
  it("swap fixed rate", () => close(f.swapFixedRate(f.discountFactors([0.01, 0.02, 0.03])), 0.029604, 6));
});

describe("corporate, equity, FX, accounting", () => {
  it("WACC, CAPM, Gordon", () => {
    close(f.wacc({ wd: 0.4, rd: 0.06, tax: 0.25, we: 0.6, re: 0.1 }), 0.078, 9);
    close(f.capm(0.03, 1.2, 0.08), 0.09, 9);
    close(f.gordonValue(2, 0.1, 0.05), 40, 9);
    expect(() => f.gordonValue(2, 0.05, 0.05)).toThrow();
  });
  it("DuPont identity holds", () => {
    const d = f.dupont3(100, 1000, 2000, 800);
    close(d.roe, 100 / 800, 9);
  });
  it("FX cross rate and forward", () => {
    close(f.crossRate(150, 1.1), 165, 9);
    close(f.forwardFx(1.1, 0.05, 0.03), 1.121359, 6);
  });
  it("depreciation and inventory", () => {
    expect(f.decliningBalanceSchedule(10_000, 1_000, 5)[0]).toBe(4000);
    const sched = f.decliningBalanceSchedule(10_000, 1_000, 5);
    close(sched.reduce((a, b) => a + b, 0), 9000, 9); // never depreciates below salvage
    const layers = [
      { units: 100, unitCost: 10 },
      { units: 100, unitCost: 12 },
    ];
    expect(f.inventoryCosting(layers, 150, "FIFO").cogs).toBe(1600);
    expect(f.inventoryCosting(layers, 150, "LIFO").cogs).toBe(1700);
    close(f.inventoryCosting(layers, 150, "WAC").cogs, 1650, 9);
  });
});

describe("portfolio measures, margin and hedge-fund fees", () => {
  it("Treynor, Jensen's alpha, M² and beta", () => {
    close(f.treynorRatio(0.12, 0.03, 1.2), 0.075, 9);
    close(f.jensensAlpha(0.12, 0.03, 1.2, 0.1), 0.006, 9);
    close(f.mSquared(0.12, 0.03, 0.2, 0.15), 0.0975, 9);
    close(f.beta(0.018, 0.0225), 0.8, 9);
    expect(() => f.treynorRatio(0.1, 0.03, 0)).toThrow();
  });
  it("margin call price", () => {
    // Buy at 40 on 50% initial margin, 25% maintenance: call at 40 × 0.5 / 0.75
    close(f.marginCallPrice(40, 0.5, 0.25), 26.6667);
    expect(() => f.marginCallPrice(40, 0, 0.25)).toThrow();
  });
  it("2 and 20 with the Level I defaults (management on ending value, incentive on net gain)", () => {
    const r = f.hedgeFundFee({ beginValue: 100, endValue: 120 });
    close(r.managementFee, 2.4, 9);
    close(r.incentiveFee, 3.52, 9);
    close(r.totalFee, 5.92, 9);
    close(r.netReturn, 0.1408, 9);
  });
  it("fee variants: gross incentive, hard and soft hurdles, high-water mark, a loss year", () => {
    close(f.hedgeFundFee({ beginValue: 100, endValue: 120, incentiveOn: "gross" }).totalFee, 6.4, 9);
    close(f.hedgeFundFee({ beginValue: 100, endValue: 120, hurdleRate: 0.05 }).incentiveFee, 2.52, 9);
    close(f.hedgeFundFee({ beginValue: 100, endValue: 120, hurdleRate: 0.05, hurdleType: "soft" }).incentiveFee, 3.52, 9);
    close(f.hedgeFundFee({ beginValue: 100, endValue: 120, hurdleRate: 0.2 }).incentiveFee, 0, 9);
    close(f.hedgeFundFee({ beginValue: 100, endValue: 120, highWaterMark: 125 }).totalFee, 2.4, 9);
    const loss = f.hedgeFundFee({ beginValue: 100, endValue: 90 });
    close(loss.incentiveFee, 0, 9);
    close(loss.netReturn, -0.118, 9);
  });
  it("registry recomputes the new calcs with defaults", () => {
    const fee = runCalc({ fn: "hedgeFundFee", args: { beginValue: 100, endValue: 120 } });
    expect(fee.ok && fee.value).toBeCloseTo(5.92, 9);
    const call = runCalc({ fn: "marginCallPrice", args: { purchasePrice: 40, initialMargin: 0.5, maintenanceMargin: 0.25 } });
    expect(call.ok && call.value).toBeCloseTo(26.6667, 4);
    expect(runCalc({ fn: "marginCallPrice", args: { purchasePrice: 40, initialMargin: 1.5, maintenanceMargin: 0.25 } }).ok).toBe(false);
  });
});

describe("calc registry (verification gate)", () => {
  it("recomputes a bond price from a calc_spec", () => {
    const r = runCalc({ fn: "bondPrice", args: { bond: { couponRate: 0.05, years: 10 }, ytm: 0.06 } });
    expect(r.ok && r.value).toBeCloseTo(92.6399, 4);
  });
  it("rejects unknown functions and bad args", () => {
    expect(runCalc({ fn: "nope", args: {} }).ok).toBe(false);
    expect(runCalc({ fn: "npv", args: { rate: 0.1 } }).ok).toBe(false);
  });
  it("matching tolerance", () => {
    expect(matches(92.64, 92.6399)).toBe(true);
    expect(matches(95, 92.6399)).toBe(false);
  });
  it("registry exposes the core Level I calculations", () => {
    expect(Object.keys(CALCS).length).toBeGreaterThan(35);
  });
});

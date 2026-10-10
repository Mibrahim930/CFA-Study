/**
 * Robust root finding: bracket expansion + bisection, polished with Newton steps.
 * Used for IRR, YTM and TVM rate — all monotone on the relevant domain.
 */
export function findRoot(
  f: (x: number) => number,
  opts: { lo?: number; hi?: number; guess?: number; tol?: number; maxIter?: number } = {},
): number {
  const tol = opts.tol ?? 1e-12;
  const maxIter = opts.maxIter ?? 500;
  let lo = opts.lo ?? -0.9999;
  let hi = opts.hi ?? 1;

  let flo = f(lo);
  let fhi = f(hi);
  // Expand the upper bound until the sign changes (rates rarely exceed a few hundred %).
  for (let i = 0; i < 60 && Math.sign(flo) === Math.sign(fhi); i++) {
    hi = hi * 2 + 1;
    fhi = f(hi);
  }
  if (!Number.isFinite(flo) || !Number.isFinite(fhi) || Math.sign(flo) === Math.sign(fhi)) {
    throw new Error("findRoot: could not bracket a root");
  }

  let x = opts.guess !== undefined && opts.guess > lo && opts.guess < hi ? opts.guess : (lo + hi) / 2;
  for (let i = 0; i < maxIter; i++) {
    const fx = f(x);
    if (Math.abs(fx) < tol) return x;
    if (Math.sign(fx) === Math.sign(flo)) {
      lo = x;
      flo = fx;
    } else {
      hi = x;
    }
    // Newton step with a numerical derivative; fall back to bisection if it leaves the bracket.
    const h = Math.max(1e-7, Math.abs(x) * 1e-7);
    const d = (f(x + h) - f(x - h)) / (2 * h);
    let nx = d !== 0 && Number.isFinite(d) ? x - fx / d : NaN;
    if (!(nx > lo && nx < hi)) nx = (lo + hi) / 2;
    if (Math.abs(nx - x) < tol * (1 + Math.abs(x))) return nx;
    x = nx;
  }
  return x;
}

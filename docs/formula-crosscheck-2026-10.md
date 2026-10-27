# Cross-check: lib/finance vs cfa-frm-formula-sheets (CFA Level I, 44 entries)

Run on 2026-10-27. "match" = dataset formula and engine agree to 1e-9 on sample inputs.

| id | topic | formula | result | note |
|---|---|---|---|---|
| cfa1-001 | Quantitative Methods | Future value (discrete compounding) | match |  |
| cfa1-002 | Quantitative Methods | Present value of an ordinary annuity | match |  |
| cfa1-003 | Quantitative Methods | Present value of a perpetuity | match |  |
| cfa1-004 | Quantitative Methods | Effective annual rate | match |  |
| cfa1-005 | Quantitative Methods | Continuous compounding | match |  |
| cfa1-006 | Quantitative Methods | Holding period return | match |  |
| cfa1-007 | Quantitative Methods | Geometric mean return | match |  |
| cfa1-008 | Quantitative Methods | Sample variance | match |  |
| cfa1-009 | Quantitative Methods | Coefficient of variation | match |  |
| cfa1-010 | Quantitative Methods | Sharpe ratio | match |  |
| cfa1-011 | Quantitative Methods | Sample correlation | match |  |
| cfa1-012 | Quantitative Methods | Bayes' formula | match |  |
| cfa1-013 | Quantitative Methods | z-statistic / standardization | n/a | z = (X − μ)/σ: no engine function; trivial arithmetic. Lesson quant-06-los2 lists it. |
| cfa1-014 | Quantitative Methods | t-statistic for a mean | n/a | t = (x̄ − μ0)/(s/√n): no engine function; trivial. Lessons quant-07-los2/los3 list it. |
| cfa1-015 | Quantitative Methods | Simple linear regression slope | match |  |
| cfa1-016 | Quantitative Methods | Coefficient of determination (simple regression) | match |  |
| cfa1-017 | Economics | Price elasticity of demand | n/a | Price elasticity %ΔQ/%ΔP: no engine function (Economics not generated yet). |
| cfa1-018 | Economics | Covered interest rate parity (forward rate) | match | dataset writes F_{f/d} with f = price currency, same as the engine's price/base convention |
| cfa1-019 | Financial Statement Analysis | Current ratio | n/a | Current ratio: no engine function; trivial ratio. |
| cfa1-020 | Financial Statement Analysis | Cash conversion cycle | match |  |
| cfa1-021 | Financial Statement Analysis | DuPont (three-step) ROE | match |  |
| cfa1-022 | Financial Statement Analysis | Basic EPS | match |  |
| cfa1-023 | Financial Statement Analysis | Interest coverage | n/a | Interest coverage EBIT/interest: no engine function; trivial ratio. |
| cfa1-024 | Corporate Issuers | Weighted average cost of capital | match |  |
| cfa1-025 | Corporate Issuers | Net present value | match |  |
| cfa1-026 | Corporate Issuers | Degree of operating leverage | match |  |
| cfa1-027 | Corporate Issuers | Degree of financial leverage | match | dataset's Q(P−V)−F is EBIT; engine takes EBIT and interest directly |
| cfa1-028 | Corporate Issuers | CAPM cost of equity | match |  |
| cfa1-029 | Equity Investments | Gordon (constant) growth model | match |  |
| cfa1-030 | Equity Investments | Justified forward P/E | match |  |
| cfa1-031 | Equity Investments | Preferred stock value | match |  |
| cfa1-032 | Equity Investments | Margin call price (long) | **engine gap** | Margin call price P0(1−IM)/(1−MM): not in the engine. Equity topic (not generated yet). |
| cfa1-033 | Fixed Income | Bond price from yield | match |  |
| cfa1-034 | Fixed Income | Modified duration | match | annual-pay bond so r = yield per period; for semiannual bonds the engine divides by (1 + y/2), the dataset's 'r' must be read as the periodic yield |
| cfa1-035 | Fixed Income | Percentage price change (duration + convexity) | match |  |
| cfa1-036 | Fixed Income | Money duration and PVBP | match | PVBP = (PV− − PV+)/2 also matches f.pvbp (checked separately) |
| cfa1-037 | Fixed Income | Forward rate from spot rates | match | dataset states the identity (1+S_{A+B})^{A+B} = (1+S_A)^A (1+F)^B; solved for F here |
| cfa1-038 | Derivatives | Forward price (no income) | match |  |
| cfa1-039 | Derivatives | Put–call parity | match |  |
| cfa1-040 | Derivatives | One-period binomial risk-neutral probability | match |  |
| cfa1-041 | Portfolio Management | Two-asset portfolio variance | match |  |
| cfa1-042 | Portfolio Management | Beta | match | no dedicated beta() in the engine; both forms of the dataset's identity computed from engine primitives |
| cfa1-043 | Portfolio Management | Treynor ratio and Jensen's alpha | **engine gap** | Treynor ratio and Jensen's alpha: not in the engine. Portfolio topic (not generated yet). |
| cfa1-044 | Alternative Investments | Hedge fund 2-and-20 fee (simplified) | **engine gap** | Hedge-fund 2-and-20 fee: not in the engine. Alternatives topic (not generated yet). Dataset's version ignores the high-water mark, as it says. |

**Totals:** 36 match, 0 mismatch, 3 engine gaps, 5 not applicable (no engine function needed).

## Quant formulas: dataset vs the generated Quant lessons

| id | formula | in a lesson's formula list? |
|---|---|---|
| cfa1-001 | Future value (discrete compounding) | **not listed** |
| cfa1-002 | Present value of an ordinary annuity | **not listed** |
| cfa1-003 | Present value of a perpetuity | quant-04-los1, quant-04-los2 |
| cfa1-004 | Effective annual rate | **not listed** |
| cfa1-005 | Continuous compounding | quant-01-los1, quant-02-los1 |
| cfa1-006 | Holding period return | quant-01-los1, quant-02-los1 |
| cfa1-007 | Geometric mean return | quant-01-los1, quant-02-los1, quant-05-los1 |
| cfa1-008 | Sample variance | quant-05-los1, quant-06-los2 |
| cfa1-009 | Coefficient of variation | quant-05-los4 |
| cfa1-010 | Sharpe ratio | quant-08-los3 |
| cfa1-011 | Sample correlation | quant-05-los3, quant-06-los1, quant-07-los3, quant-08-los1, quant-08-los2, quant-10-los1, quant-10-los2 |
| cfa1-012 | Bayes' formula | quant-06-los4 |
| cfa1-013 | z-statistic / standardization | quant-06-los2 |
| cfa1-014 | t-statistic for a mean | quant-07-los2, quant-07-los3, quant-10-los2 |
| cfa1-015 | Simple linear regression slope | quant-10-los1, quant-10-los2, quant-10-los3 |
| cfa1-016 | Coefficient of determination (simple regression) | quant-07-los3, quant-10-los2 |

## Conclusions

- **Engine:** every one of the 36 dataset formulas that the engine implements agrees with it numerically. No notation or convention differences surfaced beyond two to keep in mind: the dataset's modified-duration "r" is the *periodic* yield (the engine already divides by 1 + y/freq), and its DFL is written in Q(P−V)−F terms where the engine takes EBIT directly.
- **Three engine gaps**, all in topics whose lessons aren't generated yet: margin call price (Equity), Treynor ratio and Jensen's alpha (Portfolio), hedge-fund 2-and-20 fee (Alternatives). Add them to `lib/finance` before generating those topics, so their calc items can be engine-checked.
- **Quant lessons:** 13 of the 16 Quant formulas appear in lesson formula lists. The three that don't (future value, PV of an annuity, effective annual rate) are time-value basics that the 2027 curriculum moved out of the Quant learning outcomes into pre-reading; the Quant primer covers all three as key terms, so a beginner still meets them first.
- **Verdict on the dataset:** correct as far as it goes, but with 44 formulas it is far from a complete Level I list (the lessons alone carry 156 Quant formulas). Useful as an outside sanity check, not as a source. Re-run with `npx tsx scripts/crosscheck-formulas.ts <formulas.json>` after engine changes.

Dataset: cfa-frm-formula-sheets v1.0.0 by UniPrep2Go (https://uniprep2go.study), CC BY 4.0, https://github.com/marfa77/cfa-frm-formula-sheets.

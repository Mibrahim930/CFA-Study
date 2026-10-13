/**
 * Learning outcomes no free source covers well enough to check a lesson against
 * (coverage audit "none": docs/coverage-report.md, docs/missing-sources.md).
 * The app flags them so the student knows to use the official curriculum reading for these.
 */
export interface SourceGap {
  /** Plain-language note shown under the learning outcome. */
  note: string;
  /** What to make sure the reading covers. */
  lookFor: string[];
}

export const SOURCE_GAPS: Record<string, SourceGap> = {
  "equity-09-los3": {
    note: "Free sources only cover part of this (market share and concentration). Study it from the official curriculum reading, and treat this app's material on it as a supplement.",
    lookFor: ["How to size an industry", "Growth: life-cycle stage, cyclical vs secular", "Industry profitability", "Reading market-share trends"],
  },
  "fixed-income-06-los3": {
    note: "No free textbook explains matrix pricing, so nothing here can be checked against a source. Study it from the official curriculum reading and this module's lecture.",
    lookFor: ["What matrix pricing is and when it's used", "Using comparable bonds' yields", "Interpolating a yield, then pricing the bond"],
  },
};

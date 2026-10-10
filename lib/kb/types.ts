/** A citable passage from a source document. */
export interface SourceChunk {
  id: string;
  source: "openstax" | "cfa-handbook" | "cfa-rf" | "mit-ocw" | "gov" | "other";
  /** Trust tier: T1 authoritative, T2 textbook, T3 explanatory. */
  tier: "T1" | "T2" | "T3";
  title: string;
  /** Human-readable location, e.g. "§7.2 Present Value — Overview". */
  locator: string;
  url: string;
  license: string;
  /** adapt = open licence (may be adapted with attribution); ground = read privately, never reproduced. */
  reuse: "adapt" | "ground";
  text: string;
}

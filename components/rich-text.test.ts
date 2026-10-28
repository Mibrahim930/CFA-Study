import { describe, expect, it } from "vitest";
import { renderRich } from "./rich-text";

describe("renderRich", () => {
  it("renders digit-led math when it contains LaTeX syntax, but not currency sums", () => {
    const html = renderRich("60% over 4 years is $1.6^{1/4}-1\\approx 12.47\\%$ a year, not $60\\%/4=15\\%$. Pay $100 now, then $105 at 5%.");
    expect(html).not.toContain("$1.6");
    expect(html).toContain("$100 now, then $105 at 5%");
    expect(html.match(/class="katex"/g)).toHaveLength(2);
  });
  it("keeps currency as text while rendering inline math", () => {
    const html = renderRich("Imagine $100 now or $105 next year. Use $PV = FV/(1+r)^n$ to discount.");
    expect(html).toContain("$100 now or $105 next year");
    expect(html).toContain("katex");
  });

  it("escapes HTML in lesson text", () => {
    expect(renderRich("<script>alert(1)</script>")).not.toContain("<script>");
  });

  it("renders bullet lists", () => {
    expect(renderRich("- one\n- two")).toContain("<ul");
  });
});

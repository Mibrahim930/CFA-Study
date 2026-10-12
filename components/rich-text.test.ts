import { describe, expect, it } from "vitest";
import { renderRich } from "./rich-text";

describe("renderRich", () => {
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

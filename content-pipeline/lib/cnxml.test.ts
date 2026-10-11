import { describe, expect, it } from "vitest";
import { cnxmlToText, splitModule } from "./cnxml";

const MODULE = `<document xmlns="http://cnx.rice.edu/cnxml" xmlns:m="http://www.w3.org/1998/Math/MathML">
  <title>Present Value</title>
  <content>
<para id="p1">Money today is worth more than money tomorrow &amp; here is why, because it can be invested to earn a return.</para>
<section class="learning-objectives" id="s0"><title>Learning Outcomes</title><para>skip me</para></section>
<section id="s1">
<title>Discounting</title>
<para id="p2">The formula is <m:math><m:mi>PV</m:mi><m:mo>=</m:mo><m:mi>FV</m:mi><m:mo>/</m:mo><m:mn>1.1</m:mn></m:math> for one year.</para>
<section id="s1a"><title>Nested</title><para>Nested text stays with its parent section.</para></section>
</section>
</content>
</document>`;

describe("cnxml", () => {
  it("splits top-level sections, skips learning objectives, flattens MathML", () => {
    const { title, sections } = splitModule(MODULE);
    expect(title).toBe("Present Value");
    expect(sections.map((s) => s.title)).toEqual(["Overview", "Discounting"]);
    expect(sections[0].text).toContain("Money today is worth more than money tomorrow & here is why, because it can be invested");
    expect(sections[1].text).toContain("PV = FV / 1.1");
    expect(sections[1].text).toContain("Nested text stays with its parent section.");
    expect(sections.some((s) => s.text.includes("skip me"))).toBe(false);
  });

  it("gives identical output for Windows (CRLF) checkouts", () => {
    const crlf = MODULE.replace(/\n/g, "\r\n");
    expect(splitModule(crlf)).toEqual(splitModule(MODULE));
    expect(cnxmlToText("<para>a</para>\r\n<para>b</para>")).toBe(cnxmlToText("<para>a</para>\n<para>b</para>"));
  });
});

import { describe, expect, it } from "vitest";
import { decodeEntities, htmlTitle, htmlToText } from "./html-text";

describe("decodeEntities", () => {
  it("decodes named, decimal and hex entities and leaves unknown ones", () => {
    expect(decodeEntities("A&amp;B &ndash; 5&#37; &#x3C;&#X3e; &bogus;")).toBe("A&B – 5% <> &bogus;");
  });
  it("ignores out-of-range numeric entities", () => {
    expect(decodeEntities("&#99999999;")).toBe("&#99999999;");
  });
});

describe("htmlTitle", () => {
  it("returns the decoded title", () => {
    expect(htmlTitle("<html><head><title> Basics &amp;\n Futures </title></head></html>")).toBe("Basics & Futures");
    expect(htmlTitle("<p>no title</p>")).toBe("");
  });
});

describe("htmlToText", () => {
  const page = `<!doctype html><html><head><title>T</title><style>.x{color:red}</style><script>var a = "<p>no</p>";</script></head>
<body><header><a href="/">Home</a></header><nav>Menu item</nav>
<main><h1>Futures  Basics</h1><p>A <b>futures</b> contract is an agreement&nbsp;to buy.</p>
<ul><li>Hedgers</li><li>Speculators &amp; arbitrageurs</li></ul>
<table><tr><th>Term</th><td>Value</td></tr></table>
<!-- hidden comment --><p>${"Filler sentence for the main region. ".repeat(12)}</p></main>
<footer>Copyright footer</footer></body></html>`;

  it("keeps article text with line structure and entities decoded", () => {
    const t = htmlToText(page);
    expect(t).toContain("Futures Basics\nA futures contract is an agreement to buy.");
    expect(t).toContain("- Hedgers\n- Speculators & arbitrageurs");
    expect(t).toContain("Term | Value");
  });

  it("drops scripts, styles, nav, header, footer and comments", () => {
    const t = htmlToText(page);
    for (const bad of ["color:red", "no</p>", "Menu item", "Home", "Copyright footer", "hidden comment", "<"]) expect(t).not.toContain(bad);
  });

  it("falls back to the body when there is no substantial main region", () => {
    expect(htmlToText("<body><main>tiny</main><p>Body text outside main.</p></body>")).toBe("tiny\nBody text outside main.");
  });

  it("handles fragments without a body and collapses blank lines", () => {
    expect(htmlToText("<p>One</p>\n\n\n<p>Two<br>Three</p>")).toBe("One\nTwo\nThree");
  });

  it("drops menu-like runs of short unpunctuated lines but keeps short lists and sentences", () => {
    const menu = ["Basics", "Data", "Prices", "Imports", "Exports", "Outlook", "History"].map((x) => `<li>${x}</li>`).join("");
    const t = htmlToText(`<main><p>Oil is traded globally.</p><ul>${menu}</ul><p>Short list:</p><ul><li>Spot</li><li>Futures</li></ul><p>${"Body sentence here. ".repeat(20)}</p></main>`);
    expect(t).not.toContain("Outlook");
    expect(t).toContain("Oil is traded globally.");
    expect(t).toContain("Short list:\n- Spot\n- Futures");
  });
});

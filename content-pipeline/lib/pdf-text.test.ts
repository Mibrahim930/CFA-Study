import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractPdfText } from "./pdf-text";

const FIXTURE = fileURLToPath(new URL("./__fixtures__/two-lines.pdf", import.meta.url));

describe("extractPdfText (pdf.js, cross-platform)", () => {
  it("keeps lines separate and superscripts inline", async () => {
    const lines = (await extractPdfText(FIXTURE)).split("\n").filter(Boolean);
    expect(lines).toEqual(["Present value discounting", "Second line M2"]);
  }, 30_000); // pdf.js cold start can exceed the 5s default on the Windows CI runner
});

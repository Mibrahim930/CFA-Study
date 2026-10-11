import { describe, expect, it } from "vitest";
import { chunkPages, cleanPage, pageLocator } from "./chunk-pages";

describe("cleanPage", () => {
  it("joins hyphenated words and drops page numbers", () => {
    expect(cleanPage("The invest-\nment adviser\r\n12\nmust disclose.")).toEqual(["The investment adviser", "must disclose."]);
  });
});

describe("chunkPages", () => {
  const sentence = "Members must place client interests before their own.";

  it("cuts at sentence ends near the target and tracks page ranges", () => {
    const page = Array(30).fill(sentence).join("\n");
    const chunks = chunkPages([page, page], 600);
    expect(chunks.length).toBeGreaterThan(2);
    for (const c of chunks) expect(c.text.endsWith(".")).toBe(true);
    expect(chunks[0].startPage).toBe(1);
    expect(chunks.at(-1)!.endPage).toBe(2);
    expect(chunks.some((c) => c.startPage === 1 && c.endPage === 2)).toBe(true);
  });

  it("merges a short tail into the previous chunk", () => {
    const chunks = chunkPages([Array(12).fill(sentence).join("\n"), "Short tail."], 600);
    expect(chunks.at(-1)!.text.endsWith("Short tail.")).toBe(true);
    expect(pageLocator(chunks.at(-1)!)).toMatch(/–2$/);
  });
});

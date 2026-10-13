import { describe, expect, it } from "vitest";
import { buildBackup, daysSinceBackup, describeBackup, LAST_BACKUP_KEY, parseBackup } from "./backup";

const now = new Date("2026-10-13T16:00:00.000Z");
const entries = {
  "l1:module:quant-1": JSON.stringify({ done: true, losDone: [], videos: [], notes: [{ id: "a", text: "x", createdAt: 1 }] }),
  "l1:module:quant-2": JSON.stringify({ done: false, losDone: [], videos: [], notes: [] }),
  "l1:review": JSON.stringify({ "quant-01-los1:f1": {}, "quant-01-los1:q2": {} }),
  "l1:trial:uworld": "2026-10-01",
  [LAST_BACKUP_KEY]: "123",
  "other-app:key": "ignored",
};

describe("backup", () => {
  it("keeps only this app's keys and skips the last-backup marker", () => {
    const b = buildBackup(entries, now);
    expect(Object.keys(b.entries).sort()).toEqual(["l1:module:quant-1", "l1:module:quant-2", "l1:review", "l1:trial:uworld"]);
    expect(b.exportedAt).toBe("2026-10-13T16:00:00.000Z");
  });

  it("round-trips through JSON and summarises what it holds", () => {
    const b = parseBackup(JSON.stringify(buildBackup(entries, now)));
    expect(describeBackup(b)).toEqual({ modules: 1, cards: 2, notes: 1 });
  });

  it("rejects files that aren't this app's backups, with a readable message", () => {
    expect(() => parseBackup("not json")).toThrow(/isn't a backup/);
    expect(() => parseBackup(JSON.stringify({ app: "other", entries: {} }))).toThrow(/isn't a backup/);
    expect(() => parseBackup(JSON.stringify({ app: "l1-study", version: 2, entries: {} }))).toThrow(/version 2/);
    expect(() => parseBackup(JSON.stringify({ app: "l1-study", version: 1, entries: { "evil:key": "x" } }))).toThrow(/unexpected entry/);
  });

  it("counts days since the last backup", () => {
    expect(daysSinceBackup(null, now.getTime())).toBeNull();
    expect(daysSinceBackup(now.getTime() - 8 * 86_400_000, now.getTime())).toBe(8);
  });
});

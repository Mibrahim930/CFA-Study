import { describe, expect, it } from "vitest";
import { planPull, planPush, planPushResult } from "./sync-merge";

describe("sync merge plans", () => {
  it("pull applies what is newer than last seen and keeps a later local change", () => {
    const entries = [
      { key: "l1:review", value: "server", updatedAt: 200 },
      { key: "l1:settings", value: "server", updatedAt: 100 },
      { key: "l1:practice", value: "server", updatedAt: 300 },
      { key: "l1:mock:session", value: null, updatedAt: 150 },
    ];
    const plan = planPull(entries, { "l1:review": 250, "l1:practice": 290 }, { "l1:settings": 100 });
    expect(plan.keepLocal).toEqual(["l1:review"]); // local change at 250 beats the account's 200
    expect(plan.apply.map((e) => e.key)).toEqual(["l1:practice", "l1:mock:session"]); // 300 > 290; tombstone applied
  });
  it("push sends dirty keys with the current local value, or null when removed", () => {
    expect(planPush({ "l1:review": 5, "l1:mock:session": 6 }, { "l1:review": "r" })).toEqual([
      { key: "l1:review", value: "r", updatedAt: 5 },
      { key: "l1:mock:session", value: null, updatedAt: 6 },
    ]);
  });
  it("push result cleans accepted keys and adopts the account's value for refused ones", () => {
    const sent = [
      { key: "l1:review", value: "mine", updatedAt: 5 },
      { key: "l1:settings", value: "mine", updatedAt: 5 },
    ];
    const r = planPushResult(sent, ["l1:review"], [
      { key: "l1:review", value: "mine", updatedAt: 5 },
      { key: "l1:settings", value: "theirs", updatedAt: 9 },
    ]);
    expect(r.clean).toEqual({ "l1:review": 5 });
    expect(r.apply).toEqual([{ key: "l1:settings", value: "theirs", updatedAt: 9 }]);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  lintActionName,
  normalizeCard,
  parseWhenToDue,
  scoreActionability,
} from "./actionFrame.ts";

describe("lintActionName", () => {
  it("flags I-should intentions", () => {
    const lint = lintActionName("I should improve my consulting offer");
    assert.equal(lint.weak, true);
    assert.ok(lint.reasons.some((r) => /I should/i.test(r)));
  });

  it("accepts a verb with an object", () => {
    const lint = lintActionName("Draft a one-page offer for ops managers");
    assert.equal(lint.weak, false);
  });

  it("flags captured thoughts with no action", () => {
    const lint = lintActionName("Captured thought 1");
    assert.equal(lint.weak, true);
  });
});

describe("parseWhenToDue", () => {
  it("resolves today, tomorrow, and this week from the AWST calendar day", () => {
    assert.equal(parseWhenToDue("after today’s client work", "2026-08-29"), "2026-08-29");
    assert.equal(parseWhenToDue("tomorrow morning", "2026-08-29"), "2026-08-30");
    assert.equal(parseWhenToDue("this week", "2026-08-29"), "2026-09-01");
  });
});

describe("scoreActionability", () => {
  it("scores a complete card higher than a not-now", () => {
    const act = normalizeCard(
      {
        decision: "act",
        nextStep: "Send five tailored messages to existing contacts",
        timeOrTrigger: "tomorrow",
        definitionOfDone: "Five messages sent",
      },
      "2026-08-29",
    );
    const defer = normalizeCard({ decision: "not_now", nextStep: "Maybe later" }, "2026-08-29");
    assert.ok(scoreActionability(act) > scoreActionability(defer));
    assert.equal(act.due, "2026-08-30");
  });
});

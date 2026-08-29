import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessGoal,
  classifyGoalType,
  computeGenericMath,
  computeMoneyMath,
  computeServicesMath,
  diagnoseOutcome,
  inferMoneyModel,
  parseMoneyTarget,
} from "./goalCoach.ts";

describe("goal type and money parse", () => {
  it("classifies a $1M income statement as money", () => {
    assert.equal(classifyGoalType("I earn 1 million dollars"), "money");
    assert.equal(parseMoneyTarget("I earn 1 million dollars"), 1_000_000);
  });

  it("classifies a vague consulting offer as money so outcome lint can fire", () => {
    assert.equal(classifyGoalType("I should improve my consulting offer."), "money");
  });
});

describe("outcome diagnostics", () => {
  it("warns when the statement is hedged, vague, and unnumbered", () => {
    const notes = diagnoseOutcome("I should improve my consulting offer.");
    assert.ok(notes.some((n) => n.level === "warn" && /number/i.test(n.text)));
    assert.ok(notes.some((n) => /improve/i.test(n.text)));
    assert.ok(notes.some((n) => /should/i.test(n.text)));
  });
});

describe("feasibility maths", () => {
  it("stops a $1M services goal in 12 months on delivery capacity", () => {
    const result = computeServicesMath(1_000_000, 12);
    assert.equal(result.verdict?.level, "stop");
    assert.match(result.verdict?.text || "", /capacity/i);
    const load = result.rows.find((r) => /delivery load/i.test(r.label));
    assert.ok(load);
  });

  it("assessGoal attaches that stop to the $1M statement", () => {
    const coach = assessGoal("I earn 1 million dollars");
    assert.ok(coach);
    assert.equal(coach.type, "money");
    assert.equal(coach.feasibility?.model, "services");
    assert.equal(coach.feasibility?.verdict?.level, "stop");
    assert.ok(coach.obstacles.length >= 1);
    assert.equal(coach.phases.length, 3);
  });

  it("treats a SaaS $10M target as a distribution stop", () => {
    const result = computeMoneyMath({
      target: 10_000_000,
      months: 12,
      model: "subscription",
    });
    assert.equal(inferMoneyModel("SaaS MRR with 5% churn"), "subscription");
    assert.equal(result.verdict?.level, "stop");
    assert.match(result.verdict?.text || "", /visitors/i);
  });

  it("stops a generic goal with no weekly rate", () => {
    const result = computeGenericMath({
      targetQty: 100,
      unitLabel: "hours",
      current: 0,
      perWeek: 0,
      weeksAvailable: 12,
    });
    assert.equal(result.verdict?.level, "stop");
    assert.match(result.verdict?.text || "", /wish/i);
  });

  it("stops a generic goal whose rate misses the deadline", () => {
    const result = computeGenericMath({
      targetQty: 100,
      unitLabel: "hours",
      perWeek: 2,
      weeksAvailable: 12,
    });
    assert.equal(result.verdict?.level, "stop");
  });
});

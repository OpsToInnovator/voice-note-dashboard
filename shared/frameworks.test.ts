import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lintActionName } from "./actionFrame.ts";
import { CHANGE_THE_MODEL_STEP, MILLION_GOAL_CAPTURE } from "./goalCoach.ts";
import {
  FRAMEWORKS,
  DEFAULT_BIG_GOAL_FRAMEWORK,
  applyCoachToPlan,
  fixturePlan,
  isPlanningAsAvoidance,
  lintPlan,
  recommendFramework,
  resolveFrameworkId,
} from "./frameworks.ts";

describe("framework catalog", () => {
  it("ships seven ready-to-use frameworks", () => {
    assert.equal(FRAMEWORKS.length, 7);
    assert.ok(FRAMEWORKS.every((fw) => fw.fields.length > 0 && fw.challenge && fw.sequence));
  });

  it("defaults substantial goals to the one-page canvas", () => {
    assert.equal(DEFAULT_BIG_GOAL_FRAMEWORK, "goal_canvas");
  });
});

describe("recommendFramework", () => {
  it("routes known-but-avoided actions to WOOP", () => {
    const rec = recommendFramework(
      "I want to book five discovery calls but I overthink the wording and postpone sending it",
    );
    assert.equal(rec.id, "woop");
  });

  it("routes uncertain product work to agile decomposition", () => {
    const rec = recommendFramework(
      "I don't know yet if they would pay. Hypothesis: a prototype will show buying intent.",
    );
    assert.equal(rec.id, "agile_decomposition");
  });

  it("routes prove-myself scoreboard language to outcome–process–identity", () => {
    const rec = recommendFramework("Close three deals. It is draining because I am trying to prove myself.");
    assert.equal(rec.id, "outcome_process_identity");
  });

  it("routes a distant yearly ambition to a 12-week sprint", () => {
    const rec = recommendFramework("This year's ambition is too remote. I need a 12-week sprint.");
    assert.equal(rec.id, "twelve_week_sprint");
  });

  it("routes a dated destination to backward planning", () => {
    const rec = recommendFramework("By 30 November I will have sold three paid diagnostic engagements.");
    assert.equal(rec.id, "backward_planning");
  });

  it("routes a short I-should capture to the action frame", () => {
    const rec = recommendFramework("I should improve my consulting offer.");
    assert.equal(rec.id, "action_frame");
  });

  it("routes a $1M practice target to a 12-week sprint, not a single action", () => {
    const rec = recommendFramework(MILLION_GOAL_CAPTURE);
    assert.equal(rec.id, "twelve_week_sprint");
  });

  it("keeps a manual choice and notes what auto-route would have done", () => {
    const rec = resolveFrameworkId("I overthink outreach and postpone sending it", "goal_canvas");
    assert.equal(rec.id, "goal_canvas");
    assert.ok(rec.alternatives.some((a) => a.id === "woop"));
  });
});

describe("plan contract", () => {
  it("flags planning-as-avoidance first actions", () => {
    assert.equal(isPlanningAsAvoidance("Write a plan for the next quarter"), true);
    assert.equal(isPlanningAsAvoidance("Record a two-minute voice brief outlining the buyer problem"), false);
  });

  it("rejects a plan whose first action is more planning", () => {
    const plan = fixturePlan("goal_canvas", "2026-08-29");
    const bad = lintPlan({
      ...plan,
      firstAction: { ...plan.firstAction, nextStep: "Write a plan for the offer" },
    });
    assert.equal(bad.weak, true);
    assert.ok(bad.reasons.some((r) => /planning/i.test(r)));
  });

  it("every fixture plan ends in a lint-clean next action", () => {
    for (const fw of FRAMEWORKS) {
      const plan = fixturePlan(fw.id, "2026-08-29");
      assert.equal(plan.frameworkId, fw.id, fw.id);
      const actionLint = lintActionName(plan.firstAction.nextStep);
      assert.equal(actionLint.weak, false, `${fw.id}: ${plan.firstAction.nextStep}`);
      assert.equal(isPlanningAsAvoidance(plan.firstAction.nextStep), false, fw.id);
      assert.ok(plan.firstAction.timeOrTrigger, fw.id);
      assert.ok(plan.commitments.length <= 5, fw.id);
      assert.equal(plan.layers.length, fw.fields.length, fw.id);
    }
  });

  it("WOOP fixtures include an if–then", () => {
    const plan = fixturePlan("woop", "2026-08-29");
    assert.ok(plan.obstaclePlan?.trigger);
    assert.ok(plan.obstaclePlan?.response);
    assert.equal(plan.lint.weak, false);
  });

  it("overrides volume with a change-the-model action when goal maths stop", () => {
    const plan = applyCoachToPlan(
      fixturePlan("twelve_week_sprint", "2026-08-29"),
      MILLION_GOAL_CAPTURE,
      "2026-08-29",
    );
    assert.equal(plan.coach?.feasibility?.verdict?.level, "stop");
    assert.equal(plan.firstAction.nextStep, CHANGE_THE_MODEL_STEP);
    assert.equal(lintActionName(plan.firstAction.nextStep).weak, false);
    assert.match(plan.obstaclePlan?.trigger || "", /20 minutes refining/i);
    assert.match(plan.review, /change the model/i);
  });
});

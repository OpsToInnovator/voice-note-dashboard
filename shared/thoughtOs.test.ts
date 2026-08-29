import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lintActionName } from "./actionFrame.ts";
import {
  checkAgency,
  classifyFamily,
  classifyTier,
  fixtureThought,
  scoreSubstance,
} from "./thoughtOs.ts";

describe("thought operating system", () => {
  it("preserves the original pricing thought and reconstructs three meanings", () => {
    const original =
      "I keep thinking we should change how we price this because customers probably don’t understand what they’re actually buying.";
    const record = fixtureThought(original, "2026-08-29");
    assert.equal(record.original, original);
    assert.equal(record.agency.disposition, "develop");
    assert.equal(record.substance.verdict, "reconstruct");
    assert.equal(record.reconstructions.length, 3);
    assert.equal(record.destination, "EXPLORE");
    assert.equal(record.tier, 3);
    assert.ok(record.interpretation.parts.some((p) => p.kind === "observation"));
    assert.ok(record.container?.guardrails.some((g) => /no redesign before five interviews/i.test(g)));
  });

  it("does not execute a Tier-3 pricing decision even after meaning A is confirmed", () => {
    const original =
      "I keep thinking we should change how we price this because customers probably don’t understand what they’re actually buying.";
    const record = fixtureThought(original, "2026-08-29", "A");
    assert.equal(record.confirmedMeaningId, "A");
    assert.equal(record.destination, "DECIDE");
    assert.equal(record.tier, 3);
  });

  it("treats meaning B as exploration — missing evidence, not a price change", () => {
    const original =
      "I keep thinking we should change how we price this because customers probably don’t understand what they’re actually buying.";
    const record = fixtureThought(original, "2026-08-29", "B");
    assert.equal(record.destination, "EXPLORE");
    assert.equal(record.family, "strategic");
  });

  it("stores thoughts with no agency instead of turning them into projects", () => {
    const record = fixtureThought(
      "The market will do what it does this quarter. Nothing I can do about the weather around this deal.",
      "2026-08-29",
    );
    assert.equal(record.agency.canInfluence, false);
    assert.equal(record.destination, "STORE");
    assert.equal(record.firstAction, null);
  });

  it("deletes noise", () => {
    const record = fixtureThought("idk lol", "2026-08-29");
    assert.equal(record.destination, "DELETE");
    assert.equal(record.substance.verdict, "delete");
  });

  it("executes a low-risk reversible invoice send as Tier 1", () => {
    const record = fixtureThought("I should send the overdue invoice this afternoon.", "2026-08-29");
    assert.equal(record.tier, 1);
    assert.equal(record.destination, "EXECUTE");
    assert.ok(record.firstAction);
    assert.equal(lintActionName(record.firstAction.nextStep).weak, false);
  });

  it("routes recurring avoidance to the behavioural kit, not a new strategy project", () => {
    const record = fixtureThought(
      "I want to book five discovery calls this month but I overthink the wording of outreach and postpone sending it.",
      "2026-08-29",
    );
    assert.equal(record.family, "behavioural");
    assert.ok(record.stressKit.some((s) => /implementation/i.test(s)));
    assert.equal(record.destination, "EXECUTE");
  });
});

describe("gates without AI", () => {
  it("classifies family, agency, substance, and tier from the text alone", () => {
    assert.equal(classifyFamily("customers don't understand the offer"), "strategic");
    assert.equal(checkAgency("Nothing I can do about the weather around this deal").disposition, "accept");
    assert.equal(scoreSubstance("idk lol").verdict, "delete");
    assert.equal(classifyTier("change how we price this"), 3);
    assert.equal(classifyTier("send the invoice"), 1);
  });
});

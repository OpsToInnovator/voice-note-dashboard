import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MILLION_GOAL_CAPTURE } from "../shared/goalCoach.ts";
import type { IntelligenceReport } from "../shared/schema.ts";
import {
  fixtureClassifyResult,
  fixtureIntelligenceReport,
  fixtureProcessingResult,
  fixtureProjects,
  fixtureTitleResult,
  fixtureVoiceNotes,
  isResurfaceFixture,
} from "./intelligenceFixture.ts";

const FAKE_WEEKLY = /completion rate|tasks done|overdue count|wins this week|14 days|lcm analysis/i;
const CLAIMS_HOSTED_PRODUCT = /\b(is AFOS|is Paradigm|free AFOS|Lens is AFOS)\b/i;

function assertIntelligenceShape(report: IntelligenceReport) {
  assert.equal(typeof report.summary, "string");
  assert.ok(report.summary.length > 0);
  assert.equal(typeof report.primaryFocus.title, "string");
  assert.equal(typeof report.primaryFocus.reasoning, "string");
  assert.equal(typeof report.primaryFocus.connectedGoal, "string");
  assert.equal(typeof report.patternInsight.observation, "string");
  assert.ok(Array.isArray(report.patternInsight.evidence));
  assert.equal(typeof report.riskFlag.item, "string");
  assert.equal(typeof report.riskFlag.reason, "string");
  assert.equal(typeof report.riskFlag.suggestedAction, "string");
  assert.equal(typeof report.momentumWin.achievement, "string");
  assert.equal(typeof report.momentumWin.leverage, "string");
  assert.equal(typeof report.weeklyPriority.focus, "string");
  assert.equal(typeof report.weeklyPriority.reasoning, "string");
  assert.equal(typeof report.systemAudit.summary, "string");
  assert.ok(Array.isArray(report.systemAudit.items));
  assert.equal(typeof report.generatedAt, "string");
}

describe("isResurfaceFixture", () => {
  it("is true when RESURFACE_FIXTURE is set", () => {
    assert.equal(isResurfaceFixture({ RESURFACE_FIXTURE: "overflow" }), true);
    assert.equal(isResurfaceFixture({ RESURFACE_FIXTURE: "healthy" }), true);
  });

  it("is false when unset or blank", () => {
    assert.equal(isResurfaceFixture({}), false);
    assert.equal(isResurfaceFixture({ RESURFACE_FIXTURE: "" }), false);
    assert.equal(isResurfaceFixture({ RESURFACE_FIXTURE: "   " }), false);
  });
});

describe("fixtureIntelligenceReport", () => {
  it("returns a valid IntelligenceReport with usedFixture", () => {
    const now = new Date("2026-08-30T15:00:00.000Z");
    const report = fixtureIntelligenceReport(now);
    assertIntelligenceShape(report);
    assert.equal(report.usedFixture, true);
    assert.equal(report.generatedAt, "2026-08-30T15:00:00.000Z");
  });

  it("does not invent operator projects or fake weekly metrics", () => {
    const report = fixtureIntelligenceReport();
    assert.equal(report.systemAudit.items.length, 1);
    assert.equal(report.systemAudit.items[0]?.name, "No operator workspace");
    assert.match(report.systemAudit.summary, /no operator workspace/i);
    assert.equal(report.primaryFocus.connectedGoal, "");
    const blob = JSON.stringify(report);
    assert.equal(FAKE_WEEKLY.test(blob), false);
  });

  it("points at Think as the proof, not AFOS or Paradigm or LCM", () => {
    const report = fixtureIntelligenceReport();
    assert.match(report.summary, /Think/);
    assert.match(report.primaryFocus.title, /Think/);
    assert.match(report.primaryFocus.reasoning, /DECIDE/);
    assert.match(report.primaryFocus.reasoning, new RegExp(MILLION_GOAL_CAPTURE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(report.patternInsight.observation, /not AFOS or Paradigm/);
    assert.match(report.riskFlag.item, /longitudinal cognitive modelling/i);
    assert.match(report.riskFlag.suggestedAction, /Think/);
    const blob = [
      report.summary,
      report.primaryFocus.title,
      report.primaryFocus.reasoning,
      report.patternInsight.observation,
      report.momentumWin.achievement,
      report.weeklyPriority.focus,
    ].join(" ");
    assert.equal(CLAIMS_HOSTED_PRODUCT.test(blob), false);
  });
});

describe("sibling fixture payloads", () => {
  it("returns empty projects and voice notes", () => {
    assert.deepEqual(fixtureProjects(), []);
    assert.deepEqual(fixtureVoiceNotes(), []);
  });

  it("returns empty classify / title / process results with usedFixture", () => {
    const classified = fixtureClassifyResult();
    assert.deepEqual(classified.classified, []);
    assert.equal(classified.count, 0);
    assert.equal(classified.usedFixture, true);

    const titled = fixtureTitleResult();
    assert.deepEqual(titled.titled, []);
    assert.equal(titled.count, 0);
    assert.equal(titled.usedFixture, true);

    const processed = fixtureProcessingResult();
    assert.equal(processed.notesProcessed, 0);
    assert.equal(processed.tasksCreated, 0);
    assert.equal(processed.notesTitled, 0);
    assert.deepEqual(processed.details, []);
    assert.deepEqual(processed.titledNotes, []);
    assert.equal(processed.usedFixture, true);
  });
});

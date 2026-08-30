import { MILLION_GOAL_CAPTURE } from "../shared/goalCoach";
import type { IntelligenceReport, ProcessingResult } from "../shared/schema";

/** Public demo (`RESURFACE_FIXTURE` set). No Notion. No OpenAI. */
export function isResurfaceFixture(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean((env.RESURFACE_FIXTURE || "").trim());
}

/**
 * Honest public-plant Intelligence. Not a fake weekly report.
 * Think is the proof. Operator Intelligence stays on the private host.
 */
export function fixtureIntelligenceReport(now: Date = new Date()): IntelligenceReport {
  return {
    summary:
      "This host has no Notion workspace and no OpenAI. Intelligence is an operator surface. The proof on this plant is Think: capture a thought, get a destination, see inbox overflow. This page does not invent a weekly report from live data.",
    primaryFocus: {
      title: "Think is the demo",
      reasoning: `Open Think and run the $1M this year chip (${MILLION_GOAL_CAPTURE}). Destination DECIDE — capacity stop — is the proof. Code owns the gate.`,
      connectedGoal: "",
    },
    patternInsight: {
      observation:
        "Operator Intelligence stays on the private host with Notion and a model key. This public plant is a thought OS demo, not AFOS or Paradigm.",
      evidence: [
        "RESURFACE_FIXTURE is set. There is no live workspace on this host.",
        "Think, overflow Inbox, and destinations already run without Notion.",
      ],
    },
    riskFlag: {
      item: "Treating this page as live operator intelligence or longitudinal cognitive modelling",
      reason:
        "There is no operator data here. A weekly report generated from nothing would be fiction.",
      suggestedAction: "Use Think. Do not treat this as LCM or a live weekly review.",
    },
    momentumWin: {
      achievement: "Think and overflow Inbox already work on this host",
      leverage: "That is the forty-second proof. Capture, destination, graveyard.",
    },
    weeklyPriority: {
      focus: "Stay on Think. Process Inbox first.",
      reasoning:
        "One outbound after the public URL is locked — not a fake weekly priority from invented data.",
    },
    systemAudit: {
      summary: "No operator workspace on this host. There are no projects or goals to audit.",
      items: [
        {
          name: "No operator workspace",
          currentType: "Project",
          recommendation: "archive",
          reasoning:
            "This public plant has no Notion Apex Hub. There are no projects to keep, merge, or demote.",
          actionRequired: "Use Think. Operator Intelligence stays on the private host.",
        },
      ],
    },
    generatedAt: now.toISOString(),
    usedFixture: true,
  };
}

export function fixtureProjects(): [] {
  return [];
}

export function fixtureVoiceNotes(): [] {
  return [];
}

export function fixtureClassifyResult(): { classified: []; count: 0; usedFixture: true } {
  return { classified: [], count: 0, usedFixture: true };
}

export function fixtureTitleResult(): { titled: []; count: 0; usedFixture: true } {
  return { titled: [], count: 0, usedFixture: true };
}

export function fixtureProcessingResult(): ProcessingResult {
  return {
    notesProcessed: 0,
    tasksCreated: 0,
    notesTitled: 0,
    details: [],
    titledNotes: [],
    usedFixture: true,
  };
}

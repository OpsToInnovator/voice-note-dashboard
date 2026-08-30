import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INBOX_AUDIT_FIXTURE_TODAY,
  INBOX_AUDIT_WINDOW_DAYS,
  bestContainerMatch,
  buildInboxAuditFixture,
  composeWeeklyInboxAudit,
  decideInboxVerdict,
  formatInboxAuditLog,
  isInWeeklyWindow,
  isStrongMatch,
  isUncontained,
  looksLikeRemovePile,
  proposeContainer,
  type InboxContainer,
  type InboxTask,
} from "./inboxAudit.ts";

const TODAY = INBOX_AUDIT_FIXTURE_TODAY;

function task(partial: Partial<InboxTask> & Pick<InboxTask, "id" | "name">): InboxTask {
  return {
    status: "To Do",
    due: null,
    created: `${TODAY}T00:00:00.000Z`,
    lastEdited: `${TODAY}T00:00:00.000Z`,
    url: `https://www.notion.so/${partial.id}`,
    archived: false,
    hasProject: false,
    hasGoal: false,
    hasReason: false,
    ...partial,
  };
}

const containers: InboxContainer[] = [
  { id: "proj-apexform-life", name: "ApexForm Life", kind: "project" },
  { id: "proj-prospect-skill", name: "Prospect Skill", kind: "project" },
  { id: "goal-consulting", name: "Build consulting practice", kind: "goal" },
  { id: "reason-growth", name: "Growth", kind: "reason" },
];

describe("isUncontained", () => {
  it("treats an open task with no project, goal, or reason as uncontained", () => {
    assert.equal(isUncontained(task({ id: "t1", name: "Loose capture" })), true);
  });

  it("treats a dated task without a home as uncontained", () => {
    assert.equal(
      isUncontained(task({ id: "t2", name: "Dated but loose", due: "2026-08-31" })),
      true,
    );
  });

  it("is contained when any of project, goal, or reason is set", () => {
    assert.equal(isUncontained(task({ id: "t3", name: "P", hasProject: true })), false);
    assert.equal(isUncontained(task({ id: "t4", name: "G", hasGoal: true })), false);
    assert.equal(isUncontained(task({ id: "t5", name: "R", hasReason: true })), false);
  });

  it("skips done and archived", () => {
    assert.equal(isUncontained(task({ id: "t6", name: "Done", status: "Done" })), false);
    assert.equal(isUncontained(task({ id: "t7", name: "Gone", archived: true })), false);
  });
});

describe("weekly window", () => {
  it("counts created or last-edited inside 7 days as new", () => {
    assert.equal(
      isInWeeklyWindow(
        { created: "2026-08-28T00:00:00.000Z", lastEdited: "2026-08-28T00:00:00.000Z" },
        TODAY,
      ),
      true,
    );
    assert.equal(INBOX_AUDIT_WINDOW_DAYS, 7);
  });

  it("treats older untouched work as leftover", () => {
    assert.equal(
      isInWeeklyWindow(
        { created: "2026-08-10T00:00:00.000Z", lastEdited: "2026-08-12T00:00:00.000Z" },
        TODAY,
      ),
      false,
    );
  });

  it("keeps a leftover in the window if it was edited this week", () => {
    assert.equal(
      isInWeeklyWindow(
        { created: "2026-07-01T00:00:00.000Z", lastEdited: "2026-08-29T00:00:00.000Z" },
        TODAY,
      ),
      true,
    );
  });
});

describe("token overlap matching", () => {
  it("assigns the company application to ApexForm Life", () => {
    const match = bestContainerMatch(
      "Complete company application form for apexform life",
      containers,
    );
    assert.ok(match);
    assert.equal(match?.name, "ApexForm Life");
    assert.equal(match?.kind, "project");
  });

  it("assigns Prospect Skill work to that project", () => {
    const match = bestContainerMatch("Use Prospect Skill for Sukunj Mendpara", containers);
    assert.ok(match);
    assert.equal(match?.name, "Prospect Skill");
  });

  it("does not weakly match emotional intelligence to consulting or growth", () => {
    assert.equal(isStrongMatch("Read about emotional intelligence", "Build consulting practice"), false);
    assert.equal(isStrongMatch("Read about emotional intelligence", "Growth"), false);
    assert.equal(isStrongMatch("Read about emotional intelligence", "ApexForm Life"), false);
  });
});

describe("verdicts from the Apex Hub screenshot", () => {
  it("removes Read Later and undirected research", () => {
    assert.equal(looksLikeRemovePile("Read Later"), true);
    assert.equal(looksLikeRemovePile("Read about emotional intelligence"), true);
    assert.equal(decideInboxVerdict(task({ id: "a", name: "Read Later" }), containers).verdict, "remove");
    assert.equal(
      decideInboxVerdict(task({ id: "b", name: "Read about emotional intelligence" }), containers).verdict,
      "remove",
    );
  });

  it("assigns screenshot titles that overlap existing projects", () => {
    assert.equal(
      decideInboxVerdict(
        task({ id: "c", name: "Use Prospect Skill for Sukunj Mendpara" }),
        containers,
      ).verdict,
      "assign",
    );
    assert.equal(
      decideInboxVerdict(
        task({ id: "d", name: "Complete company application form for apexform life" }),
        containers,
      ).match?.name,
      "ApexForm Life",
    );
  });

  it("recalibrates Remind Olivia when there is no Olivia container", () => {
    const decided = decideInboxVerdict(task({ id: "e", name: "Remind Olivia…" }), containers);
    assert.equal(decided.verdict, "recalibrate");
    assert.equal(decided.proposedContainer?.name, "Olivia");
    assert.equal(decided.proposedContainer?.kind, "project");
  });

  it("lets a strong match beat a read-about pile", () => {
    const withHome = [
      ...containers,
      { id: "proj-ei", name: "Emotional Intelligence", kind: "project" },
    ];
    const decided = decideInboxVerdict(
      task({ id: "f", name: "Read about emotional intelligence" }),
      withHome,
    );
    assert.equal(decided.verdict, "assign");
    assert.equal(decided.match?.name, "Emotional Intelligence");
  });
});

describe("proposeContainer", () => {
  it("pulls the person or target out of remind / use-for / complete-for titles", () => {
    assert.equal(proposeContainer("Remind Olivia…").name, "Olivia");
    assert.equal(proposeContainer("Use Prospect Skill for Sukunj Mendpara").name, "Sukunj Mendpara");
    assert.equal(
      proposeContainer("Complete company application form for apexform life").name.toLowerCase(),
      "apexform life",
    );
  });
});

describe("composeWeeklyInboxAudit fixture", () => {
  it("uses the screenshot inbox as cases and splits new vs leftover", () => {
    const { tasks, containers: fixtureContainers } = buildInboxAuditFixture();
    const report = composeWeeklyInboxAudit(tasks, fixtureContainers, {
      dateLabel: "30 Aug 2026",
      nowIso: "2026-08-30T07:00:00.000Z",
      todayStr: TODAY,
    });

    const byName = (name: string) =>
      [...report.newItems, ...report.leftoverItems].find((i) => i.name === name);

    assert.equal(byName("Read about emotional intelligence")?.verdict, "remove");
    assert.equal(byName("Read Later")?.verdict, "remove");
    assert.equal(byName("Use Prospect Skill for Sukunj Mendpara")?.verdict, "assign");
    assert.equal(byName("Use Prospect Skill for Sukunj Mendpara")?.due, "2026-09-02");
    assert.equal(byName("Complete company application form for apexform life")?.verdict, "assign");
    assert.equal(byName("Remind Olivia…")?.verdict, "recalibrate");
    assert.equal(byName("Draft partnership note for local gym")?.cohort, "leftover");
    assert.equal(byName("Draft partnership note for local gym")?.verdict, "recalibrate");

    assert.ok(!report.newItems.some((i) => i.name === "Ship weekly update"));
    assert.ok(!report.leftoverItems.some((i) => i.name === "Already shipped"));
    assert.equal(report.stats.newlyAdded, 5);
    assert.equal(report.stats.leftover, 1);
    assert.equal(report.stats.uncontained, 6);
    assert.match(formatInboxAuditLog(report), /No writes/);
    assert.match(formatInboxAuditLog(report), /Remind Olivia/);
  });
});

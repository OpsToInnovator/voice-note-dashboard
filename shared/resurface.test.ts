import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INBOX_CAP,
  OPEN_TODAY_LIMIT,
  ageDays,
  buildFixtureCaptures,
  classifyCapture,
  composeDailyResurface,
  isInboxOverflow,
  partitionBuckets,
  type RawCapture,
} from "./resurface.ts";

const TODAY = "2026-08-29";

function capture(partial: Partial<RawCapture> & Pick<RawCapture, "id" | "name" | "source">): RawCapture {
  return {
    status: "",
    due: null,
    created: `${TODAY}T00:00:00.000Z`,
    lastEdited: `${TODAY}T00:00:00.000Z`,
    url: `https://www.notion.so/${partial.id}`,
    priority: "",
    type: "",
    hasProject: false,
    hasTag: false,
    hasPerson: false,
    archived: false,
    noteType: "",
    ...partial,
  };
}

describe("inbox cap", () => {
  it("does not overflow at the cap", () => {
    assert.equal(isInboxOverflow(INBOX_CAP), false);
    assert.equal(isInboxOverflow(15), false);
  });

  it("overflows above ~15", () => {
    assert.equal(isInboxOverflow(16), true);
    assert.equal(isInboxOverflow(23), true);
  });
});

describe("classifyCapture", () => {
  it("treats unfiled notes as inbox", () => {
    const note = capture({ id: "n1", name: "Quick thought", source: "note" });
    assert.equal(classifyCapture(note, TODAY), "inbox");
  });

  it("skips filed notes and voice notes", () => {
    assert.equal(
      classifyCapture(capture({ id: "n2", name: "Voice", source: "note", noteType: "Voice Note" }), TODAY),
      "skip",
    );
    assert.equal(
      classifyCapture(capture({ id: "n3", name: "Tagged", source: "note", hasTag: true }), TODAY),
      "skip",
    );
  });

  it("treats doing or due-today tasks as open today", () => {
    assert.equal(
      classifyCapture(capture({ id: "t1", name: "Ship", source: "task", status: "Doing", hasProject: true }), TODAY),
      "today",
    );
    assert.equal(
      classifyCapture(capture({ id: "t2", name: "Due", source: "task", due: TODAY, hasProject: true }), TODAY),
      "today",
    );
  });

  it("treats overdue tasks as stale even if they have a project", () => {
    assert.equal(
      classifyCapture(
        capture({ id: "t3", name: "Late", source: "task", due: "2026-08-20", hasProject: true }),
        TODAY,
      ),
      "stale",
    );
  });

  it("treats undated unassigned tasks as inbox", () => {
    assert.equal(
      classifyCapture(capture({ id: "t4", name: "Loose", source: "task", status: "To Do" }), TODAY),
      "inbox",
    );
  });

  it("skips future dated work", () => {
    assert.equal(
      classifyCapture(
        capture({ id: "t5", name: "Later", source: "task", due: "2026-10-01", hasProject: true }),
        TODAY,
      ),
      "skip",
    );
  });
});

describe("composeDailyResurface", () => {
  it("leads with inbox when the graveyard threshold is crossed", () => {
    const buckets = partitionBuckets(buildFixtureCaptures("overflow"), TODAY);
    const report = composeDailyResurface(buckets, {
      dateLabel: "29 Aug 2026",
      nowIso: "2026-08-29T23:00:00.000Z",
    });

    assert.equal(report.lead, "inbox_overflow");
    assert.equal(report.inbox.overflow, true);
    assert.ok(report.inbox.count > INBOX_CAP);
    assert.match(report.headline, /backed up/i);
    assert.match(report.summary, /Process Inbox first/i);
    assert.equal(report.inbox.items[0]?.name, "Captured thought 1");
    assert.ok(report.openToday.length <= OPEN_TODAY_LIMIT);
  });

  it("leads with today when inbox is under the cap", () => {
    const buckets = partitionBuckets(buildFixtureCaptures("healthy"), TODAY);
    const report = composeDailyResurface(buckets, {
      dateLabel: "29 Aug 2026",
      nowIso: "2026-08-29T23:00:00.000Z",
    });

    assert.equal(report.lead, "today");
    assert.equal(report.inbox.overflow, false);
    assert.ok(report.inbox.count <= INBOX_CAP);
    assert.ok(report.openToday.length > 0);
    assert.equal(report.openToday[0]?.name, "Ship resurface job");
    assert.ok(report.stale.some((item) => item.name === "Renew domain"));
    assert.ok(report.stale.some((item) => item.name === "Quote from podcast"));
  });

  it("keeps the open-today list short and ranks doing / high priority first", () => {
    const buckets = partitionBuckets(buildFixtureCaptures("overflow"), TODAY);
    const report = composeDailyResurface(buckets, {
      dateLabel: "29 Aug 2026",
      nowIso: "2026-08-29T23:00:00.000Z",
    });

    assert.ok(report.openToday.length <= OPEN_TODAY_LIMIT);
    assert.equal(report.openToday[0]?.status, "Doing");
    assert.equal(report.openToday[0]?.name, "Ship resurface job");
    assert.ok(!report.openToday.some((item) => item.name === "zzz should be capped out"));
  });

  it("does not quietly bury overflow behind today's work", () => {
    const buckets = partitionBuckets(buildFixtureCaptures("overflow"), TODAY);
    const report = composeDailyResurface(buckets, {
      dateLabel: "29 Aug 2026",
      nowIso: "2026-08-29T23:00:00.000Z",
    });

    assert.notEqual(report.lead, "today");
    assert.ok(report.inbox.items.length >= report.openToday.length);
    assert.ok(report.inbox.items.length > 15);
  });
});

describe("ageDays", () => {
  it("counts calendar days from an ISO timestamp", () => {
    assert.equal(ageDays("2026-08-20T15:00:00.000Z", TODAY), 9);
    assert.equal(ageDays(TODAY, TODAY), 0);
  });
});

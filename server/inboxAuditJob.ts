import "dotenv/config";
import { runInboxAuditJob } from "./inboxAudit";

// Scheduled job: list uncontained Inbox tasks and recommended verdicts.
// Does not write. Confirm in Standup or POST /api/inbox-audit/apply.
// Railway/Render cron: `node dist/inbox-audit.cjs`
// Sunday 07:00 Australia/Perth (AWST, UTC+8, no DST) = Saturday 23:00 UTC
// → `0 23 * * 6`

async function main() {
  const report = await runInboxAuditJob();
  if (process.env.INBOX_AUDIT_JSON === "1") {
    console.log("\n--- json ---");
    console.log(JSON.stringify(report, null, 2));
  }
  void report;
  process.exit(0);
}

main().catch((err) => {
  console.error("Weekly inbox audit job failed:", err);
  process.exit(1);
});

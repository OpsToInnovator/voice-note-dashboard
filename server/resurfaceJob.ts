import "dotenv/config";
import { runResurfaceJob } from "./resurface";

// Scheduled job: read Notion buckets and print the short list.
// Railway/Render cron: `node dist/resurface.cjs`
// 7am Australia/Perth (AWST, UTC+8, no DST) = 23:00 UTC → `0 23 * * *`

async function main() {
  const report = await runResurfaceJob();
  if (process.env.RESURFACE_JSON === "1") {
    console.log("\n--- json ---");
    console.log(JSON.stringify(report, null, 2));
  }
  // Overflow is a product signal, not a job failure. Cron should stay green.
  void report;
  process.exit(0);
}

main().catch((err) => {
  console.error("Daily resurface job failed:", err);
  process.exit(1);
});
